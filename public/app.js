const serverIP = window.location.hostname;
const ws = new WebSocket("ws://" + serverIP + ":8080");

// Por esta versión adaptativa
// const wsProtocol = window.location.protocol === "https:" ? "wss://" : "ws://";
// const wsHost =
//   window.location.hostname === "localhost"
//     ? "localhost:8080"
//     : window.location.host;
// const ws = new WebSocket(`${wsProtocol}${wsHost}`);

// Variables globales
// Eliminar estas variables duplicadas
// let gameActive = false;
// let timeLeft = 10;
// let tapsRequired = 40;
// let currentTaps = 0;
// let timerId = null;

let timerId = null; // Agregar esta línea

const players = {
  1: {
    progressBar: "progress-bar1",
    countElement: "tapsCount1",
    logo: "logo1",
  },
  2: {
    progressBar: "progress-bar2",
    countElement: "tapsCount2",
    logo: "logo2",
  },
};

// Elementos del DOM
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const gameContainer = document.getElementById("gameContainer");
const timerDisplay = document.getElementById("timer");
const tapsCount = document.getElementById("tapsCount");
const tapsTotal = document.getElementById("tapsTotal");
const resultMessage = document.getElementById("resultMessage");

let activeTouches = new Map();
const TAP_INTERVAL = 30; // 30ms entre taps (más rápido que el delay nativo)
const connectionStatus = document.createElement("div");
connectionStatus.className = "connection-status";
document.body.appendChild(connectionStatus);

// Estado inicial
startBtn.classList.remove("hidden");
restartBtn.classList.add("hidden");
gameContainer.classList.add("hidden");
resultMessage.textContent = "";

// Event Listeners
startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", resetGame);
document
  .querySelector(".player-1")
  .addEventListener("touchstart", (e) => handlePlayerTouch(e, 1));
document
  .querySelector(".player-2")
  .addEventListener("touchstart", (e) => handlePlayerTouch(e, 2));
// document.body.addEventListener("touchend", handleTouchEnd);
// document.body.addEventListener("touchcancel", handleTouchEnd);

// Añade esta función en tu app.js
function updateUI() {
  // Actualizar contadores
  document.getElementById("tapsCount1").textContent = gameState.players[1].taps;
  document.getElementById("tapsCount2").textContent = gameState.players[2].taps;

  // Actualizar timers
  document.getElementById("timer1").textContent = gameState.timeLeft;
  document.getElementById("timer2").textContent = gameState.timeLeft;

  // Actualizar progress bars
  updateProgress(1);
  updateProgress(2);

  // Determinar estados clave
  const gameEnded =
    !!gameState.winner || (!gameState.active && gameState.timeLeft <= 0);

  // Modificar la detección de estado inicial
  const initialState =
    !gameState.active &&
    gameState.timeLeft === 10 &&
    gameState.players[1].taps === 0 &&
    gameState.players[2].taps === 0;

  // Manejar visibilidad de elementos
  startBtn.classList.toggle("hidden", !initialState);
  restartBtn.classList.toggle("hidden", !gameEnded);
  gameContainer.classList.toggle("hidden", !gameState.active);
  resultMessage.style.display = gameEnded ? "block" : "none";

  // Configurar mensajes
  if (gameState.winner) {
    resultMessage.textContent = `PLAYER ${gameState.winner} WINS! 🎉`;
    resultMessage.className = "win-message";
  } else if (gameEnded) {
    resultMessage.textContent = "TIME'S UP! ⏳";
    resultMessage.className = "lose-message";
  }
}

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === "state") {
    gameState = data;
    updateUI();
  }
};

function handlePlayerTouch(e, player) {
  if (!gameState.active || gameState.winner) return;

  e.preventDefault();
  const touch = e.changedTouches[0];
  registerTap(player, touch.pageX, touch.pageY);
}
// Modificar las funciones de interacción
function registerTap(player, x, y) {
  if (gameState.players[player].taps >= 40) return; // Usar estado del servidor

  ws.send(
    JSON.stringify({
      type: "tap",
      player: player,
      osc: {
        address: `/progress/${player}`,
        value: (gameState.players[player].taps + 1) / 40,
      },
    })
  );

  createParticles(x, y, player);
  animateLogo(player);
}

function startGame() {
  // gameActive = true;
  // timeLeft = 10; // Resetear tiempo
  // tapsRequired = 40; // Fijar valor requerido
  ws.send(JSON.stringify({ type: "start" }));

  // if (timerId) clearInterval(timerId);

  // Resetear ambos jugadores
  Object.keys(players).forEach((p) => {
    players[p].taps = 0;
  });

  // Configurar UI inicial
  startBtn.classList.add("hidden");
  gameContainer.classList.remove("hidden");
  resultMessage.style.display = "none";

  ws.send(JSON.stringify({ address: "/start", value: 1 }));

  // Resetear valores
  timeLeft = 10;
  currentTaps = 0;
  updateUI();

  // Temporizador
  // timerId = setInterval(() => {
  //   if (timeLeft > 0) {
  //     timeLeft--;
  //     document.getElementById("timer1").textContent = timeLeft;
  //     document.getElementById("timer2").textContent = timeLeft;
  //   } else {
  //     endGame(false);
  //     clearInterval(timerId);
  //   }
  // }, 1000);
}

