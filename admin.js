/**
 * TORTAS DA VÓ - Admin Panel
 * Order management dashboard
 */
(function () {
  'use strict';

  // ==========================================
  // CONFIG & CONSTANTS
  // ==========================================
  const STORAGE = {
    ORDERS: 'tortas_da_vo_orders',
    STATE: 'tortas_da_vo',
    SETTINGS: 'tortas_da_vo_settings',
    AUTH: 'tortas_da_vo_admin_auth',
  };

  const STATUS_LABELS = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    paid: 'Pago',
    preparing: 'Preparando',
    ready: 'Pronto',
    delivered: 'Entregue',
    cancelled: 'Cancelado',
  };

  const FLAVOR_ICONS = {
    frango: '🍗',
    'alho-poro': '🧅',
  };

  const FLAVOR_NAMES = {
    frango: 'Frango',
    'alho-poro': 'Alho Poró',
  };

  const DEFAULT_SETTINGS = {
    prices: { frango: 45, 'alho-poro': 50 },
    deliveryFee: 10,
    surcharge: 10,
    maxSlots: 10,
    pickupAddress: 'Rua das Tortas, 123 - Vila Artesanal',
    pixKey: '',
    pixName: '',
    pin: '!NOTvalZOE03',
  };

  // ==========================================
  // STATE
  // ==========================================
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  let settings = { ...DEFAULT_SETTINGS };
  let currentFilter = 'all';
  let currentOrderId = null;
  let currentTab = 'dashboard';
  let previousTab = 'dashboard';
  let tempSlots = 0;

  // ==========================================
  // DATA ACCESS
  // ==========================================
  function getOrders() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE.ORDERS) || '[]');
    } catch { return []; }
  }

  function saveOrders(orders) {
    localStorage.setItem(STORAGE.ORDERS, JSON.stringify(orders));
  }

  function getWeekOrders() {
    const wk = getWeekNumber();
    return getOrders().filter((o) => o.weekNumber === wk);
  }

  function getOrderById(id) {
    return getOrders().find((o) => o.id === id);
  }

  function updateOrder(id, updates) {
    const orders = getOrders();
    const idx = orders.findIndex((o) => o.id === id);
    if (idx >= 0) {
      orders[idx] = { ...orders[idx], ...updates };
      saveOrders(orders);
      return orders[idx];
    }
    return null;
  }

  function deleteOrder(id) {
    const orders = getOrders().filter((o) => o.id !== id);
    saveOrders(orders);
  }

  function getWeekNumber() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    return Math.floor((now - start) / 604800000);
  }

  // Settings
  function loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE.SETTINGS) || 'null');
      if (saved) settings = { ...DEFAULT_SETTINGS, ...saved };
    } catch { /* use defaults */ }
  }

  function saveSettings() {
    localStorage.setItem(STORAGE.SETTINGS, JSON.stringify(settings));
  }

  // Slots from customer site state
  function getSlotsAvailable() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE.STATE) || '{}');
      return data.slotsAvailable ?? settings.maxSlots;
    } catch { return settings.maxSlots; }
  }

  function setSlotsAvailable(n) {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE.STATE) || '{}');
      data.slotsAvailable = Math.max(0, Math.min(settings.maxSlots, n));
      data.weekNumber = getWeekNumber();
      localStorage.setItem(STORAGE.STATE, JSON.stringify(data));
    } catch { /* silent */ }
  }

  // ==========================================
  // UTILITIES
  // ==========================================
  function formatCurrency(v) {
    return `R$ ${Number(v).toFixed(0)}`;
  }

  function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }

  function formatDateTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  function formatDeliveryDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  function phoneDigits(phone) {
    return (phone || '').replace(/\D/g, '');
  }

  function getNextSaturday() {
    const now = new Date();
    const day = now.getDay();
    const d = (6 - day + 7) % 7 || 7;
    const sat = new Date(now);
    sat.setDate(now.getDate() + d);
    return sat;
  }

  function generateOrderId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let id = 'TV-';
    for (let i = 0; i < 5; i++) id += chars[Math.floor(Math.random() * chars.length)];
    return id;
  }

  function showToast(msg) {
    const el = $('#toastAdmin');
    $('#toastAdminMsg').textContent = msg;
    el.classList.add('toast-admin--visible');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.classList.remove('toast-admin--visible'), 2500);
  }

  // ==========================================
  // PIN / AUTH
  // ==========================================
  function initPin() {
    const passwordInput = $('#passwordInput');
    const btnLogin = $('#btnPasswordLogin');

    function attemptLogin() {
      const value = passwordInput.value;
      if (!value) return;
      verifyPin(value);
    }

    btnLogin.addEventListener('click', attemptLogin);
    passwordInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') attemptLogin();
    });

    // Check if already authenticated this session
    if (sessionStorage.getItem(STORAGE.AUTH) === 'true') {
      unlock();
    } else {
      setTimeout(() => passwordInput.focus(), 300);
    }
  }

  function verifyPin(code) {
    if (code === settings.pin) {
      sessionStorage.setItem(STORAGE.AUTH, 'true');
      unlock();
    } else {
      const input = $('#passwordInput');
      input.classList.add('password-input--error');
      input.value = '';
      $('#pinHint').textContent = 'Senha incorreta';
      $('#pinHint').style.color = '#ff3b30';
      setTimeout(() => {
        input.classList.remove('password-input--error');
        input.focus();
      }, 500);
    }
  }

  function unlock() {
    $('#lockScreen').style.display = 'none';
    $('#adminApp').style.display = 'block';
    refreshAll();
  }

  // ==========================================
  // NAVIGATION
  // ==========================================
  function initNav() {
    $$('.nav-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        switchTab(tab);
      });
    });

    $('#btnSeeAllOrders').addEventListener('click', () => switchTab('orders'));
    $('#btnBackFromDetail').addEventListener('click', () => switchTab(previousTab));
    $('#btnLogout').addEventListener('click', () => {
      sessionStorage.removeItem(STORAGE.AUTH);
      location.reload();
    });
  }

  function switchTab(tab) {
    if (tab !== 'order-detail') previousTab = currentTab;
    currentTab = tab;

    $$('.tab-content').forEach((t) => t.classList.remove('tab-content--active'));
    const target = $(`#tab-${tab}`);
    if (target) {
      target.classList.add('tab-content--active');
      // Re-trigger animation
      target.style.animation = 'none';
      void target.offsetWidth;
      target.style.animation = '';
    }

    $$('.nav-item').forEach((n) => n.classList.remove('nav-item--active'));
    const navBtn = tab === 'order-detail'
      ? $(`.nav-item[data-tab="orders"]`)
      : $(`.nav-item[data-tab="${tab}"]`);
    if (navBtn) navBtn.classList.add('nav-item--active');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ==========================================
  // DASHBOARD
  // ==========================================
  function refreshDashboard() {
    const weekOrders = getWeekOrders();
    const activeOrders = weekOrders.filter((o) => o.status !== 'cancelled');
    const slots = getSlotsAvailable();

    // Stats
    $('#statOrders').textContent = activeOrders.length;
    $('#statRevenue').textContent = formatCurrency(activeOrders.reduce((s, o) => s + (o.total || 0), 0));
    $('#statSlots').textContent = slots;
    $('#statDeliveries').textContent = activeOrders.filter((o) => o.deliveryMethod === 'delivery').length;

    // Header week
    const sat = getNextSaturday();
    $('#headerWeek').textContent = `Entrega: ${sat.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}`;

    // Week summary
    const frangoCount = activeOrders.filter((o) => o.flavor === 'frango').length;
    const poroCount = activeOrders.filter((o) => o.flavor === 'alho-poro').length;
    const deliveryCount = activeOrders.filter((o) => o.deliveryMethod === 'delivery').length;
    const pickupCount = activeOrders.filter((o) => o.deliveryMethod === 'pickup').length;

    $('#weekSummary').innerHTML = `
      <div class="week-summary__row">
        <div class="week-summary__flavor">
          <span class="week-summary__flavor-icon">🍗</span>
          <span class="week-summary__flavor-name">Torta de Frango</span>
        </div>
        <span class="week-summary__count">${frangoCount}</span>
      </div>
      <div class="week-summary__row">
        <div class="week-summary__flavor">
          <span class="week-summary__flavor-icon">🧅</span>
          <span class="week-summary__flavor-name">Torta de Alho Poró</span>
        </div>
        <span class="week-summary__count">${poroCount}</span>
      </div>
      <div class="week-summary__row">
        <div class="week-summary__flavor">
          <span class="week-summary__flavor-icon">🚗</span>
          <span class="week-summary__flavor-name">Entregas</span>
        </div>
        <span class="week-summary__count">${deliveryCount}</span>
      </div>
      <div class="week-summary__row">
        <div class="week-summary__flavor">
          <span class="week-summary__flavor-icon">📍</span>
          <span class="week-summary__flavor-name">Retiradas</span>
        </div>
        <span class="week-summary__count">${pickupCount}</span>
      </div>
    `;

    // Recent orders (last 5)
    const recent = weekOrders.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
    renderOrdersList('#recentOrdersList', recent);
  }

  // ==========================================
  // ORDERS LIST
  // ==========================================
  function renderOrdersList(containerSel, orders) {
    const container = $(containerSel);
    if (!orders.length) {
      container.innerHTML = `
        <div class="orders-empty">
          <div class="orders-empty__icon">📋</div>
          <p class="orders-empty__text">Nenhum pedido ainda</p>
        </div>
      `;
      return;
    }

    container.innerHTML = orders.map((o) => `
      <div class="order-card" data-order-id="${o.id}">
        <div class="order-card__top">
          <span class="order-card__id">${o.id}</span>
          <span class="order-card__status order-card__status--${o.status}">${STATUS_LABELS[o.status] || o.status}</span>
        </div>
        <div class="order-card__middle">
          <span class="order-card__flavor-icon">${FLAVOR_ICONS[o.flavor] || '🥧'}</span>
          <div class="order-card__info">
            <div class="order-card__customer">${escapeHtml(o.customerName || 'Sem nome')}</div>
            <div class="order-card__flavor">Torta de ${FLAVOR_NAMES[o.flavor] || o.flavor}</div>
          </div>
          <span class="order-card__price">${formatCurrency(o.total || 0)}</span>
        </div>
        <div class="order-card__bottom">
          <span class="order-card__method">${o.deliveryMethod === 'delivery' ? '🚗 Entrega' : '📍 Retirada'}</span>
          <span>${formatDateTime(o.createdAt)}</span>
        </div>
      </div>
    `).join('');

    // Click handlers
    container.querySelectorAll('.order-card').forEach((card) => {
      card.addEventListener('click', () => {
        openOrderDetail(card.dataset.orderId);
      });
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function refreshOrders() {
    const weekOrders = getWeekOrders();
    let filtered = weekOrders;

    if (currentFilter !== 'all') {
      filtered = weekOrders.filter((o) => o.status === currentFilter);
    }

    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    $('#ordersCount').textContent = filtered.length;
    renderOrdersList('#allOrdersList', filtered);
  }

  function initFilters() {
    $$('.filter-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        currentFilter = chip.dataset.filter;
        $$('.filter-chip').forEach((c) => c.classList.remove('filter-chip--active'));
        chip.classList.add('filter-chip--active');
        refreshOrders();
      });
    });
  }

  // ==========================================
  // SEGMENTED CONTROL (inside Orders tab)
  // ==========================================
  let currentSegment = 'list';

  function initSegmentControl() {
    $$('.segment-control__btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        switchSegment(btn.dataset.segment);
      });
    });
  }

  function switchSegment(segment) {
    currentSegment = segment;

    // Toggle button active state
    $$('.segment-control__btn').forEach((b) => b.classList.remove('segment-control__btn--active'));
    const activeBtn = $(`.segment-control__btn[data-segment="${segment}"]`);
    if (activeBtn) activeBtn.classList.add('segment-control__btn--active');

    // Toggle panels
    $$('.segment-panel').forEach((p) => p.classList.remove('segment-panel--active'));
    const panel = $(`#segment-${segment}`);
    if (panel) {
      panel.classList.add('segment-panel--active');
      // Re-trigger animation
      panel.style.animation = 'none';
      void panel.offsetWidth;
      panel.style.animation = '';
    }

    // Init/refresh map when switching to map segment
    if (segment === 'map') {
      initMap();
      setTimeout(() => refreshMap(), 150);
    }
  }

  // ==========================================
  // ORDER DETAIL
  // ==========================================
  function openOrderDetail(id) {
    const order = getOrderById(id);
    if (!order) { showToast('Pedido não encontrado'); return; }

    currentOrderId = id;

    // Fill detail fields
    $('#detailOrderId').textContent = `Pedido ${order.id}`;
    $('#detailDate').textContent = `Criado em ${formatDateTime(order.createdAt)}`;
    $('#detailName').textContent = order.customerName || '—';

    const phoneLink = $('#detailPhone');
    phoneLink.textContent = order.customerPhone || '—';
    phoneLink.href = `tel:${phoneDigits(order.customerPhone)}`;

    if (order.referredBy) {
      $('#detailReferralRow').style.display = 'flex';
      $('#detailReferral').textContent = order.referredBy;
    } else {
      $('#detailReferralRow').style.display = 'none';
    }

    $('#detailFlavor').textContent = `${FLAVOR_ICONS[order.flavor] || ''} Torta de ${FLAVOR_NAMES[order.flavor] || order.flavor}`;
    $('#detailDeliveryDate').textContent = formatDeliveryDate(order.deliveryDate);
    $('#detailMethod').textContent = order.deliveryMethod === 'delivery' ? '🚗 Entrega' : '📍 Retirada';

    if (order.deliveryMethod === 'delivery' && order.fullAddress) {
      $('#detailAddressRow').style.display = 'flex';
      $('#detailAddress').textContent = order.fullAddress;
    } else {
      $('#detailAddressRow').style.display = 'none';
    }

    // Payment
    $('#detailPiePrice').textContent = formatCurrency(order.piePrice || 0);
    if (order.deliveryFee > 0) {
      $('#detailDeliveryFeeRow').style.display = 'flex';
      $('#detailDeliveryFee').textContent = formatCurrency(order.deliveryFee);
    } else {
      $('#detailDeliveryFeeRow').style.display = 'none';
    }
    if (order.surcharge > 0) {
      $('#detailSurchargeRow').style.display = 'flex';
      $('#detailSurcharge').textContent = formatCurrency(order.surcharge);
    } else {
      $('#detailSurchargeRow').style.display = 'none';
    }
    $('#detailTotal').textContent = formatCurrency(order.total || 0);

    // Status buttons
    $$('.status-btn').forEach((btn) => {
      btn.classList.remove('status-btn--active');
      if (btn.dataset.status === order.status) btn.classList.add('status-btn--active');
    });

    switchTab('order-detail');
  }

  function initOrderDetail() {
    // Status change
    $$('.status-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!currentOrderId) return;
        const newStatus = btn.dataset.status;
        updateOrder(currentOrderId, { status: newStatus });

        $$('.status-btn').forEach((b) => b.classList.remove('status-btn--active'));
        btn.classList.add('status-btn--active');

        showToast(`Status: ${STATUS_LABELS[newStatus]}`);
        refreshAll();
      });
    });

    // Send PIX via WhatsApp
    $('#btnSendPix').addEventListener('click', () => {
      const order = getOrderById(currentOrderId);
      if (!order) return;

      const phone = phoneDigits(order.customerPhone);
      const pixInfo = settings.pixKey
        ? `\n\n💳 *Chave PIX:* ${settings.pixKey}\n👤 *Titular:* ${settings.pixName || 'Tortas da Val'}`
        : '\n\n💳 Enviaremos a chave PIX em breve.';

      const msg = `Olá, ${order.customerName}! 🥧\n\nSeu pedido *${order.id}* foi confirmado!\n\n` +
        `📋 *Torta de ${FLAVOR_NAMES[order.flavor] || order.flavor}*\n` +
        `📅 *Entrega:* ${formatDeliveryDate(order.deliveryDate)}\n` +
        `${order.deliveryMethod === 'delivery' ? `🚗 *Endereço:* ${order.fullAddress}\n` : '📍 *Retirada* no nosso endereço\n'}` +
        `💰 *Total: ${formatCurrency(order.total)}*` +
        pixInfo +
        `\n\nFaça o pagamento em até 2 horas para garantir sua vaga. Obrigada! ❤️`;

      window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    });

    // Send confirmation
    $('#btnSendConfirmation').addEventListener('click', () => {
      const order = getOrderById(currentOrderId);
      if (!order) return;

      const phone = phoneDigits(order.customerPhone);
      const msg = `Olá, ${order.customerName}! ✅\n\n` +
        `Seu pedido *${order.id}* (Torta de ${FLAVOR_NAMES[order.flavor]}) está confirmado!\n\n` +
        `${order.deliveryMethod === 'delivery' ? '🚗 Entregaremos no sábado no seu endereço.' : '📍 Sua torta estará pronta para retirada no sábado.'}\n\n` +
        `Obrigada pela confiança! 🥧❤️`;

      window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    });

    // Cancel order
    $('#btnCancelOrder').addEventListener('click', () => {
      if (!currentOrderId) return;
      if (!confirm('Tem certeza que deseja cancelar este pedido?')) return;

      updateOrder(currentOrderId, { status: 'cancelled' });

      // Return slot
      const slots = getSlotsAvailable();
      setSlotsAvailable(slots + 1);

      showToast('Pedido cancelado');
      refreshAll();
      switchTab(previousTab);
    });
  }

  // ==========================================
  // QUICK ACTIONS
  // ==========================================
  function initQuickActions() {
    // Send PIX to first pending order
    $('#btnQuickWhatsapp').addEventListener('click', () => {
      const pending = getWeekOrders().find((o) => o.status === 'pending');
      if (pending) {
        openOrderDetail(pending.id);
        setTimeout(() => $('#btnSendPix').click(), 300);
      } else {
        showToast('Nenhum pedido pendente');
      }
    });

    // Map - go to orders tab, then switch to map segment
    $('#btnQuickMap').addEventListener('click', () => {
      switchTab('orders');
      switchSegment('map');
    });

    // Manage slots
    $('#btnQuickSlots').addEventListener('click', openSlotsModal);

    // Export list
    $('#btnQuickExport').addEventListener('click', exportOrders);

    // Add manual order
    $('#btnAddOrder').addEventListener('click', openAddOrderModal);
  }

  function exportOrders() {
    const orders = getWeekOrders().filter((o) => o.status !== 'cancelled');
    if (!orders.length) { showToast('Nenhum pedido para exportar'); return; }

    let text = `🥧 TORTAS DA VÓ — Pedidos da Semana\n`;
    text += `📅 Entrega: ${formatDeliveryDate(orders[0]?.deliveryDate)}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    orders.forEach((o, i) => {
      text += `${i + 1}. ${o.customerName}\n`;
      text += `   🥧 Torta de ${FLAVOR_NAMES[o.flavor] || o.flavor}\n`;
      text += `   ${o.deliveryMethod === 'delivery' ? `🚗 ${o.fullAddress || o.address}` : '📍 Retirada'}\n`;
      text += `   📱 ${o.customerPhone}\n`;
      text += `   💰 ${formatCurrency(o.total)} — ${STATUS_LABELS[o.status]}\n\n`;
    });

    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `Total: ${orders.length} pedidos · ${formatCurrency(orders.reduce((s, o) => s + o.total, 0))}`;

    // Copy to clipboard and open WhatsApp
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => showToast('Lista copiada!'));
    }

    // Also offer WhatsApp share
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  // ==========================================
  // SLOTS MODAL
  // ==========================================
  function openSlotsModal() {
    tempSlots = getSlotsAvailable();
    $('#slotsManagerNumber').textContent = tempSlots;
    $('#slotsModalOverlay').style.display = 'flex';
  }

  function initSlotsModal() {
    $('#btnSlotsUp').addEventListener('click', () => {
      if (tempSlots < settings.maxSlots) {
        tempSlots++;
        $('#slotsManagerNumber').textContent = tempSlots;
      }
    });

    $('#btnSlotsDown').addEventListener('click', () => {
      if (tempSlots > 0) {
        tempSlots--;
        $('#slotsManagerNumber').textContent = tempSlots;
      }
    });

    $('#slotsModalSave').addEventListener('click', () => {
      setSlotsAvailable(tempSlots);
      $('#slotsModalOverlay').style.display = 'none';
      showToast(`Vagas: ${tempSlots}`);
      refreshAll();
    });

    $('#slotsModalClose').addEventListener('click', () => {
      $('#slotsModalOverlay').style.display = 'none';
    });

    $('#slotsModalOverlay').addEventListener('click', (e) => {
      if (e.target === $('#slotsModalOverlay')) $('#slotsModalOverlay').style.display = 'none';
    });
  }

  // ==========================================
  // ADD ORDER MODAL
  // ==========================================
  function openAddOrderModal() {
    $('#modalOverlay').style.display = 'flex';
    $('#manualName').value = '';
    $('#manualPhone').value = '';
    const addr = $('#manualAddressSection');
    addr.style.display = 'none';
  }

  function initAddOrderModal() {
    // Toggle address section
    $$('input[name="manualMethod"]').forEach((r) => {
      r.addEventListener('change', () => {
        $('#manualAddressSection').style.display = r.value === 'delivery' ? 'block' : 'none';
      });
    });

    $('#modalClose').addEventListener('click', () => { $('#modalOverlay').style.display = 'none'; });
    $('#modalCancel').addEventListener('click', () => { $('#modalOverlay').style.display = 'none'; });
    $('#modalOverlay').addEventListener('click', (e) => {
      if (e.target === $('#modalOverlay')) $('#modalOverlay').style.display = 'none';
    });

    $('#modalConfirm').addEventListener('click', () => {
      const name = $('#manualName').value.trim();
      const phone = $('#manualPhone').value.trim();
      if (!name) { showToast('Informe o nome'); return; }

      const flavor = document.querySelector('input[name="manualFlavor"]:checked').value;
      const method = document.querySelector('input[name="manualMethod"]:checked').value;
      const address = method === 'delivery' ? ($('#manualAddress').value.trim() || '') : '';

      const sat = getNextSaturday();
      const piePrice = settings.prices[flavor] || 45;
      const deliveryFee = method === 'delivery' ? settings.deliveryFee : 0;

      const order = {
        id: generateOrderId(),
        flavor,
        flavorName: FLAVOR_NAMES[flavor],
        deliveryMethod: method,
        cep: '',
        address: address,
        addressNumber: '',
        addressComplement: '',
        fullAddress: address,
        customerName: name,
        customerPhone: phone,
        piePrice,
        deliveryFee,
        surcharge: 0,
        total: piePrice + deliveryFee,
        isThursdayOrder: false,
        referredBy: null,
        referralCode: null,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        deliveryDate: sat.toISOString().split('T')[0],
        weekNumber: getWeekNumber(),
      };

      const orders = getOrders();
      orders.push(order);
      saveOrders(orders);

      // Update slots
      const slots = getSlotsAvailable();
      setSlotsAvailable(slots - 1);

      $('#modalOverlay').style.display = 'none';
      showToast(`Pedido ${order.id} criado!`);
      refreshAll();
    });
  }

  // ==========================================
  // SETTINGS
  // ==========================================
  function initSettings() {
    // Populate from saved settings
    $('#settPriceFrago').value = settings.prices.frango;
    $('#settPricePoro').value = settings.prices['alho-poro'];
    $('#settDeliveryFee').value = settings.deliveryFee;
    $('#settSurcharge').value = settings.surcharge;
    $('#settMaxSlots').value = settings.maxSlots;
    $('#settPickupAddress').value = settings.pickupAddress;
    $('#settPixKey').value = settings.pixKey;
    $('#settPixName').value = settings.pixName;
    $('#settPin').value = settings.pin;

    // Used slots
    const weekOrders = getWeekOrders().filter((o) => o.status !== 'cancelled');
    $('#settUsedSlots').textContent = weekOrders.length;

    // Save
    $('#btnSaveSettings').addEventListener('click', () => {
      settings.prices.frango = parseInt($('#settPriceFrago').value) || 45;
      settings.prices['alho-poro'] = parseInt($('#settPricePoro').value) || 50;
      settings.deliveryFee = parseInt($('#settDeliveryFee').value) || 10;
      settings.surcharge = parseInt($('#settSurcharge').value) || 10;
      settings.maxSlots = parseInt($('#settMaxSlots').value) || 10;
      settings.pickupAddress = $('#settPickupAddress').value.trim();
      settings.pixKey = $('#settPixKey').value.trim();
      settings.pixName = $('#settPixName').value.trim();
      settings.pin = $('#settPin').value.trim() || '!NOTvalZOE03';

      saveSettings();
      showToast('Configurações salvas!');
    });

    // Reset slots
    $('#btnResetSlots').addEventListener('click', () => {
      if (!confirm('Resetar as vagas da semana para o máximo?')) return;
      setSlotsAvailable(settings.maxSlots);
      showToast('Vagas resetadas!');
      refreshAll();
    });

    // Clear orders
    $('#btnClearOrders').addEventListener('click', () => {
      if (!confirm('Limpar TODOS os pedidos? Esta ação não pode ser desfeita.')) return;
      if (!confirm('Tem certeza mesmo?')) return;
      localStorage.removeItem(STORAGE.ORDERS);
      setSlotsAvailable(settings.maxSlots);
      showToast('Pedidos limpos');
      refreshAll();
    });

    // Reset all
    $('#btnResetAll').addEventListener('click', () => {
      if (!confirm('Resetar TUDO? Pedidos, configurações e dados serão perdidos.')) return;
      if (!confirm('Última chance. Tem certeza?')) return;
      localStorage.removeItem(STORAGE.ORDERS);
      localStorage.removeItem(STORAGE.STATE);
      localStorage.removeItem(STORAGE.SETTINGS);
      showToast('Tudo resetado');
      setTimeout(() => location.reload(), 500);
    });
  }

  // ==========================================
  // MAP
  // ==========================================
  let map = null;
  let mapMarkers = [];
  let mapInitialized = false;

  const STATUS_COLORS = {
    pending:    '#ff9500',
    confirmed:  '#007aff',
    paid:       '#5856d6',
    preparing:  '#ff6b35',
    ready:      '#34c759',
    delivered:  '#30d158',
    cancelled:  '#ff3b30',
  };

  function initMap() {
    if (mapInitialized) return;
    mapInitialized = true;

    // Default center: São Paulo
    map = L.map('mapContainer', {
      zoomControl: true,
      attributionControl: false,
    }).setView([-23.55, -46.63], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
    }).addTo(map);

    // Fix tile rendering after tab switch
    setTimeout(() => map.invalidateSize(), 200);
  }

  function createMarkerIcon(color, label) {
    return L.divIcon({
      className: '',
      html: `<div style="
        width:30px;height:30px;border-radius:50%;
        background:${color};color:#fff;
        display:flex;align-items:center;justify-content:center;
        font-size:12px;font-weight:700;font-family:Inter,sans-serif;
        box-shadow:0 2px 8px rgba(0,0,0,0.3);
        border:2px solid #fff;
      ">${label}</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -18],
    });
  }

  async function geocodeOrder(order) {
    // Build query from address parts
    const query = [order.fullAddress || order.address, 'Brasil']
      .filter(Boolean).join(', ');
    if (!query || query === 'Brasil') return null;

    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        { headers: { 'Accept-Language': 'pt-BR' } }
      );
      const results = await resp.json();
      if (results.length > 0) {
        return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
      }
    } catch (e) {
      console.warn('Geocode failed for order', order.id, e);
    }
    return null;
  }

  async function refreshMap() {
    if (!map) initMap();
    setTimeout(() => map.invalidateSize(), 100);

    // Get delivery orders for this week (not cancelled, not delivered)
    const weekOrders = getWeekOrders();
    const deliveryOrders = weekOrders.filter(
      (o) => o.deliveryMethod === 'delivery' && o.status !== 'cancelled'
    );

    $('#mapSubtitle').textContent = `${deliveryOrders.length} entrega${deliveryOrders.length !== 1 ? 's' : ''} neste sábado`;

    // Clear existing markers
    mapMarkers.forEach((m) => map.removeLayer(m));
    mapMarkers = [];

    if (deliveryOrders.length === 0) {
      $('#mapOrdersList').innerHTML = `
        <div class="map-empty">
          <div class="map-empty__icon">📍</div>
          <p class="map-empty__text">Nenhuma entrega agendada.<br>Os pedidos com entrega aparecerão aqui no mapa.</p>
        </div>
      `;
      return;
    }

    const bounds = [];
    let cardHtml = '';
    let idx = 0;

    for (const order of deliveryOrders) {
      idx++;
      let lat = order.lat;
      let lng = order.lng;

      // If no coords, try to geocode (and save back)
      if (!lat || !lng) {
        const coords = await geocodeOrder(order);
        if (coords) {
          lat = coords.lat;
          lng = coords.lng;
          // Persist coords back to the order
          updateOrder(order.id, { lat, lng });
        }
      }

      const color = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
      const statusLabel = STATUS_LABELS[order.status] || order.status;
      const statusClass = `order-card__status--${order.status}`;

      if (lat && lng) {
        const marker = L.marker([lat, lng], {
          icon: createMarkerIcon(color, idx),
        }).addTo(map);

        const popupHtml = `
          <div class="map-popup">
            <div class="map-popup__name">${idx}. ${escapeHtml(order.customerName)}</div>
            <div class="map-popup__flavor">${FLAVOR_ICONS[order.flavor] || '🥧'} Torta de ${FLAVOR_NAMES[order.flavor] || order.flavor}</div>
            <div class="map-popup__address">${escapeHtml(order.fullAddress || order.address)}</div>
            <span class="map-popup__status ${statusClass}">${statusLabel}</span>
            <div class="map-popup__actions">
              <button class="map-popup__btn map-popup__btn--nav" onclick="window._openNavigation(${lat},${lng})">🧭 Navegar</button>
              <button class="map-popup__btn map-popup__btn--detail" onclick="window._openOrderFromMap('${order.id}')">Ver pedido</button>
            </div>
          </div>
        `;
        marker.bindPopup(popupHtml);
        mapMarkers.push(marker);
        bounds.push([lat, lng]);
      }

      // Order card below map
      const hasCoords = lat && lng;
      cardHtml += `
        <div class="map-order-card" data-order-id="${order.id}" ${hasCoords ? `data-lat="${lat}" data-lng="${lng}"` : ''}>
          <div class="map-order-card__marker map-order-card__marker--${order.status}">${idx}</div>
          <div class="map-order-card__info">
            <div class="map-order-card__name">${escapeHtml(order.customerName)}</div>
            <div class="map-order-card__address">${escapeHtml(order.fullAddress || order.address || 'Endereço não informado')}</div>
          </div>
          <div class="map-order-card__action">
            ${hasCoords ? `<button class="map-order-card__nav-btn" title="Navegar" data-lat="${lat}" data-lng="${lng}">🧭</button>` : '<span style="font-size:0.7rem;color:var(--text-muted);">Sem mapa</span>'}
          </div>
        </div>
      `;
    }

    $('#mapOrdersList').innerHTML = cardHtml;

    // Fit map to markers
    if (bounds.length > 0) {
      if (bounds.length === 1) {
        map.setView(bounds[0], 15);
      } else {
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    }

    // Click handlers for order cards
    $$('.map-order-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        // Don't trigger if clicking nav button
        if (e.target.closest('.map-order-card__nav-btn')) return;
        const lat = card.dataset.lat;
        const lng = card.dataset.lng;
        if (lat && lng) {
          map.setView([parseFloat(lat), parseFloat(lng)], 16);
          // Open the corresponding marker popup
          const idx = Array.from($$('.map-order-card')).indexOf(card);
          if (mapMarkers[idx]) mapMarkers[idx].openPopup();
        }
      });
    });

    // Navigation buttons in card list
    $$('.map-order-card__nav-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const lat = btn.dataset.lat;
        const lng = btn.dataset.lng;
        openNavigation(parseFloat(lat), parseFloat(lng));
      });
    });
  }

  // Open external navigation (Google Maps / Waze)
  function openNavigation(lat, lng) {
    // Try Google Maps first (works on both iOS and Android)
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    window.open(url, '_blank');
  }

  // Expose functions for popup onclick (Leaflet popups use innerHTML)
  window._openNavigation = openNavigation;
  window._openOrderFromMap = function (id) {
    openOrderDetail(id);
  };

  // ==========================================
  // REFRESH ALL
  // ==========================================
  function refreshAll() {
    refreshDashboard();
    refreshOrders();
    if (mapInitialized) refreshMap();

    const weekOrders = getWeekOrders().filter((o) => o.status !== 'cancelled');
    $('#settUsedSlots').textContent = weekOrders.length;
  }

  // ==========================================
  // INIT
  // ==========================================
  function init() {
    loadSettings();
    initPin();
    initNav();
    initFilters();
    initSegmentControl();
    initOrderDetail();
    initQuickActions();
    initSlotsModal();
    initAddOrderModal();
    initSettings();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
