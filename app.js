const CONFIG = {
  maxSlots: 10,
  pixKey: "pix@exemplo.com",
  whatsappNumber: "5500000000000",
  deliveryCepPrefixes: ["010", "011", "012", "013", "014", "015"],
};

const STORAGE_KEYS = {
  slots: "torta_slots_remaining",
  orders: "torta_orders",
  refCode: "torta_ref_code",
};

const STEP_IDS = ["flavor", "cep", "contact", "confirm", "success"];

const state = {
  flavor: "",
  cepFormatted: "",
  cepDigits: "",
  cepValidated: false,
  deliveryAvailable: false,
  deliveryMethod: "",
  phone: "",
  tokenChannel: "",
  tokenSent: "",
  tokenInput: "",
  name: "",
  referrerCode: "",
};

const getStoredNumber = (key, fallback) => {
  const value = Number(localStorage.getItem(key));
  return Number.isFinite(value) && value >= 0 ? value : fallback;
};

const setStoredNumber = (key, value) => {
  localStorage.setItem(key, String(value));
};

const getStoredOrders = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.orders)) || [];
  } catch (error) {
    return [];
  }
};

const setStoredOrders = (orders) => {
  localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
};

const getOrCreateRefCode = () => {
  const stored = localStorage.getItem(STORAGE_KEYS.refCode);
  if (stored) return stored;
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  localStorage.setItem(STORAGE_KEYS.refCode, code);
  return code;
};

const normalizeDigits = (value) => value.replace(/\D/g, "");

