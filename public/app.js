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

// Estado inicial
startBtn.classList.remove("hidden");
restartBtn.classList.add("hidden");
gameContainer.classList.add("hidden");

// Event Listeners
startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", resetGame);
document.body.addEventListener("pointerdown", handleTap);

function startGame() {
  gameActive = true;
  startBtn.classList.add("hidden");
  restartBtn.classList.add("hidden");
  gameContainer.classList.remove("hidden");

  // Resetear valores
  timeLeft = 30;
  currentTaps = 0;
  timerDisplay.textContent = timeLeft;
  tapsCount.textContent = currentTaps;
  tapsTotal.textContent = tapsRequired;
  document.getElementById("progress-bar").style.width = "0%";
  document.getElementById("logo").style.transform = "scale(1)";
  document.getElementById("logo").classList.remove("logo-animate");

  ws.send(JSON.stringify({ address: "/start", value: 1 }));

  // Iniciar temporizador
  timerId = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = timeLeft;

    if (timeLeft <= 0) {
      endGame(false);
    }
  }, 1000);
}

function handleTap(e) {
  const now = Date.now();
  if (!gameActive || timeLeft <= 0 || now - lastTap < 100) return;
  lastTap = now;

  currentTaps++;
  updateProgress();
  sendDataToMadMapper();

  if (currentTaps >= tapsRequired) {
    endGame(true);
  }
}

function endGame(won) {
  gameActive = false;
  clearInterval(timerId);

  // Enviar estados a MadMapper
  const address = won ? "/win" : "/lose";
  ws.send(JSON.stringify({ address, value: 1 }));

  // Mostrar botón de reinicio
  restartBtn.classList.remove("hidden");
  gameContainer.classList.add("hidden");
}

function resetGame() {
  // Resetear OSC
  ws.send(JSON.stringify({ address: "/win", value: 0 }));
  ws.send(JSON.stringify({ address: "/lose", value: 0 }));
  ws.send(JSON.stringify({ address: "/progress", value: 0 }));

  // Volver a estado inicial
  startBtn.classList.remove("hidden");
  restartBtn.classList.add("hidden");
  clearInterval(timerId);
}

function updateProgress() {
  const progress = (currentTaps / tapsRequired) * 100;
  document.getElementById("progress-bar").style.width = `${progress}%`;
  tapsCount.textContent = currentTaps;

  // Animación del logo
  const logo = document.getElementById("logo");
  logo.style.transform = `scale(${1 + progress / 100})`;
  if (progress >= 100) logo.classList.add("logo-animate");
}

function sendDataToMadMapper() {
  const progress = currentTaps / tapsRequired;
  ws.send(
    JSON.stringify({
      address: "/progress",
      value: progress,
    })
  );
}

// Manejo de conexión WebSocket
ws.onopen = () => {
  console.log("Conexión WS establecida");
};

ws.onerror = (error) => {
  console.error("Error WS:", error);
};
