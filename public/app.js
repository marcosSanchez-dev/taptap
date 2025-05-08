const serverIP = window.location.hostname;
const ws = new WebSocket("ws://" + serverIP + ":8080");

// Variables globales
let gameActive = false;
let timeLeft = 30;
let tapsRequired = 10;
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
  timeLeft = 30;
  currentTaps = 0;
  updateUI();

  // Temporizador
  timerId = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = timeLeft;
    if (timeLeft <= 0) endGame(false);
  }, 1000);
}

function handleTap(e) {
  const now = Date.now();
  if (!gameActive || timeLeft <= 0 || now - lastTap < 100) return;
  lastTap = now;

  currentTaps = Math.min(currentTaps + 1, tapsRequired);
  updateProgress();
  sendDataToMadMapper(); // Envío de progreso

  if (currentTaps >= tapsRequired) endGame(true);
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