function createParticles(x, y, player) {
  const colorConfig =
    player === 1
      ? { primary: "#00ff88", shadow: "0, 255, 136" }
      : { primary: "#ff0096", shadow: "255, 0, 150" };

  const now = Date.now();
  if (gameState.serverTime) {
    const latency = Date.now() - gameState.serverTime;
    x = x + latency * 0.05; // Ajuste predictivo básico
  }

  for (let i = 0; i < 10; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";

    // Estilo con color del jugador
    particle.style.backgroundColor = colorConfig.primary;
    particle.style.boxShadow = `0 0 15px rgba(${colorConfig.shadow}, 0.5)`;

    // Posicionamiento
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.width = `${Math.random() * 10 + 5}px`;
    particle.style.height = particle.style.width;

    document.querySelector(".particle-container").appendChild(particle);

    // Animación con parámetros ajustados
    const angle = Math.random() * 360 * (Math.PI / 180);
    const velocity = Math.random() * 150 + 50; // Más dramática

    anime({
      targets: particle,
      opacity: [1, 0],
      translateX: Math.cos(angle) * velocity,
      translateY: Math.sin(angle) * velocity,
      scale: [1, 0.2],
      duration: 1000,
      easing: "easeOutExpo",
      complete: () => particle.remove(),
    });
  }
}

function vibrate(duration) {
  if ("vibrate" in navigator) navigator.vibrate(duration);
}

function animateLogo(player) {
  const logoId = `logo${player}`;
  const logo = document.getElementById(logoId);

  if (!logo) {
    console.error(`Logo no encontrado: ${logoId}`);
    return;
  }

  // Resetear animación
  logo.style.animation = "none";
  void logo.offsetWidth;
  logo.style.animation = "tap-pulse 0.3s ease-out";

  // Animación de brillo
  const colorConfig =
    player === 1
      ? { primary: "#00ff88", shadow: "0, 255, 136" }
      : { primary: "#ff0096", shadow: "255, 0, 150" };

  anime({
    targets: logo,
    filter: [
      `drop-shadow(0 0 15px rgba(${colorConfig.shadow}, 0.5))`,
      `drop-shadow(0 0 25px rgba(${colorConfig.shadow}, 0.8))`,
    ],
    duration: 150,
    easing: "easeOutQuad",
    direction: "alternate",
  });
}

function initTouchEvents() {
  document.body.addEventListener("touchstart", handleTouchStart, {
    passive: true,
  });
  document.body.addEventListener("touchend", handleTouchEnd, { passive: true });
  document.body.addEventListener("touchcancel", handleTouchEnd, {
    passive: true,
  });

  // Habilitar clicks en botones
  document.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener(
      "touchstart",
      (e) => {
        e.stopPropagation();
      },
      { passive: true }
    );
  });
}
function handleTap(e) {
  e.preventDefault();
  const now = Date.now();

  // Validación extendida
  if (!gameActive || timeLeft <= 0 || now - lastTap < 100 || document.hidden) {
    return;
  }

  // Cálculo preciso de la posición
  const viewportHeight = window.innerHeight;
  const tapY = e.clientY + window.scrollY;
  const player = tapY < viewportHeight / 2 ? 1 : 2;

  // Limitar taps al máximo requerido
  if (players[player].taps < tapsRequired) {
    players[player].taps++;
    lastTap = now;
    updateProgress(player);
    sendDataToMadMapper(player);

    if (players[player].taps === tapsRequired) {
      endGame(true, player);
    }
  }

  createParticles(e.pageX, e.pageY, player);
  animateLogo(player);
  // vibrate(50);
}

function handleTouchStart(e) {
  if (gameActive && e.target.closest("#gameContainer")) {
    e.preventDefault();
  }
  if (!gameActive) return;

  const now = performance.now(); // Mayor precisión

  Array.from(e.changedTouches).forEach((touch) => {
    const touchData = {
      id: touch.identifier,
      lastTap: now,
      pos: { x: touch.pageX, y: touch.pageY },
      cooldown: false,
    };

    activeTouches.set(touch.identifier, touchData);
    processTap(touchData);
  });
}

function handleTouch(e) {
  e.preventDefault();
  const now = Date.now();

  // Procesar todos los toques
  Array.from(e.changedTouches).forEach((touch) => {
    if (!gameActive || timeLeft <= 0 || document.hidden) return;

    // Validación por dedo individual
    if (!activeTouches[touch.identifier]) {
      activeTouches[touch.identifier] = {
        lastTap: now,
        pos: { x: touch.pageX, y: touch.pageY },
      };

      processTap(touch.pageX, touch.pageY);
    }
  });
}

