const express = require("express");
const WebSocket = require("ws");
const OSC = require("node-osc");

const app = express();
const wss = new WebSocket.Server({ port: 8080 });

// Configuración CORRECTA del cliente OSC
const oscClient = new OSC.Client("127.0.0.1", 8880);

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      console.log(`[SERVER] Recibido: ${data.address} = ${data.value}`);

      // Enviar con manejo de errores en el callback
      oscClient.send(data.address, data.value, (err) => {
        if (err) {
          console.error("[OSC] Error de envío:", err);
        } else {
          console.log(
            `[OSC] Enviado a MadMapper: ${data.address} ${data.value}`
          );
        }
      });
    } catch (error) {
      console.error("[SERVER] Error procesando mensaje:", error);
    }
  });
});

app.use(express.static("public"));
app.listen(3000, () => console.log("Servidor en puerto 3000"));
