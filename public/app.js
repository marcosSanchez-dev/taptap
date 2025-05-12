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
let gameActive = false;
let timeLeft = 10;
let tapsRequired = 40;
let currentTaps = 0;
let timerId = null;
let lastTap = 0;

// Elementos del DOM
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const gameContainer = document.getElementById("gameContainer");
const timerDisplay = document.getElementById("timer");
const tapsCount = document.getElementById("tapsCount");
const tapsTotal = document.getElementById("tapsTotal");
const resultMessage = document.getElementById("resultMessage");
const players = {
  1: {
    taps: 0,
    progressBar: "progress-bar1",
    countElement: "tapsCount1",
    logo: "logo1",
  },
  2: {
    taps: 0,
    progressBar: "progress-bar2",
    countElement: "tapsCount2",
    logo: "logo2",
  },
};

// Estado inicial
startBtn.classList.remove("hidden");
restartBtn.classList.add("hidden");
gameContainer.classList.add("hidden");
resultMessage.textContent = "";

// Event Listeners
startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", resetGame);
document.body.addEventListener("pointerdown", handleTap);

// Añade esta función en tu app.js
function updateUI() {
  [1, 2].forEach((player) => {
    const progressBar = document.getElementById(`progress-bar${player}`);
    const tapsCount = document.getElementById(`tapsCount${player}`);
    const logo = document.getElementById(`logo${player}`);

    if (progressBar) progressBar.style.width = "0%";
    if (tapsCount) tapsCount.textContent = "0";
    if (logo) {
      logo.style.transform = "scale(1)";
      logo.classList.remove("logo-animate");
    }
  });

  const timerElement = document.getElementById("timer");
  if (timerElement) timerElement.textContent = timeLeft;
}

function startGame() {
  gameActive = true;
  timeLeft = 10; // Resetear tiempo
  tapsRequired = 40; // Fijar valor requerido

  if (timerId) clearInterval(timerId);

  // Resetear ambos jugadores
  Object.keys(players).forEach((p) => {
    players[p].taps = 0;
  });

  // Configurar UI inicial
  startBtn.classList.add("hidden");
  restartBtn.classList.add("hidden");
  gameContainer.classList.remove("hidden");
  resultMessage.style.display = "none";

  ws.send(JSON.stringify({ address: "/start", value: 1 }));

  // Resetear valores
  timeLeft = 10;
  currentTaps = 0;
  updateUI();

  // Temporizador
  timerId = setInterval(() => {
    if (timeLeft > 0) {
      timeLeft--;
      document.getElementById("timer1").textContent = timeLeft;
      document.getElementById("timer2").textContent = timeLeft;
    } else {
      endGame(false);
      clearInterval(timerId);
    }
  }, 1000);
}

function createParticles(x, y, player) {
  const colorConfig =
    player === 1
      ? { primary: "#00ff88", shadow: "0, 255, 136" }
      : { primary: "#ff0096", shadow: "255, 0, 150" };

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
  vibrate(50);
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

  restartBtn.classList.remove("hidden");
  gameContainer.classList.add("hidden");
}

function resetGame() {
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
  const progress = (players[player].taps / tapsRequired) * 100;
  const progressBar = document.getElementById(players[player].progressBar);
  const logo = document.getElementById(players[player].logo);
  // Agregar esta línea para actualizar el contador numérico
  const countElement = document.getElementById(players[player].countElement);

  if (!progressBar || !logo || !countElement) {
    console.error(`Elementos no encontrados para el jugador ${player}`);
    return;
  }

  progressBar.style.width = `${progress}%`;
  logo.style.transform = `scale(${1 + progress / 100})`;
  countElement.textContent = players[player].taps; // <- Esta es la línea clave

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
// WebSocket handlers
ws.onopen = () => console.log("WS: Conectado");
ws.onerror = (error) => console.error("WS Error:", error);
