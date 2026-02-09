/**
 * TORTAS DA VÓ - Application
 * Mobile-first ordering flow for artisanal pies
 */

(function () {
  'use strict';

  // ==========================================
  // CONFIGURATION
  // ==========================================
  const CONFIG = {
    MAX_SLOTS: 10,
    PRICES: {
      frango: 45,
      'alho-poro': 50,
    },
    DELIVERY_FEE: 10,
    THURSDAY_SURCHARGE: 10,
    REFERRAL_GOAL: 10,
    // Days when orders are accepted (0=Sun, 1=Mon, ..., 6=Sat)
    // Sunday(0) to Wednesday(3) = normal, Thursday(4) = surcharge
    OPEN_DAYS: [0, 1, 2, 3],
    THURSDAY: 4,
    // CEP ranges for delivery (simplified - São Paulo region example)
    // In production, this would come from an API or database
    DELIVERY_CEPS: [
      { from: '01000000', to: '05999999' }, // Central SP
      { from: '06000000', to: '06999999' }, // Osasco region
      { from: '08000000', to: '08999999' }, // East SP
    ],
    PICKUP_ADDRESS: 'Rua das Tortas, 123 - Vila Artesanal',
    // Demo verification code (in production, use SMS API)
    DEMO_CODE: '1234',
    STORAGE_KEY: 'tortas_da_vo',
    // WhatsApp share number (without country code prefix for share links)
    WHATSAPP_SHARE_TEXT: (code) =>
      `🥧 Descobri as Tortas da Vó! Tortas artesanais incríveis entregues no sábado. Use meu código *${code}* e peça a sua: ${window.location.origin}${window.location.pathname}?ref=${code}`,
  };

  const FLAVOR_NAMES = {
    frango: 'Frango',
    'alho-poro': 'Alho Poró',
  };

  const DAY_NAMES = [
    'Domingo',
    'Segunda',
    'Terça',
    'Quarta',
    'Quinta',
    'Sexta',
    'Sábado',
  ];

  // ==========================================
  // STATE
  // ==========================================
  let state = {
    currentStep: 'landing',
    slotsAvailable: CONFIG.MAX_SLOTS,
    selectedFlavor: null,
    deliveryMethod: null, // 'delivery' or 'pickup'
    cepData: null,
    phone: '',
    phoneVerified: false,
    name: '',
    addressNumber: '',
    addressComplement: '',
    isThursday: false,
    referralCode: null, // referral code from URL (who referred this user)
    myReferralCode: null, // this user's own referral code
    referralCount: 0,
    orderId: null,
  };

  // ==========================================
  // DOM REFERENCES
  // ==========================================
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // ==========================================
  // STORAGE
  // ==========================================
  function loadState() {
    try {
      const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        // Check if we need to reset slots (new week)
        const savedWeek = data.weekNumber;
        const currentWeek = getWeekNumber();
        if (savedWeek !== currentWeek) {
          data.slotsAvailable = CONFIG.MAX_SLOTS;
          data.weekNumber = currentWeek;
        }
        state.slotsAvailable = data.slotsAvailable ?? CONFIG.MAX_SLOTS;
        state.myReferralCode = data.myReferralCode ?? null;
        state.referralCount = data.referralCount ?? 0;
      }
    } catch (e) {
      console.warn('Failed to load state:', e);
    }
  }

  function saveState() {
    try {
      localStorage.setItem(
        CONFIG.STORAGE_KEY,
        JSON.stringify({
          slotsAvailable: state.slotsAvailable,
          weekNumber: getWeekNumber(),
          myReferralCode: state.myReferralCode,
          referralCount: state.referralCount,
        })
      );
    } catch (e) {
      console.warn('Failed to save state:', e);
    }
  }

  function getWeekNumber() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now - start;
    const oneWeek = 604800000;
    return Math.floor(diff / oneWeek);
  }

  // ==========================================
  // UTILITIES
  // ==========================================
  function formatCurrency(value) {
    return `R$ ${value.toFixed(0)}`;
  }

  function formatPhone(value) {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7)
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  }

  function formatCep(value) {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
  }

  function getNextSaturday() {
    const now = new Date();
    const day = now.getDay();
    const daysUntilSat = (6 - day + 7) % 7 || 7;
    const saturday = new Date(now);
    saturday.setDate(now.getDate() + daysUntilSat);
    return saturday;
  }

  function formatDate(date) {
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    return date.toLocaleDateString('pt-BR', options);
  }

  function generateOrderId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let id = 'TV-';
    for (let i = 0; i < 5; i++) {
      id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
  }

  function generateReferralCode(name) {
    const cleanName = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '')
      .toUpperCase()
      .slice(0, 4);
    const suffix = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${cleanName}${suffix}`;
  }

  function getDayStatus() {
    const now = new Date();
    const day = now.getDay();

    if (CONFIG.OPEN_DAYS.includes(day)) {
      return { status: 'open', day, isThursday: false };
    }
    if (day === CONFIG.THURSDAY) {
      return { status: 'thursday', day, isThursday: true };
    }
    return { status: 'closed', day, isThursday: false };
  }

  function isDeliverableCep(cep) {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) return false;
    return CONFIG.DELIVERY_CEPS.some(
      (range) => digits >= range.from && digits <= range.to
    );
  }

  // ==========================================
  // UI HELPERS
  // ==========================================
  function showToast(message, icon = '✓') {
    const toast = $('#toast');
    const toastIcon = $('#toastIcon');
    const toastMessage = $('#toastMessage');

    toastIcon.textContent = icon;
    toastMessage.textContent = message;
    toast.classList.add('toast--visible');

    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => {
      toast.classList.remove('toast--visible');
    }, 3000);
  }

  function showLoading() {
    $('#loadingOverlay').classList.add('loading-overlay--visible');
    document.body.classList.add('no-scroll');
  }

  function hideLoading() {
    $('#loadingOverlay').classList.remove('loading-overlay--visible');
    document.body.classList.remove('no-scroll');
  }

  function setHint(id, message, type = '') {
    const hint = $(`#${id}`);
    if (!hint) return;
    hint.textContent = message;
    hint.className = 'input-group__hint';
    if (type) hint.classList.add(`input-group__hint--${type}`);
  }

  function navigateTo(stepName) {
    // Hide all steps
    $$('.step').forEach((s) => {
      s.classList.remove('step--active');
      // Don't set display:none here; the CSS .step { display: none } handles it
    });

    // Show target step
    const target = $(`#step-${stepName}`);
    if (target) {
      // Remove any inline display:none (for sold-out/closed that start hidden)
      target.style.removeProperty('display');
      // Force reflow for animation
      void target.offsetWidth;
      target.classList.add('step--active');
    }

    state.currentStep = stepName;
    updateProgressBar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateProgressBar() {
    const steps = ['landing', 'flavor', 'delivery', 'contact', 'confirm', 'success'];
    const idx = steps.indexOf(state.currentStep);
    const bar = $('#progressBar');
    const fill = $('#progressFill');

    if (idx <= 0 || idx >= steps.length - 1) {
      bar.classList.remove('progress-bar--visible');
    } else {
      bar.classList.add('progress-bar--visible');
      const pct = (idx / (steps.length - 2)) * 100;
      fill.style.width = `${pct}%`;
    }
  }

  // ==========================================
  // SLOTS RENDERING
  // ==========================================
  function renderSlots() {
    const container = $('#slotsDots');
    const countEl = $('#slotsAvailable');

    container.innerHTML = '';
    for (let i = 0; i < CONFIG.MAX_SLOTS; i++) {
      const dot = document.createElement('div');
      dot.className = `slots__dot ${i < state.slotsAvailable ? 'slots__dot--available' : 'slots__dot--taken'}`;
      container.appendChild(dot);
    }

    countEl.textContent = state.slotsAvailable;
  }

  // ==========================================
  // DAY STATUS RENDERING
  // ==========================================
  function renderDayStatus() {
    const dayInfo = getDayStatus();
    const el = $('#dayStatus');
    const btnStart = $('#btnStart');

    state.isThursday = dayInfo.isThursday;

    if (dayInfo.status === 'open') {
      el.className = 'day-status day-status--open';
      el.innerHTML = `✅ Encomendas abertas! Peça até quarta.`;
      btnStart.disabled = false;
    } else if (dayInfo.status === 'thursday') {
      el.className = 'day-status day-status--thursday';
      el.innerHTML = `⚡ Última chance! Pedidos hoje com taxa de urgência.`;
      btnStart.disabled = false;
    } else {
      el.className = 'day-status day-status--closed';
      const nextSunday = new Date();
      const daysUntilSun = (7 - dayInfo.day) % 7 || 7;
      nextSunday.setDate(nextSunday.getDate() + daysUntilSun);
      el.innerHTML = `🔒 Encomendas fechadas. Reabrimos ${DAY_NAMES[0].toLowerCase()}.`;

      // Show closed screen instead
      if (state.slotsAvailable > 0) {
        // Still have slots but wrong day
        btnStart.disabled = true;
      }
    }

    // Check sold out
    if (state.slotsAvailable <= 0) {
      btnStart.disabled = true;
      el.className = 'day-status day-status--closed';
      el.innerHTML = `😍 Esgotado! Todas as vagas preenchidas.`;
    }

    // Show Thursday notice on flavor step
    const thursdayNotice = $('#thursdayNotice');
    if (thursdayNotice) {
      thursdayNotice.style.display = state.isThursday ? 'flex' : 'none';
    }
  }

  // ==========================================
  // PRICES - Update based on Thursday surcharge
  // ==========================================
  function updatePrices() {
    const surcharge = state.isThursday ? CONFIG.THURSDAY_SURCHARGE : 0;

    // Landing prices
    $('#priceFraggo').textContent = formatCurrency(CONFIG.PRICES.frango + surcharge);
    $('#pricePoro').textContent = formatCurrency(CONFIG.PRICES['alho-poro'] + surcharge);

    // Card prices
    $('#cardPriceFraggo').textContent = formatCurrency(CONFIG.PRICES.frango + surcharge);
    $('#cardPricePoro').textContent = formatCurrency(CONFIG.PRICES['alho-poro'] + surcharge);
  }

  // ==========================================
  // CHECK REFERRAL FROM URL
  // ==========================================
  function checkReferral() {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      state.referralCode = ref.toUpperCase();
      // Show subtle referral notice
      showToast(`Indicação de ${ref} aplicada!`, '🎁');
    }
  }

  // ==========================================
  // CALCULATE TOTAL
  // ==========================================
  function calculateTotal() {
    if (!state.selectedFlavor) return 0;

    let total = CONFIG.PRICES[state.selectedFlavor];

    // Thursday surcharge
    if (state.isThursday) {
      total += CONFIG.THURSDAY_SURCHARGE;
    }

    // Delivery fee
    if (state.deliveryMethod === 'delivery') {
      total += CONFIG.DELIVERY_FEE;
    }

    return total;
  }

  // ==========================================
  // STEP: LANDING
  // ==========================================
  function initLanding() {
    const btnStart = $('#btnStart');

    btnStart.addEventListener('click', () => {
      if (state.slotsAvailable <= 0) {
        navigateTo('soldout');
        return;
      }

      const dayInfo = getDayStatus();
      if (dayInfo.status === 'closed' && !DEMO_MODE) {
        showToast('Encomendas só abrem no domingo!', '🔒');
        return;
      }

      navigateTo('flavor');
    });
  }

  // ==========================================
  // STEP: FLAVOR SELECTION
  // ==========================================
  function initFlavor() {
    const cards = $$('.flavor-card');
    const btnNext = $('#btnFlavorNext');
    const btnBack = $('#btnBackFlavor');

    cards.forEach((card) => {
      card.addEventListener('click', () => {
        const flavor = card.dataset.flavor;
        state.selectedFlavor = flavor;

        // Update UI
        cards.forEach((c) => c.classList.remove('flavor-card--selected'));
        card.classList.add('flavor-card--selected');

        btnNext.disabled = false;

        // Haptic feedback (if available)
        if (navigator.vibrate) navigator.vibrate(10);
      });
    });

    btnNext.addEventListener('click', () => {
      if (!state.selectedFlavor) {
        showToast('Escolha um sabor para continuar', '🥧');
        return;
      }
      navigateTo('delivery');
    });

    btnBack.addEventListener('click', () => {
      navigateTo('landing');
    });
  }

  // ==========================================
  // STEP: CEP / DELIVERY
  // ==========================================
  function initDelivery() {
    const inputCep = $('#inputCep');
    const btnCheck = $('#btnCheckCep');
    const btnNext = $('#btnDeliveryNext');
    const btnBack = $('#btnBackDelivery');
    const cepResult = $('#cepResult');
    const pickupNotice = $('#pickupOnlyNotice');
    const optDelivery = $('#optDelivery');
    const optPickup = $('#optPickup');
    const deliveryOptions = $('#deliveryOptions');

    // Format CEP as user types
    inputCep.addEventListener('input', (e) => {
      e.target.value = formatCep(e.target.value);
      setHint('cepHint', '');
      inputCep.classList.remove('input-group__input--error');

      // Reset delivery selection
      cepResult.style.display = 'none';
      pickupNotice.style.display = 'none';
      state.deliveryMethod = null;
      state.cepData = null;
      btnNext.disabled = true;
      optDelivery.classList.remove('delivery-option--selected');
      optPickup.classList.remove('delivery-option--selected');
    });

    // Check CEP
    async function checkCep() {
      const cep = inputCep.value.replace(/\D/g, '');

      if (cep.length !== 8) {
        setHint('cepHint', 'Informe um CEP válido com 8 dígitos', 'error');
        inputCep.classList.add('input-group__input--error');
        return;
      }

      showLoading();
      btnCheck.disabled = true;

      try {
        // Try ViaCEP API
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();

        if (data.erro) {
          setHint('cepHint', 'CEP não encontrado. Verifique e tente novamente.', 'error');
          inputCep.classList.add('input-group__input--error');
          hideLoading();
          btnCheck.disabled = false;
          return;
        }

        state.cepData = data;

        // Show address
        const addressText = `${data.logradouro ? data.logradouro + ', ' : ''}${data.bairro ? data.bairro + ' - ' : ''}${data.localidade}/${data.uf}`;
        $('#addressText').textContent = addressText;
        $('#addressCard').style.display = 'block';

        // Check if deliverable
        const canDeliver = isDeliverableCep(cep);

        if (canDeliver) {
          // Show both options
          cepResult.style.display = 'flex';
          pickupNotice.style.display = 'none';
          optDelivery.classList.remove('delivery-option--disabled');
          deliveryOptions.style.display = 'flex';
        } else {
          // Pickup only
          cepResult.style.display = 'flex';
          pickupNotice.style.display = 'flex';
          optDelivery.classList.add('delivery-option--disabled');
          deliveryOptions.style.display = 'flex';
        }

        setHint('cepHint', 'CEP encontrado!', 'success');
      } catch (error) {
        // Fallback: allow order but show notice
        console.warn('CEP API error:', error);
        setHint(
          'cepHint',
          'Não foi possível verificar o CEP. Tente novamente.',
          'error'
        );
      } finally {
        hideLoading();
        btnCheck.disabled = false;
      }
    }

    btnCheck.addEventListener('click', checkCep);
    inputCep.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') checkCep();
    });

    // Delivery option selection
    [optDelivery, optPickup].forEach((opt) => {
      opt.addEventListener('click', () => {
        if (opt.classList.contains('delivery-option--disabled')) return;

        const method = opt.dataset.method;
        state.deliveryMethod = method;

        optDelivery.classList.remove('delivery-option--selected');
        optPickup.classList.remove('delivery-option--selected');
        opt.classList.add('delivery-option--selected');

        btnNext.disabled = false;

        if (navigator.vibrate) navigator.vibrate(10);
      });
    });

    btnNext.addEventListener('click', () => {
      if (!state.deliveryMethod) {
        showToast('Escolha uma forma de entrega', '📦');
        return;
      }
      navigateTo('contact');

      // Show address complement fields if delivery
      const addrComp = $('#addressComplement');
      if (state.deliveryMethod === 'delivery') {
        addrComp.style.display = 'block';
      } else {
        addrComp.style.display = 'none';
      }
    });

    btnBack.addEventListener('click', () => {
      navigateTo('flavor');
    });
  }

  // ==========================================
  // STEP: CONTACT / VERIFICATION
  // ==========================================
  function initContact() {
    const inputPhone = $('#inputPhone');
    const btnSendCode = $('#btnSendCode');
    const phoneSection = $('#phoneSection');
    const codeSection = $('#codeSection');
    const nameSection = $('#nameSection');
    const codeInputs = $$('.code-input');
    const btnResend = $('#btnResendCode');
    const inputName = $('#inputName');
    const inputNumber = $('#inputNumber');
    const btnNext = $('#btnContactNext');
    const btnBack = $('#btnBackContact');

    // Format phone
    inputPhone.addEventListener('input', (e) => {
      const digits = e.target.value.replace(/\D/g, '');
      e.target.value = formatPhone(e.target.value);
      setHint('phoneHint', '');
      inputPhone.classList.remove('input-group__input--error');

      btnSendCode.disabled = digits.length < 10;
    });

    // Send verification code
    async function sendCode() {
      const digits = inputPhone.value.replace(/\D/g, '');

      if (digits.length < 10 || digits.length > 11) {
        setHint('phoneHint', 'Informe um número de celular válido', 'error');
        inputPhone.classList.add('input-group__input--error');
        return;
      }

      state.phone = inputPhone.value;

      showLoading();
      btnSendCode.disabled = true;

      // Simulate sending code (in production, use Twilio/Vonage/etc)
      await new Promise((r) => setTimeout(r, 1200));
      hideLoading();

      // Show code input
      $('#phoneSentTo').textContent = state.phone;
      codeSection.style.display = 'block';
      phoneSection.querySelector('.input-group__wrapper').style.display = 'none';

      // Focus first code input
      setTimeout(() => codeInputs[0].focus(), 300);

      showToast('Código enviado por WhatsApp!', '💬');

      // For demo purposes, show the code
      setHint('codeHint', `Demo: use o código ${CONFIG.DEMO_CODE}`, '');
    }

    btnSendCode.addEventListener('click', sendCode);
    inputPhone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendCode();
    });

    // Code inputs behavior
    codeInputs.forEach((input, idx) => {
      input.addEventListener('input', (e) => {
        const val = e.target.value.replace(/\D/g, '');
        e.target.value = val.slice(0, 1);

        if (val && idx < codeInputs.length - 1) {
          codeInputs[idx + 1].focus();
        }

        // Check if all filled
        const code = Array.from(codeInputs)
          .map((i) => i.value)
          .join('');
        if (code.length === 4) {
          verifyCode(code);
        }
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !input.value && idx > 0) {
          codeInputs[idx - 1].focus();
          codeInputs[idx - 1].value = '';
        }
      });

      // Handle paste
      input.addEventListener('paste', (e) => {
        e.preventDefault();
        const pasted = (e.clipboardData || window.clipboardData)
          .getData('text')
          .replace(/\D/g, '')
          .slice(0, 4);
        pasted.split('').forEach((digit, i) => {
          if (codeInputs[i]) codeInputs[i].value = digit;
        });
        if (pasted.length === 4) {
          verifyCode(pasted);
        } else if (pasted.length > 0) {
          codeInputs[Math.min(pasted.length, 3)].focus();
        }
      });
    });

    // Verify code
    async function verifyCode(code) {
      showLoading();

      // Simulate verification
      await new Promise((r) => setTimeout(r, 800));
      hideLoading();

      if (code === CONFIG.DEMO_CODE) {
        state.phoneVerified = true;

        // Show success
        codeSection.style.display = 'none';
        nameSection.style.display = 'flex';

        showToast('Celular verificado!', '✅');

        // Focus name input
        setTimeout(() => inputName.focus(), 300);
      } else {
        // Error
        setHint('codeHint', 'Código incorreto. Tente novamente.', 'error');
        codeInputs.forEach((i) => {
          i.classList.add('code-input--error');
          i.value = '';
        });
        setTimeout(() => {
          codeInputs.forEach((i) => i.classList.remove('code-input--error'));
          codeInputs[0].focus();
        }, 500);
      }
    }

    // Resend code
    btnResend.addEventListener('click', async () => {
      btnResend.disabled = true;
      btnResend.textContent = 'Reenviando...';

      await new Promise((r) => setTimeout(r, 1000));

      btnResend.textContent = 'Código reenviado!';
      showToast('Código reenviado!', '💬');

      setTimeout(() => {
        btnResend.textContent = 'Reenviar código';
        btnResend.disabled = false;
      }, 5000);
    });

    // Name input
    inputName.addEventListener('input', () => {
      validateContactForm();
    });

    inputNumber.addEventListener('input', () => {
      validateContactForm();
    });

    function validateContactForm() {
      const nameValid = inputName.value.trim().length >= 2;
      let addressValid = true;

      if (state.deliveryMethod === 'delivery') {
        addressValid = inputNumber.value.trim().length > 0;
      }

      btnNext.disabled = !(nameValid && addressValid);
    }

    btnNext.addEventListener('click', () => {
      state.name = inputName.value.trim();
      state.addressNumber = inputNumber.value.trim();
      state.addressComplement = $('#inputComp').value.trim();

      populateSummary();
      navigateTo('confirm');
    });

    btnBack.addEventListener('click', () => {
      navigateTo('delivery');
    });
  }

  // ==========================================
  // STEP: CONFIRMATION
  // ==========================================
  function populateSummary() {
    const flavorName = FLAVOR_NAMES[state.selectedFlavor];
    const deliveryLabel =
      state.deliveryMethod === 'delivery'
        ? 'Entrega em casa'
        : `Retirada em ${CONFIG.PICKUP_ADDRESS}`;
    const nextSat = getNextSaturday();
    const piePrice = CONFIG.PRICES[state.selectedFlavor];
    const surcharge = state.isThursday ? CONFIG.THURSDAY_SURCHARGE : 0;
    const deliveryFee =
      state.deliveryMethod === 'delivery' ? CONFIG.DELIVERY_FEE : 0;
    const total = calculateTotal();

    // Build address string
    let addressStr = '';
    if (state.deliveryMethod === 'delivery' && state.cepData) {
      addressStr = `${state.cepData.logradouro || ''}, ${state.addressNumber}`;
      if (state.addressComplement)
        addressStr += ` - ${state.addressComplement}`;
      addressStr += ` - ${state.cepData.bairro || ''}, ${state.cepData.localidade}/${state.cepData.uf}`;
    }

    $('#summaryFlavor').textContent = `Torta de ${flavorName}`;
    $('#summaryDelivery').textContent = deliveryLabel;
    $('#summaryDate').textContent = formatDate(nextSat);
    $('#summaryName').textContent = state.name;
    $('#summaryPhone').textContent = state.phone;

    // Address row
    if (state.deliveryMethod === 'delivery') {
      $('#summaryAddressRow').style.display = 'flex';
      $('#summaryAddress').textContent = addressStr;
    } else {
      $('#summaryAddressRow').style.display = 'none';
    }

    // Prices
    $('#summaryPiePrice').textContent = formatCurrency(piePrice);

    if (deliveryFee > 0) {
      $('#summaryDeliveryFeeRow').style.display = 'flex';
      $('#summaryDeliveryFee').textContent = formatCurrency(deliveryFee);
    } else {
      $('#summaryDeliveryFeeRow').style.display = 'none';
    }

    if (surcharge > 0) {
      $('#summarySurchargeRow').style.display = 'flex';
      $('#summarySurcharge').textContent = formatCurrency(surcharge);
    } else {
      $('#summarySurchargeRow').style.display = 'none';
    }

    // Referral discount (future feature placeholder)
    $('#summaryDiscountRow').style.display = 'none';

    $('#summaryTotal').textContent = formatCurrency(total);
  }

  function initConfirm() {
    const btnConfirm = $('#btnConfirmOrder');
    const btnBack = $('#btnBackConfirm');

    btnConfirm.addEventListener('click', async () => {
      // Prevent double-click
      if (btnConfirm.disabled) return;
      btnConfirm.disabled = true;
      btnConfirm.textContent = 'Processando...';
      showLoading();

      // Simulate order submission
      await new Promise((r) => setTimeout(r, 1500));

      // Reserve slot
      state.slotsAvailable = Math.max(0, state.slotsAvailable - 1);
      state.orderId = generateOrderId();

      // Generate referral code
      if (!state.myReferralCode) {
        state.myReferralCode = generateReferralCode(state.name);
      }

      // If this user was referred, increment the referrer's count
      // (In production, this would be a backend call)
      if (state.referralCode) {
        // We can't directly update the referrer's count client-side
        // but we track it for demo purposes
        console.log(`Referred by: ${state.referralCode}`);
      }

      saveState();
      hideLoading();

      // Navigate to success
      populateSuccess();
      navigateTo('success');
      showConfetti();

      // Update landing slots
      renderSlots();
      renderDayStatus();

      // Re-enable button for potential new orders
      btnConfirm.disabled = false;
      btnConfirm.textContent = 'Confirmar Encomenda';
    });

    btnBack.addEventListener('click', () => {
      navigateTo('contact');
    });
  }

  // ==========================================
  // STEP: SUCCESS
  // ==========================================
  // Mini confetti celebration
  function showConfetti() {
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);

    const colors = ['#C17817', '#D4920E', '#8B4513', '#2D8F4E', '#F57F17', '#E8D5B7'];
    for (let i = 0; i < 30; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDelay = `${Math.random() * 1}s`;
      confetti.style.animationDuration = `${2 + Math.random() * 2}s`;
      confetti.style.width = `${6 + Math.random() * 8}px`;
      confetti.style.height = `${6 + Math.random() * 8}px`;
      container.appendChild(confetti);
    }

    setTimeout(() => container.remove(), 4000);
  }

  function populateSuccess() {
    const flavorName = FLAVOR_NAMES[state.selectedFlavor];
    const nextSat = getNextSaturday();

    $('#successOrderId').textContent = state.orderId;
    $('#successFlavor').textContent = `Torta de ${flavorName}`;
    $('#successDeliveryDate').textContent = formatDate(nextSat);
    $('#referralCode').textContent = state.myReferralCode;

    // Referral progress
    const pct = Math.min(
      (state.referralCount / CONFIG.REFERRAL_GOAL) * 100,
      100
    );
    $('#referralFill').style.width = `${pct}%`;
    $('#referralText').textContent = `${state.referralCount} de ${CONFIG.REFERRAL_GOAL} indicações`;
  }

  function initSuccess() {
    const btnShare = $('#btnShareWhatsapp');
    const btnNewOrder = $('#btnNewOrder');

    btnShare.addEventListener('click', () => {
      const text = CONFIG.WHATSAPP_SHARE_TEXT(state.myReferralCode);
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    });

    btnNewOrder.addEventListener('click', () => {
      resetOrder();
      navigateTo('landing');
    });
  }

  // ==========================================
  // SOLD OUT / CLOSED SCREENS
  // ==========================================
  function initClosedScreens() {
    const btnSoldoutShare = $('#btnSoldoutShare');
    if (btnSoldoutShare) {
      btnSoldoutShare.addEventListener('click', () => {
        const text =
          '🥧 As Tortas da Vó estão esgotadas essa semana! São tortas artesanais incríveis. Fica de olho para a próxima semana!';
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
      });
    }

    const btnNotify = $('#btnNotifyMe');
    if (btnNotify) {
      btnNotify.addEventListener('click', () => {
        showToast('Em breve teremos notificações!', '🔔');
      });
    }
  }

  // ==========================================
  // RESET ORDER (keep slots and referral)
  // ==========================================
  function resetOrder() {
    state.selectedFlavor = null;
    state.deliveryMethod = null;
    state.cepData = null;
    state.phone = '';
    state.phoneVerified = false;
    state.name = '';
    state.addressNumber = '';
    state.addressComplement = '';
    state.orderId = null;

    // Reset UI elements
    $$('.flavor-card').forEach((c) =>
      c.classList.remove('flavor-card--selected')
    );
    $('#btnFlavorNext').disabled = true;

    // Reset CEP
    $('#inputCep').value = '';
    $('#cepResult').style.display = 'none';
    $('#pickupOnlyNotice').style.display = 'none';
    $$('.delivery-option').forEach((o) =>
      o.classList.remove('delivery-option--selected')
    );
    $('#btnDeliveryNext').disabled = true;
    setHint('cepHint', '');

    // Reset contact
    $('#inputPhone').value = '';
    const phoneWrapper = $('#phoneSection').querySelector('.input-group__wrapper');
    if (phoneWrapper) phoneWrapper.style.display = 'flex';
    $('#codeSection').style.display = 'none';
    $('#nameSection').style.display = 'none';
    $$('.code-input').forEach((i) => (i.value = ''));
    $('#inputName').value = '';
    $('#inputNumber').value = '';
    $('#inputComp').value = '';
    $('#btnContactNext').disabled = true;
    setHint('phoneHint', '');
    setHint('codeHint', '');
    $('#btnSendCode').disabled = false;
  }

  // ==========================================
  // INITIALIZATION
  // ==========================================
  function init() {
    // Load persisted state
    loadState();

    // Check referral from URL
    checkReferral();

    // Render initial UI
    renderSlots();
    renderDayStatus();
    updatePrices();

    // Initialize all steps
    initLanding();
    initFlavor();
    initDelivery();
    initContact();
    initConfirm();
    initSuccess();
    initClosedScreens();

    // ---- FOR DEMO/TESTING: Override day check ----
    // Uncomment the lines below to test as if it were a specific day
    // state.isThursday = false;
    // Or force all days open for demo:
    enableDemoMode();
  }

  // Demo mode flag - set to false in production
  let DEMO_MODE = true;

  // Demo mode: allows ordering any day (remove in production)
  function enableDemoMode() {
    if (!DEMO_MODE) return;

    const dayInfo = getDayStatus();

    // If it's a closed day, still allow for demo but show a notice
    if (dayInfo.status === 'closed') {
      const el = $('#dayStatus');
      el.className = 'day-status day-status--open';
      el.innerHTML = `✅ Encomendas abertas! (Modo demonstração)`;
      $('#btnStart').disabled = false;
    }
  }

  // Start the app
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
