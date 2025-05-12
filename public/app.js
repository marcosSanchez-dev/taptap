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
let tapsRequired = 30;
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
  // Resetear elementos visuales
  timerDisplay.textContent = timeLeft;
  tapsCount.textContent = currentTaps;
  tapsTotal.textContent = tapsRequired;
  document.getElementById("progress-bar").style.width = "0%";
  document.getElementById("logo").style.transform = "scale(1)";
  document.getElementById("logo").classList.remove("logo-animate");
}

function startGame() {
  gameActive = true;

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
    timeLeft--;
    timerDisplay.textContent = timeLeft;
    if (timeLeft <= 0) endGame(false);
  }, 1000);
}

function createParticles(x, y) {
  for (let i = 0; i < 10; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";

    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.width = `${Math.random() * 10 + 5}px`;
    particle.style.height = particle.style.width;

    document.querySelector(".particle-container").appendChild(particle);

    // Animación
    const angle = Math.random() * 360 * (Math.PI / 180);
    const velocity = Math.random() * 5 + 2;

    anime({
      targets: particle,
      opacity: 0,
      translateX: Math.cos(angle) * 100,
      translateY: Math.sin(angle) * 100,
      duration: 1000,
      easing: "easeOutExpo",
      complete: () => particle.remove(),
    });
  }
}

function vibrate(duration) {
  if ("vibrate" in navigator) navigator.vibrate(duration);
}

function animateLogo() {
  const logo = document.getElementById("logo");

  // Resetear la animación para permitir retrigger rápido
  logo.style.animation = "none";
  void logo.offsetWidth; // Trigger reflow
  logo.style.animation = "tap-pulse 0.3s ease-out";

  // Animación suave de brillo
  anime({
    targets: logo,
    filter: [
      "drop-shadow(0 0 15px rgba(0, 255, 136, 0.5))",
      "drop-shadow(0 0 25px rgba(0, 255, 136, 0.8))",
    ],
    duration: 150,
    easing: "easeOutQuad",
    direction: "alternate",
  });
}

function handleTap(e) {
  e.preventDefault(); // Bloquear comportamiento por defecto

  const now = Date.now();
  if (!gameActive || timeLeft <= 0 || now - lastTap < 100) return;

  lastTap = now;
  currentTaps = Math.min(currentTaps + 1, tapsRequired);

  updateProgress();
  sendDataToMadMapper();

  if (currentTaps >= tapsRequired) endGame(true);

  createParticles(e.clientX, e.clientY);
  animateLogo();
  vibrate(50);
}

function endGame(won) {
  gameActive = false;
  clearInterval(timerId);

  // Configurar mensaje
  resultMessage.textContent = won ? "YOU WIN! :D" : "YOU LOSE! :(";
  resultMessage.className = won ? "win-message" : "lose-message";
  resultMessage.style.display = "block";

  // Enviar estados OSC
  ws.send(JSON.stringify({ address: won ? "/win" : "/lose", value: 1 }));

  // Mostrar botón de reinicio
  restartBtn.classList.remove("hidden");
  gameContainer.classList.add("hidden");
}

function resetGame() {
  // Resetear OSC
  ws.send(JSON.stringify({ address: "/win", value: 0 }));
  ws.send(JSON.stringify({ address: "/lose", value: 0 }));
  ws.send(JSON.stringify({ address: "/progress", value: 0 }));

  // Restaurar UI inicial
  startBtn.classList.remove("hidden");
  restartBtn.classList.add("hidden");
  gameContainer.classList.add("hidden");
  resultMessage.textContent = "";

  // Resetear progreso visual
  document.getElementById("progress-bar").style.width = "0%";
  document.getElementById("logo").classList.remove("logo-animate");
  document.getElementById("logo").style.transform = "scale(1)";
}

// Funciones auxiliares
function updateProgress() {
  const progress = (currentTaps / tapsRequired) * 100;
  document.getElementById("progress-bar").style.width = `${progress}%`;
  tapsCount.textContent = currentTaps;

  const logo = document.getElementById("logo");
  logo.style.transform = `scale(${1 + progress / 100})`;
  if (progress >= 100) logo.classList.add("logo-animate");
}

function sendDataToMadMapper() {
  const progressValue = currentTaps / tapsRequired;
  ws.send(
    JSON.stringify({
      address: "/progress",
      value: progressValue,
    })
  );
}

// WebSocket handlers
ws.onopen = () => console.log("WS: Conectado");
ws.onerror = (error) => console.error("WS Error:", error);