function handleTouchEnd(e) {
  Array.from(e.changedTouches).forEach((touch) => {
    activeTouches.delete(touch.identifier);
  });
}

function processTap(touchData) {
  const now = performance.now();
  const player = touchData.pos.y < window.innerHeight / 2 ? 1 : 2;

  // Verificación ultra-rápida con requestAnimationFrame
  requestAnimationFrame(() => {
    if (!activeTouches.has(touchData.id)) return;

    if (now - touchData.lastTap >= TAP_INTERVAL) {
      touchData.lastTap = now;
      registerTap(player, touchData.pos.x, touchData.pos.y);
    } else if (!touchData.cooldown) {
      touchData.cooldown = true;
      setTimeout(() => {
        if (activeTouches.has(touchData.id)) {
          touchData.cooldown = false;
          processTap(touchData);
        }
      }, TAP_INTERVAL);
    }
  });
}

function registerTap(player, x, y) {
  ws.send(
    JSON.stringify({
      type: "tap",
      player: player,
      osc: {
        address: `/progress/${player}`,
        value: (gameState.players[player].taps + 1) / 40,
      },
    })
  );

  // Mantener solo efectos visuales locales
  createParticles(x, y, player);
  animateLogo(player);
}

function endGame(won, player) {
  gameActive = false;
  clearInterval(timerId);

  resultMessage.textContent = won
    ? `PLAYER ${player} WINS! 🎉`
    : "TIME'S UP! ⏳";
  resultMessage.className = won ? "win-message" : "lose-message";
  resultMessage.style.display = "block";

  if (won) {
    ws.send(JSON.stringify({ address: `/win/${player}`, value: 1 }));
    ws.send(JSON.stringify({ address: "/win", value: player }));
  } else {
    ws.send(JSON.stringify({ address: "/lose", value: 1 }));
  }

  restartBtn.classList.toggle("hidden", !gameState.winner && gameState.active);
  gameContainer.classList.toggle("hidden", !gameState.active);
}

function resetGame() {
  ws.send(JSON.stringify({ type: "reset" }));
  // restartBtn.classList.remove("hidden");
  // startBtn.classList.add("hidden");
  // Detener timer inmediatamente
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }

  // Resetear estado del juego
  gameActive = false;
  timeLeft = 10;

  // Resetear ambos jugadores
  [1, 2].forEach((player) => {
    players[player].taps = 0;
    const progressBar = document.getElementById(`progress-bar${player}`);
    if (progressBar) progressBar.style.width = "0%";

    const logo = document.getElementById(`logo${player}`);
    if (logo) {
      logo.style.transform = "scale(1)";
      logo.classList.remove("logo-animate");
    }

    document.getElementById(`tapsCount${player}`).textContent = "0";
    document.getElementById(`timer${player}`).textContent = timeLeft;
  });

  // Reset OSC
  [1, 2].forEach((player) => {
    ws.send(JSON.stringify({ address: `/win/${player}`, value: 0 }));
    ws.send(JSON.stringify({ address: `/progress/${player}`, value: 0 }));
  });

  // UI
  startBtn.classList.remove("hidden");
  restartBtn.classList.add("hidden");
  resultMessage.textContent = "";
}

// Funciones auxiliares
function updateProgress(player) {
  const progress = (gameState.players[player].taps / 40) * 100;
  const progressBar = document.getElementById(players[player].progressBar);
  const logo = document.getElementById(players[player].logo);
  // Agregar esta línea para actualizar el contador numérico
  const countElement = document.getElementById(players[player].countElement);

  if (!progressBar || !logo || !countElement) {
    console.error(`Elementos no encontrados para el jugador ${player}`);
    return;
  }

  progressBar.style.width = `${progress}%`;
  // logo.style.transform = `scale(${1 + progress / 100})`;
  countElement.textContent = gameState.players[player].taps; // <- Esta es la línea clave

  if (progress >= 100) {
    logo.classList.add("logo-animate");
  }
}

function sendDataToMadMapper(player) {
  const progressValue = players[player].taps / tapsRequired;

  // Validar y redondear valor
  const safeValue = Math.min(Math.max(progressValue, 0), 1).toFixed(2);

  ws.send(
    JSON.stringify({
      address: `/progress/${player}`,
      value: parseFloat(safeValue), // Asegurar tipo numérico
    })
  );
}

initTouchEvents();
// WebSocket handlers
ws.onopen = () => {
  console.log("WS: Conectado");
  connectionStatus.className = "connection-status connected";
};

ws.onclose = () => {
  connectionStatus.className = "connection-status disconnected";
};
ws.onerror = (error) => console.error("WS Error:", error);