const formatCep = (value) => {
  const digits = normalizeDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

const formatPhone = (value) => {
  const digits = normalizeDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(
    7
  )}`;
};

const isCepValid = (digits) => digits.length === 8;

const isDeliveryCep = (digits) =>
  CONFIG.deliveryCepPrefixes.some((prefix) => digits.startsWith(prefix));

const getOrderWindowStatus = (now) => {
  const day = now.getDay();
  if (day >= 0 && day <= 3) {
    return {
      open: true,
      extraFee: false,
      message: "Pedidos abertos ate quarta-feira.",
      closedReason: "",
    };
  }
  if (day === 4) {
    return {
      open: true,
      extraFee: true,
      message:
        "Hoje e quinta-feira. Aceitamos com taxa extra de urgencia.",
      closedReason: "",
    };
  }
  return {
    open: false,
    extraFee: false,
    message: "Pedidos fechados. Volte no domingo.",
    closedReason:
      "Fora da janela de pedidos. Aceitamos novos pedidos a partir de domingo.",
  };
};

const getNextSaturday = (now) => {
  const target = new Date(now);
  const day = target.getDay();
  const daysUntil = (6 - day + 7) % 7;
  target.setDate(target.getDate() + daysUntil);
  return target;
};

const formatShortDate = (date) => {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
};

const setError = (scope, message) => {
  const errorEl = document.querySelector(`[data-error="${scope}"]`);
  if (errorEl) {
    errorEl.textContent = message || "";
  }
};

const clearAllErrors = () => {
  document
    .querySelectorAll(".error-message")
    .forEach((element) => (element.textContent = ""));
};

const showStep = (stepId) => {
  STEP_IDS.forEach((id) => {
    const section = document.querySelector(`[data-step="${id}"]`);
    if (section) {
      section.classList.toggle("hidden", id !== stepId);
    }
    const indicator = document.querySelector(
      `[data-step-indicator="${id}"]`
    );
    if (indicator) {
      indicator.classList.toggle("active", id === stepId);
    }
  });
  clearAllErrors();
};

const updateSlotsUI = (slots) => {
  const countEl = document.getElementById("slotsCount");
  const barEl = document.getElementById("slotsBar");
  if (countEl) countEl.textContent = slots;
  if (barEl) {
    const percent = Math.max(0, Math.min(100, (slots / CONFIG.maxSlots) * 100));
    barEl.style.width = `${percent}%`;
  }
};

const updateReferralUI = (refCode) => {
  const refCodeEl = document.getElementById("refCode");
  const refCountEl = document.getElementById("refCount");
  const refBarEl = document.getElementById("refBar");
  if (refCodeEl) refCodeEl.textContent = refCode;

  const orders = getStoredOrders();
  const refCount = orders.filter(
    (order) => order.referrerCode === refCode
  ).length;

  if (refCountEl) refCountEl.textContent = refCount;
  if (refBarEl) {
    const percent = Math.max(0, Math.min(100, (refCount / 10) * 100));
    refBarEl.style.width = `${percent}%`;
  }
};

const updateOrderWindowUI = (status, slots) => {
  const noticeEl = document.getElementById("orderWindowNotice");
  const closedCard = document.getElementById("orderClosedCard");
  const closedReason = document.getElementById("closedReason");
  const orderFlow = document.getElementById("orderFlow");

  if (noticeEl) noticeEl.textContent = status.message;
  if (!status.open || slots <= 0) {
    if (closedCard) closedCard.classList.remove("hidden");
    if (orderFlow) orderFlow.classList.add("hidden");
    if (closedReason) {
      closedReason.textContent =
        slots <= 0
          ? "Todos os slots para este sabado ja foram preenchidos."
          : status.closedReason;
    }
  } else {
    if (closedCard) closedCard.classList.add("hidden");
    if (orderFlow) orderFlow.classList.remove("hidden");
  }
};

const updateCepStatus = (available) => {
  const statusEl = document.getElementById("cepStatus");
  const deliveryOption = document.querySelector(
    'input[name="deliveryMethod"][value="entrega"]'
  );
  const pickupOption = document.querySelector(
    'input[name="deliveryMethod"][value="retirada"]'
  );

  if (statusEl) {
    if (available) {
      statusEl.textContent = "Entrega disponivel para este CEP.";
      statusEl.className = "status success";
    } else {
      statusEl.textContent = "Entrega indisponivel. Somente retirada.";
      statusEl.className = "status warning";
    }
  }

  if (deliveryOption) {
    deliveryOption.disabled = !available;
    if (!available) deliveryOption.checked = false;
  }

  if (pickupOption && !available) {
    pickupOption.checked = true;
    state.deliveryMethod = "retirada";
  }
};

const buildSummary = (windowStatus, nextSaturday) => {
  const summaryEl = document.getElementById("orderSummary");
  if (!summaryEl) return;
  summaryEl.innerHTML = "";

  const addItem = (label, value) => {
    const row = document.createElement("div");
    row.className = "summary-item";
    row.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
    summaryEl.appendChild(row);
  };

  addItem("Sabor", state.flavor);
  addItem("CEP", state.cepFormatted);
  addItem(
    "Entrega",
    state.deliveryMethod === "entrega" ? "Entrega no sabado" : "Retirada"
  );
  addItem("Contato", `${state.name} - ${state.phone}`);
  addItem("Data", `Sabado ${formatShortDate(nextSaturday)}`);

  if (windowStatus.extraFee) {
    addItem("Taxa extra", "Urgencia de quinta-feira");
  }

  if (state.referrerCode) {
    addItem("Indicado por", state.referrerCode);
  }
};

const resetFlowState = () => {
  state.flavor = "";
  state.cepFormatted = "";
  state.cepDigits = "";
  state.cepValidated = false;
  state.deliveryAvailable = false;
  state.deliveryMethod = "";
  state.phone = "";
  state.tokenChannel = "";
  state.tokenSent = "";
  state.tokenInput = "";
  state.name = "";

  document.querySelectorAll("input").forEach((input) => {
    if (input.type === "radio" || input.type === "checkbox") {
      input.checked = false;
    } else {
      input.value = "";
    }
  });

  const statusEl = document.getElementById("cepStatus");
  if (statusEl) {
    statusEl.textContent = "";
    statusEl.className = "status";
  }

  const deliveryOption = document.querySelector(
    'input[name="deliveryMethod"][value="entrega"]'
  );
  if (deliveryOption) {
    deliveryOption.disabled = false;
  }

  const tokenHelp = document.getElementById("tokenHelp");
  if (tokenHelp) tokenHelp.textContent = "";
};

document.addEventListener("DOMContentLoaded", () => {
  const refCode = getOrCreateRefCode();
  const now = new Date();
  const windowStatus = getOrderWindowStatus(now);
  const nextSaturday = getNextSaturday(now);

  const slotsRemaining = getStoredNumber(STORAGE_KEYS.slots, CONFIG.maxSlots);
  updateSlotsUI(slotsRemaining);
  updateOrderWindowUI(windowStatus, slotsRemaining);
  updateReferralUI(refCode);

  const urlParams = new URLSearchParams(window.location.search);
  const refParam = urlParams.get("ref");
  if (refParam) {
    state.referrerCode = refParam.toUpperCase();
  }

  document.querySelectorAll('[data-back="flavor"]').forEach((btn) => {
    btn.addEventListener("click", () => showStep("flavor"));
  });
  document.querySelectorAll('[data-back="cep"]').forEach((btn) => {
    btn.addEventListener("click", () => showStep("cep"));
  });
  document.querySelectorAll('[data-back="contact"]').forEach((btn) => {
    btn.addEventListener("click", () => showStep("contact"));
  });

  const flavorButton = document.getElementById("toStepCep");
  if (flavorButton) {
    flavorButton.addEventListener("click", () => {
      const selected = document.querySelector('input[name="flavor"]:checked');
      if (!selected) {
        setError("flavor", "Escolha um sabor para continuar.");
        return;
      }
      state.flavor = selected.value;
      showStep("cep");
    });
  }

  const cepInput = document.getElementById("cepInput");
  if (cepInput) {
    cepInput.addEventListener("input", (event) => {
      const formatted = formatCep(event.target.value);
      event.target.value = formatted;
      state.cepFormatted = formatted;
      state.cepDigits = normalizeDigits(formatted);
      state.cepValidated = false;
      const statusEl = document.getElementById("cepStatus");
      if (statusEl) {
        statusEl.textContent = "";
        statusEl.className = "status";
      }
    });
  }

  const validateCepButton = document.getElementById("validateCep");
  if (validateCepButton) {
    validateCepButton.addEventListener("click", () => {
      if (!isCepValid(state.cepDigits)) {
        setError("cep", "Informe um CEP valido com 8 digitos.");
        return;
      }
      state.deliveryAvailable = isDeliveryCep(state.cepDigits);
      state.cepValidated = true;
      updateCepStatus(state.deliveryAvailable);
      setError("cep", "");
    });
  }

  document
    .querySelectorAll('input[name="deliveryMethod"]')
    .forEach((input) => {
      input.addEventListener("change", (event) => {
        state.deliveryMethod = event.target.value;
      });
    });

  const toContactButton = document.getElementById("toStepContact");
  if (toContactButton) {
    toContactButton.addEventListener("click", () => {
      if (!isCepValid(state.cepDigits) || !state.cepValidated) {
        setError("cep", "Valide seu CEP antes de continuar.");
        return;
      }
      if (!state.deliveryMethod) {
        setError("cep", "Selecione entrega ou retirada.");
        return;
      }
      setError("cep", "");
      showStep("contact");
    });
  }

  const phoneInput = document.getElementById("phoneInput");
  if (phoneInput) {
    phoneInput.addEventListener("input", (event) => {
      const formatted = formatPhone(event.target.value);
      event.target.value = formatted;
      state.phone = formatted;
    });
  }

  document.querySelectorAll('input[name="tokenChannel"]').forEach((input) => {
    input.addEventListener("change", (event) => {
      state.tokenChannel = event.target.value;
    });
  });

  const sendCodeButton = document.getElementById("sendCode");
  if (sendCodeButton) {
    sendCodeButton.addEventListener("click", () => {
      const phoneDigits = normalizeDigits(state.phone);
      if (phoneDigits.length < 10) {
        setError("contact", "Informe um celular valido.");
        return;
      }
      if (!state.tokenChannel) {
        setError("contact", "Selecione SMS ou WhatsApp.");
        return;
      }
      state.tokenSent = String(
        Math.floor(100000 + Math.random() * 900000)
      );
      const tokenHelp = document.getElementById("tokenHelp");
      if (tokenHelp) {
        tokenHelp.textContent = `Simulacao: use o codigo ${state.tokenSent}.`;
      }
      setError("contact", "");
    });
  }

  const toConfirmButton = document.getElementById("toStepConfirm");
  if (toConfirmButton) {
    toConfirmButton.addEventListener("click", () => {
      const phoneDigits = normalizeDigits(state.phone);
      const tokenInput = document.getElementById("tokenInput");
      const nameInput = document.getElementById("nameInput");
      state.tokenInput = tokenInput ? tokenInput.value.trim() : "";
      state.name = nameInput ? nameInput.value.trim() : "";

      if (phoneDigits.length < 10) {
        setError("contact", "Informe um celular valido.");
        return;
      }
      if (!state.tokenSent) {
        setError("contact", "Envie o codigo antes de continuar.");
        return;
      }
      if (state.tokenInput !== state.tokenSent) {
        setError("contact", "Codigo invalido.");
        return;
      }
      if (state.name.length < 2) {
        setError("contact", "Informe seu nome.");
        return;
      }
      setError("contact", "");
      buildSummary(windowStatus, nextSaturday);
      showStep("confirm");
    });
  }

  const copyPixButton = document.getElementById("copyPix");
  if (copyPixButton) {
    copyPixButton.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(CONFIG.pixKey);
        copyPixButton.textContent = "Copiado!";
        setTimeout(() => {
          copyPixButton.textContent = "Copiar";
        }, 1600);
      } catch (error) {
        setError(
          "confirm",
          "Nao foi possivel copiar. Selecione a chave manualmente."
        );
      }
    });
  }

  const confirmButton = document.getElementById("confirmOrder");
  if (confirmButton) {
    confirmButton.addEventListener("click", () => {
      const currentSlots = getStoredNumber(
        STORAGE_KEYS.slots,
        CONFIG.maxSlots
      );
      if (currentSlots <= 0) {
        setError("confirm", "Slots esgotados. Tente novamente no domingo.");
        updateOrderWindowUI(windowStatus, currentSlots);
        return;
      }

      const orders = getStoredOrders();
      orders.push({
        flavor: state.flavor,
        cep: state.cepFormatted,
        deliveryMethod: state.deliveryMethod,
        phone: state.phone,
        name: state.name,
        createdAt: new Date().toISOString(),
        referrerCode: state.referrerCode || "",
      });
      setStoredOrders(orders);
      setStoredNumber(STORAGE_KEYS.slots, currentSlots - 1);
      updateSlotsUI(currentSlots - 1);
      updateReferralUI(refCode);

      const successMessage = document.getElementById("successMessage");
      if (successMessage) {
        successMessage.textContent = `Tudo certo, ${state.name}! Sua torta de ${
          state.flavor
        } esta reservada para sabado ${formatShortDate(
          nextSaturday
        )}. Em breve confirmaremos o pagamento via WhatsApp.`;
      }

      showStep("success");
      updateOrderWindowUI(windowStatus, currentSlots - 1);
    });
  }

  const newOrderButton = document.getElementById("newOrder");
  if (newOrderButton) {
    newOrderButton.addEventListener("click", () => {
      resetFlowState();
      showStep("flavor");
    });
  }

  const shareButton = document.getElementById("shareWhatsApp");
  if (shareButton) {
    shareButton.addEventListener("click", async () => {
      const origin =
        window.location.origin === "null"
          ? window.location.href.split("?")[0]
          : `${window.location.origin}${window.location.pathname}`;
      const shareUrl = `${origin}?ref=${refCode}`;
      const message =
        "Oi! Estou encomendando tortas caseiras para sabado. Reserve a sua aqui: " +
        shareUrl;
      if (navigator.share) {
        try {
          await navigator.share({ text: message, url: shareUrl });
        } catch (error) {
          window.open(
            `https://wa.me/?text=${encodeURIComponent(message)}`,
            "_blank"
          );
        }
      } else {
        window.open(
          `https://wa.me/?text=${encodeURIComponent(message)}`,
          "_blank"
        );
      }
    });
  }

  const pixKeyEl = document.getElementById("pixKey");
  if (pixKeyEl) pixKeyEl.textContent = CONFIG.pixKey;

  const closedCta = document.getElementById("closedCta");
  if (closedCta) {
    closedCta.href = `https://wa.me/${CONFIG.whatsappNumber}`;
  }
});
