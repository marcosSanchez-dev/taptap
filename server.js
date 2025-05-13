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

// Función para broadcast a todos los clientes
function broadcastState() {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "state", ...gameState }));
    }
  });
}

// Función para reiniciar el juego
function resetGame() {
  gameState = {
    active: false,
    timeLeft: 10,
    players: {
      1: { taps: 0 },
      2: { taps: 0 },
    },
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

        case "reset":
          resetGame();
          break;
      }

      // Enviar OSC y actualizar clientes
      if (data.osc) oscClient.send(data.osc.address, data.osc.value);
      broadcastState();
    } catch (error) {
      console.error("[SERVER] Error:", error);
    }
  });
});

// Temporizador del juego
function startGameTimer() {
  const timer = setInterval(() => {
    if (gameState.active) {
      gameState.timeLeft--;

      if (gameState.timeLeft <= 0) {
        gameState.active = false;
        clearInterval(timer);
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
    broadcastState();
  }
}

app.use(express.static("public"));
app.listen(3000, "0.0.0.0", () => console.log("Servidor en puerto 3000"));
