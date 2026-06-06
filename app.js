const screens = {
  home: document.querySelector("#screen-home"),
  resident: document.querySelector("#screen-resident"),
  landlord: document.querySelector("#screen-landlord"),
};

const panelData = {
  contract: {
    label: "Contrato de arrendamiento",
    title: "Condiciones base del acuerdo",
    text:
      "Canon mensual: $1.850.000 COP. Duracion: 12 meses. Deposito: equivalente a un mes. Pago: primeros cinco dias de cada mes.",
  },
  property: {
    label: "Inmueble",
    title: "Apartamento disponible para entrega",
    text:
      "Ubicacion: barrio residencial conectado. Area: 68 m2. Habitaciones: 2. Banos: 2. Incluye parqueadero y administracion.",
  },
};

const state = {
  resident: JSON.parse(localStorage.getItem("residentSignature") || "null"),
  landlord: JSON.parse(localStorage.getItem("landlordSignature") || "null"),
};

const celoConfig = {
  contractAddress: "",
  feeCurrency: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
  networks: {
    "0xa4ec": "Celo Mainnet",
    "0xaa044c": "Celo Sepolia",
  },
};

const toast = document.querySelector("#toast");
const panelLabel = document.querySelector("#panel-label");
const panelTitle = document.querySelector("#panel-title");
const panelText = document.querySelector("#panel-text");
const globalStatus = document.querySelector("#global-status");
const residentProgress = document.querySelector("#resident-progress");
const landlordProgress = document.querySelector("#landlord-progress");
const connectWallet = document.querySelector("#connect-wallet");
const anchorContract = document.querySelector("#anchor-contract");
const walletStatus = document.querySelector("#wallet-status");
const chainStatus = document.querySelector("#chain-status");
const contractStatus = document.querySelector("#contract-status");

document.querySelectorAll("[data-screen]").forEach((button) => {
  button.addEventListener("click", () => showScreen(button.dataset.screen));
});

document.querySelectorAll("[data-panel]").forEach((button) => {
  button.addEventListener("click", () => showPanel(button.dataset.panel));
});

document.querySelectorAll(".signature-form").forEach((form) => setupSignatureForm(form));

connectWallet.addEventListener("click", connectCeloWallet);
anchorContract.addEventListener("click", prepareContractAnchor);

updateProgress();
detectWalletEnvironment();

function showScreen(name) {
  Object.values(screens).forEach((screen) => screen.classList.remove("is-active"));
  screens[name].classList.add("is-active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showPanel(name) {
  const panel = panelData[name];
  panelLabel.textContent = panel.label;
  panelTitle.textContent = panel.title;
  panelText.textContent = panel.text;
}

function setupSignatureForm(form) {
  const role = form.dataset.role;
  const canvas = form.querySelector("canvas");
  const context = canvas.getContext("2d");
  const clearButton = form.querySelector("[data-clear]");
  let drawing = false;
  let hasInk = false;

  context.lineWidth = 3;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = "#1f2933";

  canvas.addEventListener("pointerdown", (event) => {
    drawing = true;
    hasInk = true;
    const point = getCanvasPoint(canvas, event);
    context.beginPath();
    context.moveTo(point.x, point.y);
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!drawing) return;
    const point = getCanvasPoint(canvas, event);
    context.lineTo(point.x, point.y);
    context.stroke();
  });

  canvas.addEventListener("pointerup", () => {
    drawing = false;
  });

  canvas.addEventListener("pointercancel", () => {
    drawing = false;
  });

  clearButton.addEventListener("click", () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    hasInk = false;
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!hasInk) {
      showToast("Agrega tu firma en el recuadro antes de guardar.");
      return;
    }

    const formData = new FormData(form);
    const signedAt = new Date().toLocaleString("es-CO", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    state[role] = {
      name: formData.get("name"),
      document: formData.get("document"),
      signedAt,
      image: canvas.toDataURL("image/png"),
    };

    localStorage.setItem(`${role}Signature`, JSON.stringify(state[role]));
    updateProgress();
    showToast(`Firma guardada para ${state[role].name}.`);
    showScreen("home");
  });
}

function getCanvasPoint(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  };
}

function updateProgress() {
  residentProgress.textContent = state.resident ? `Firmado por ${state.resident.name}` : "Sin firma";
  landlordProgress.textContent = state.landlord ? `Firmado por ${state.landlord.name}` : "Sin firma";

  if (state.resident && state.landlord) {
    globalStatus.textContent = "Contrato completo";
    return;
  }

  if (state.resident || state.landlord) {
    globalStatus.textContent = "Firma parcial";
    return;
  }

  globalStatus.textContent = "Pendiente de firmas";
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

async function detectWalletEnvironment() {
  contractStatus.textContent = celoConfig.contractAddress || "Pendiente de despliegue";

  if (!window.ethereum) {
    walletStatus.textContent = "Wallet no detectada";
    chainStatus.textContent = "Instala MiniPay o wallet Celo";
    return;
  }

  if (window.ethereum.isMiniPay) {
    walletStatus.textContent = "MiniPay detectado";
  } else {
    walletStatus.textContent = "Wallet detectada";
  }

  try {
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    updateChainStatus(chainId);
  } catch {
    chainStatus.textContent = "Red no disponible";
  }

  window.ethereum.on?.("chainChanged", updateChainStatus);
  window.ethereum.on?.("accountsChanged", (accounts) => {
    walletStatus.textContent = accounts[0] ? shortAddress(accounts[0]) : "Wallet detectada";
  });
}

async function connectCeloWallet() {
  if (!window.ethereum) {
    showToast("Abre la app desde MiniPay o una wallet compatible con Celo.");
    return;
  }

  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    walletStatus.textContent = accounts[0] ? shortAddress(accounts[0]) : "Wallet conectada";
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    updateChainStatus(chainId);
  } catch {
    showToast("No se pudo conectar la wallet.");
  }
}

function prepareContractAnchor() {
  if (!state.resident || !state.landlord) {
    showToast("Completa ambas firmas antes de preparar el registro on-chain.");
    return;
  }

  if (!celoConfig.contractAddress) {
    showToast("Falta desplegar el smart contract y configurar su direccion.");
    return;
  }

  showToast("Listo para enviar transaccion con network fee en USDm.");
}

function updateChainStatus(chainId) {
  chainStatus.textContent = celoConfig.networks[chainId] || `Red no soportada (${chainId})`;
}

function shortAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
