const ws = new WebSocket("ws://localhost:8080");
let tapsRequired = 10;
let currentTaps = 0;

// Función primero
const sendDataToMadMapper = () => {
  const progress = currentTaps / tapsRequired; // Ahora 0-1 en vez de 0-100
  console.log("[FRONTEND] Enviando a servidor:", progress.toFixed(2));

  ws.send(
    JSON.stringify({
      address: "/progress", // Campo específico para address
      value: progress,
    })
  );
};

function handleTap() {
  currentTaps = Math.min(currentTaps + 1, tapsRequired);
  updateProgress();
  sendDataToMadMapper();
}

function updateProgress() {
  const progress = (currentTaps / tapsRequired) * 100;
  document.getElementById("progress-bar").style.width = `${progress}%`;
  document.getElementById("taps-left").textContent = tapsRequired - currentTaps;

  const logo = document.getElementById("logo");
  logo.style.transform = `scale(${1 + progress / 100})`;
  if (progress === 100) logo.classList.add("logo-animate");
}

// Event listeners al final
document.body.addEventListener("click", handleTap);
document.body.addEventListener("touchend", handleTap);
