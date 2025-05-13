const express = require("express");
const WebSocket = require("ws");
const OSC = require("node-osc");

const app = express();
const wss = new WebSocket.Server({ port: 8080 });
const oscClient = new OSC.Client("192.168.68.101", 8880);

// Estado del juego
let gameState = {
  active: false,
  timeLeft: 10,
  players: {
    1: { taps: 0 },
    2: { taps: 0 },
  },
  winner: null,
};
// Agregar al inicio del server.js
let gameTimer = null;

// Función para broadcast a todos los clientes
function broadcastState() {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "state", ...gameState }));
    }
  });
}

function resetGame() {
  if (gameTimer) {
    clearInterval(gameTimer);
    gameTimer = null;
  }

  gameState = {
    active: false,
    timeLeft: 10,
    players: { 1: { taps: 0 }, 2: { taps: 0 } },
    winner: null,
  };
  broadcastState();
}

wss.on("connection", (ws) => {
  // Enviar estado actual al nuevo cliente
  ws.send(JSON.stringify({ type: "state", ...gameState }));

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);

      if (data.osc) {
        oscClient.send(data.osc.address, data.osc.value);
      }

      // Manejar diferentes tipos de mensajes
      switch (data.type) {
        case "start":
          gameState.active = true;
          gameState.winner = null;
          startGameTimer();
          break;

        case "tap":
          if (gameState.active) {
            gameState.players[data.player].taps++;
            checkWinCondition(data.player);
          }
          break;

        // En el switch(message.type):
        case "reset":
          resetGame();
          // Enviar comando OSC de reset
          [1, 2].forEach((player) => {
            oscClient.send(`/win/${player}`, 0); // ← Dirección corregida
            oscClient.send(`/progress/${player}`, 0);
          });
          break;
      }

      // Enviar OSC y actualizar clientes
      // if (data.osc) oscClient.send(data.osc.address, data.osc.value);
      broadcastState();
    } catch (error) {
      console.error("[SERVER] Error:", error);
    }
  });
});

// Temporizador del juego
function startGameTimer() {
  // Limpiar timer existente
  if (gameTimer) {
    clearInterval(gameTimer);
    gameTimer = null;
  }

  gameTimer = setInterval(() => {
    if (gameState.active) {
      gameState.timeLeft--;

      // En startGameTimer():
      if (gameState.timeLeft <= 0) {
        gameState.active = false;
        // Agregar notificación OSC
        oscClient.send("/lose", 1);
        clearInterval(gameTimer);
        gameTimer = null;
      }
      broadcastState();
    }
  }, 1000);
}

// Verificar condición de victoria
function checkWinCondition(player) {
  if (gameState.players[player].taps >= 40) {
    gameState.active = false;
    gameState.winner = player;
    if (gameTimer) {
      clearInterval(gameTimer);
      gameTimer = null;
    }
    broadcastState();
  }
}

app.use(express.static("public"));
app.listen(3000, "0.0.0.0", () => console.log("Servidor en puerto 3000"));
