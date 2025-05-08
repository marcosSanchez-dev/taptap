const express = require("express");
const WebSocket = require("ws");
const OSC = require("node-osc");

const app = express();
const wss = new WebSocket.Server({ port: 8080 });

// Configuración CORRECTA del cliente OSC
// const oscClient = new OSC.Client("127.0.0.1", 8880);
const oscClient = new OSC.Client("192.168.68.101", 8880);

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);

      // Todos los mensajes OSC pasan por aquí
      oscClient.send(data.address, data.value);
      console.log(`[OSC] Enviado: ${data.address} ${data.value}`);
    } catch (error) {
      console.error("[SERVER] Error:", error);
    }
  });
});

app.use(express.static("public"));
app.listen(3000, "0.0.0.0", () => console.log("Servidor en puerto 3000"));
