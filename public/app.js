// const ws = new WebSocket("ws://localhost:8080");
const serverIP = window.location.hostname; // Obtiene la IP automáticamente
const ws = new WebSocket("ws://" + window.location.hostname + ":8080");

// Variables globales
let gameActive = false;
let timeLeft = 30;
let tapsRequired = 10;
let currentTaps = 0;
let timerId = null;

const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const gameContainer = document.getElementById("gameContainer");
const timerDisplay = document.getElementById("timer");
const tapsCount = document.getElementById("tapsCount");
const tapsTotal = document.getElementById("tapsTotal");

// Event Listeners
startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", resetGame);

function startGame() {
  gameActive = true;
  startBtn.classList.add("hidden");
  gameContainer.classList.remove("hidden");
  restartBtn.classList.add("hidden");

  // Resetear valores
  timeLeft = 30;
  currentTaps = 0;
  updateProgress();

  // Iniciar temporizador
  timerId = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = timeLeft;

    if (timeLeft <= 0) {
      endGame(false);
    }
  }, 1000);

  tapsTotal.textContent = tapsRequired; // ← Inicializar contador total
  tapsCount.textContent = 0;
}

function handleTap() {
  if (!gameActive || timeLeft <= 0) return;

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
  oscClient.send(address, 1);

  // Mostrar botón de reinicio
  restartBtn.classList.remove("hidden");
  gameContainer.classList.add("hidden");
}

function resetGame() {
  // Enviar reset a MadMapper
  ws.send(JSON.stringify({ address: "/progress", value: 0 }));
  ws.send(JSON.stringify({ address: "/win", value: 0 }));
  ws.send(JSON.stringify({ address: "/lose", value: 0 }));

  // Resetear estado del juego
  gameActive = false;
  clearInterval(timerId);
  timeLeft = 30;
  currentTaps = 0;

  // Restaurar UI
  timerDisplay.textContent = timeLeft;
  startBtn.classList.remove("hidden");
  restartBtn.classList.add("hidden");
  gameContainer.classList.add("hidden");

  // Resetear progreso visual
  document.getElementById("progress-bar").style.width = "0%";
  document.getElementById("logo").classList.remove("logo-animate");
  document.getElementById("logo").style.transform = "scale(1)";
}

// Modificar sendDataToMadMapper
function sendDataToMadMapper() {
  const progress = currentTaps / tapsRequired;
  ws.send(
    JSON.stringify({
      address: "/progress",
      value: progress,
    })
  );

  // Actualizar HUD
  document.getElementById("tapsCount").textContent = currentTaps;
}

function handleTap() {
  currentTaps = Math.min(currentTaps + 1, tapsRequired);
  updateProgress();
  sendDataToMadMapper();
}

function updateProgress() {
  const progress = (currentTaps / tapsRequired) * 100;

  // Actualizar elementos del DOM
  document.getElementById("progress-bar").style.width = `${progress}%`;
  tapsCount.textContent = currentTaps;
  tapsTotal.textContent = tapsRequired; // ← Nuevo

  // Animación del logo
  const logo = document.getElementById("logo");
  logo.style.transform = `scale(${1 + progress / 100})`;
  if (progress >= 100) logo.classList.add("logo-animate");
}
// Event listeners al final
// document.body.addEventListener("click", handleTap);
// document.body.addEventListener("touchend", handleTap);

// Eliminar listeners anteriores y usar Pointer Events
const pointerHandler = (e) => {
  e.preventDefault(); // Evita comportamiento táctil por defecto
  handleTap();
};

// Usar solo un tipo de evento
// document.body.addEventListener("pointerup", pointerHandler);
// Reemplazar líneas 114-124 con:
let lastTap = 0;
document.body.addEventListener("pointerdown", (e) => {
  if (!gameActive) return;

  // Prevenir doble tap
  const now = Date.now();
  if (now - lastTap < 100) return;
  lastTap = now;

  handleTap(e);
});
