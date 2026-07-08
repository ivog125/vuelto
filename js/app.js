const CATEGORY_LABELS = {
  NAFTA: 'Nafta',
  FUTBOL: 'Fútbol',
  COMPRAS: 'Compras',
  COMIDA: 'Comida',
  OCIO: 'Ocio',
  VARIOS: 'Varios',
  DEUDA: 'Deuda',
  AHORRO: 'Ahorro',
  FIJOS: 'Fijos'
};

const VARIABLE_CATEGORIES = ['NAFTA', 'FUTBOL', 'COMPRAS', 'COMIDA', 'OCIO', 'VARIOS'];
const DEFAULT_CONFIG = {
  sueldo: 0,
  fijos: 0,
  deuda: 0,
  ahorroModo: 'porcentaje',
  ahorroMontoFijo: 0,
  ahorroPct: 0,
  topeNafta: 0,
  topeFutbol: 0,
  topeCompras: 0
};

const state = {
  auth: null,
  db: null,
  user: null,
  currentMonth: getMonthKey(new Date()),
  chart: null,
  expenses: [],
  incomes: []
};

const firebaseConfig = {
  apiKey: "AIzaSyAMP8TI_JEPvc2OI8jUf2HVbS7g8EpxsaE",
  authDomain: "app-gastos-f3b82.firebaseapp.com",
  projectId: "app-gastos-f3b82",
  storageBucket: "app-gastos-f3b82.firebasestorage.app",
  messagingSenderId: "334331280632",
  appId: "1:334331280632:web:fcb2e1c351c0cbc39c4f0d",
  measurementId: "G-V2FLMVRR51"
};

function initializeApp() {
  const appElements = {
    authCard: document.getElementById('authCard'),
    app: document.getElementById('app'),
    logoutBtn: document.getElementById('logoutBtn'),
    loginForm: document.getElementById('loginForm'),
    emailInput: document.getElementById('emailInput'),
    passwordInput: document.getElementById('passwordInput'),
    authMessage: document.getElementById('authMessage'),
    saveConfigBtn: document.getElementById('saveConfigBtn'),
    expenseForm: document.getElementById('expenseForm'),
    incomeForm: document.getElementById('incomeForm'),
    monthSelect: document.getElementById('monthSelect'),
    summaryCards: document.getElementById('summaryCards'),
    budgetSection: document.getElementById('budgetSection'),
    extraSection: document.getElementById('extraSection'),
    movementsList: document.getElementById('movementsList'),
    registerSection: document.getElementById('registerSection'),
    summarySection: document.getElementById('summarySection'),
    settingsSection: document.getElementById('settingsSection'),
    tabRegisterBtn: document.getElementById('tabRegisterBtn'),
    tabSummaryBtn: document.getElementById('tabSummaryBtn'),
    tabSettingsBtn: document.getElementById('tabSettingsBtn')
  };

  if (firebaseConfig.apiKey.includes('YOUR_')) {
    appElements.authMessage.textContent = 'Reemplazá las credenciales de Firebase en js/app.js para habilitar el login.';
    return;
  }

  firebase.initializeApp(firebaseConfig);
  state.auth = firebase.auth();
  state.db = firebase.firestore();

  bindEvents(appElements);
  populateMonthSelect(appElements.monthSelect);
  setDefaultDate();

  state.auth.onAuthStateChanged((user) => {
    state.user = user;
    if (user) {
      showAuthenticatedView(appElements);
      loadMonthData();
    } else {
      showLoginView(appElements);
    }
  });
}

function bindEvents(elements) {
  elements.loginForm.addEventListener('submit', handleLogin);
  elements.logoutBtn.addEventListener('click', handleLogout);
  elements.saveConfigBtn.addEventListener('click', handleSaveConfig);
  elements.expenseForm.addEventListener('submit', handleExpenseSubmit);
  elements.incomeForm.addEventListener('submit', handleIncomeSubmit);
  elements.monthSelect.addEventListener('change', (event) => {
    state.currentMonth = event.target.value;
    loadMonthData();
  });
  elements.movementsList.addEventListener('click', handleDeleteMovement);
  elements.tabRegisterBtn.addEventListener('click', () => showTab('register'));
  elements.tabSummaryBtn.addEventListener('click', () => showTab('summary'));
  elements.tabSettingsBtn.addEventListener('click', () => showTab('settings'));
}

async function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById('emailInput').value.trim();
  const password = document.getElementById('passwordInput').value;
  const message = document.getElementById('authMessage');

  try {
    await state.auth.signInWithEmailAndPassword(email, password);
    message.textContent = '';
  } catch (error) {
    message.textContent = error.message;
  }
}

function handleLogout() {
  state.auth.signOut();
}

async function handleSaveConfig() {
  const payload = collectConfigValues();
  const configRef = state.db.collection('config').doc(state.currentMonth);
  await configRef.set(payload, { merge: true });
  await loadMonthData();
}

async function handleExpenseSubmit(event) {
  event.preventDefault();
  const payload = {
    fecha: document.getElementById('expenseDate').value,
    categoria: document.getElementById('expenseCategory').value,
    descripcion: document.getElementById('expenseDescription').value.trim(),
    monto: Number(document.getElementById('expenseAmount').value),
    mes: state.currentMonth
  };

  if (!payload.fecha || !payload.descripcion || !payload.monto) {
    return;
  }

  await state.db.collection('gastos').add(payload);
  event.target.reset();
  setDefaultDate();
  await loadMonthData();
}

async function handleIncomeSubmit(event) {
  event.preventDefault();
  const payload = {
    fecha: document.getElementById('incomeDate').value,
    descripcion: document.getElementById('incomeDescription').value.trim(),
    monto: Number(document.getElementById('incomeAmount').value),
    mes: state.currentMonth
  };

  if (!payload.fecha || !payload.descripcion || !payload.monto) {
    return;
  }

  await state.db.collection('ingresos').add(payload);
  event.target.reset();
  setDefaultDate();
  await loadMonthData();
}

async function handleDeleteMovement(event) {
  const button = event.target.closest('[data-delete-id]');
  if (!button) {
    return;
  }
  const id = button.dataset.deleteId;
  await state.db.collection('gastos').doc(id).delete();
  await loadMonthData();
}

function showAuthenticatedView(elements) {
  elements.authCard.classList.add('hidden');
  elements.app.classList.remove('hidden');
  elements.logoutBtn.classList.remove('hidden');
}

function showTab(tab) {
  const registerSection = document.getElementById('registerSection');
  const summarySection = document.getElementById('summarySection');
  const settingsSection = document.getElementById('settingsSection');
  const tabRegisterBtn = document.getElementById('tabRegisterBtn');
  const tabSummaryBtn = document.getElementById('tabSummaryBtn');
  const tabSettingsBtn = document.getElementById('tabSettingsBtn');

  [registerSection, summarySection, settingsSection].forEach((section) => section.classList.add('hidden'));
  [tabRegisterBtn, tabSummaryBtn, tabSettingsBtn].forEach((btn) => btn.classList.remove('active'));

  if (tab === 'summary') {
    summarySection.classList.remove('hidden');
    tabSummaryBtn.classList.add('active');
  } else if (tab === 'settings') {
    settingsSection.classList.remove('hidden');
    tabSettingsBtn.classList.add('active');
  } else {
    registerSection.classList.remove('hidden');
    tabRegisterBtn.classList.add('active');
  }
}

function showLoginView(elements) {
  elements.authCard.classList.remove('hidden');
  elements.app.classList.add('hidden');
  elements.logoutBtn.classList.add('hidden');
}

function populateMonthSelect(select) {
  const now = new Date();
  const months = [];
  for (let index = 0; index < 12; index += 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - index, 1);
    months.push(getMonthKey(monthDate));
  }

  select.innerHTML = months
    .map((monthKey) => `<option value="${monthKey}">${formatMonthLabel(monthKey)}</option>`)
    .join('');

  select.value = state.currentMonth;
}

function setDefaultDate() {
  const today = new Date().toISOString().slice(0, 10);
  document.getElementById('expenseDate').value = today;
  document.getElementById('incomeDate').value = today;
}

function collectConfigValues() {
  const values = {};
  document.querySelectorAll('[data-config-field]').forEach((input) => {
    const key = input.dataset.configField;
    if (input.type === 'radio') {
      if (input.checked) {
        values[key] = input.value;
      }
      return;
    }
    values[key] = Number(input.value || 0);
  });

  if (!values.ahorroModo) {
    values.ahorroModo = 'porcentaje';
  }

  return {
    ...DEFAULT_CONFIG,
    ...values,
    mes: state.currentMonth
  };
}

async function loadMonthData() {
  if (!state.user || !state.db) {
    return;
  }

  const historyMonths = getRecentMonths(6);
  const [configSnap, expensesSnap, incomesSnap] = await Promise.all([
    state.db.collection('config').doc(state.currentMonth).get(),
    state.db.collection('gastos').where('mes', 'in', historyMonths).get(),
    state.db.collection('ingresos').where('mes', '==', state.currentMonth).get()
  ]);

  let configData = configSnap.exists ? configSnap.data() : null;
  if (!configData) {
    configData = await ensureConfigForMonth(state.currentMonth);
  }

  const allExpenses = expensesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  state.expenses = allExpenses
    .filter((expense) => expense.mes === state.currentMonth)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  state.incomes = incomesSnap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  renderConfigForm(configData);
  renderSummary(configData, state.expenses, state.incomes);
  renderHistory(allExpenses);
}

async function ensureConfigForMonth(monthKey) {
  const configRef = state.db.collection('config').doc(monthKey);
  const existing = await configRef.get();
  if (existing.exists) {
    return existing.data();
  }

  const previousMonth = getPreviousMonthKey(monthKey);
  const previousSnap = await state.db.collection('config').doc(previousMonth).get();
  const source = previousSnap.exists ? previousSnap.data() : DEFAULT_CONFIG;
  const payload = {
    ...DEFAULT_CONFIG,
    ...source,
    ahorroModo: source.ahorroModo || DEFAULT_CONFIG.ahorroModo,
    ahorroMontoFijo: source.ahorroMontoFijo ?? DEFAULT_CONFIG.ahorroMontoFijo,
    mes: monthKey
  };

  await configRef.set(payload, { merge: true });
  return payload;
}

function renderConfigForm(config) {
  document.querySelectorAll('[data-config-field]').forEach((input) => {
    const key = input.dataset.configField;
    if (input.type === 'radio') {
      input.checked = input.value === (config[key] || 'porcentaje');
      return;
    }
    input.value = config[key] ?? 0;
  });

  const mode = config.ahorroModo === 'fijo' ? 'fijo' : 'porcentaje';
  toggleAhorroFields(mode);
}

function toggleAhorroFields(mode) {
  const fixedGroup = document.getElementById('ahorroFixedGroup');
  const pctGroup = document.getElementById('ahorroPctGroup');
  if (mode === 'fijo') {
    fixedGroup.classList.remove('hidden');
    pctGroup.classList.add('hidden');
  } else {
    fixedGroup.classList.add('hidden');
    pctGroup.classList.remove('hidden');
  }
}

function renderSummary(config, expenses, incomes) {
  const sueldo = Number(config.sueldo || 0);
  const fijos = Number(config.fijos || 0);
  const deuda = Number(config.deuda || 0);
  const ingresoExtraTotal = incomes.reduce((sum, income) => sum + Number(income.monto || 0), 0);
  const ahorroAmount = config.ahorroModo === 'fijo'
    ? Number(config.ahorroMontoFijo || 0)
    : (sueldo * Number(config.ahorroPct || 0)) / 100;
  const fixedAndSavingsTotal = fijos + deuda + ahorroAmount;
  const variableTotal = expenses
    .filter((expense) => VARIABLE_CATEGORIES.includes(expense.categoria))
    .reduce((sum, expense) => sum + Number(expense.monto || 0), 0);
  const remainingMargin = sueldo + ingresoExtraTotal - fixedAndSavingsTotal - variableTotal;

  const cards = [
    { label: 'Sueldo', value: formatCurrency(sueldo) },
    { label: 'Ingreso extra del mes', value: formatCurrency(ingresoExtraTotal) },
    { label: 'Fijos + deuda + ahorro', value: formatCurrency(fixedAndSavingsTotal), subText: getAhorroSummaryText(config, ahorroAmount) },
    { label: 'Gasto variable', value: formatCurrency(variableTotal) },
    { label: 'Margen restante', value: formatCurrency(remainingMargin), negative: remainingMargin < 0 }
  ];

  document.getElementById('summaryCards').innerHTML = cards
    .map((card) => `
      <div class="summary-card${card.negative ? ' negative' : ''}">
        <div class="summary-label">${card.label}</div>
        <div class="summary-value">${card.value}</div>
        ${card.subText ? `<div class="summary-sub">${card.subText}</div>` : ''}
      </div>
    `)
    .join('');

  const budgets = [
    { key: 'topeNafta', label: 'NAFTA', category: 'NAFTA' },
    { key: 'topeFutbol', label: 'FUTBOL', category: 'FUTBOL' },
    { key: 'topeCompras', label: 'COMPRAS', category: 'COMPRAS' }
  ];

  document.getElementById('budgetSection').innerHTML = `
    <h3>Sobre de gastos</h3>
    ${budgets
      .map((budget) => {
        const spent = sumExpensesByCategory(expenses, budget.category);
        const limit = Number(config[budget.key] || 0);
        const percent = limit > 0 ? (spent / limit) * 100 : 0;
        const className = percent > 100 ? 'danger' : percent > 80 ? 'warning' : '';
        return `
          <div class="progress-card">
            <div class="section-head compact">
              <strong>${budget.label}</strong>
              <span>${formatCurrency(spent)} / ${formatCurrency(limit)}</span>
            </div>
            <div class="progress-bar ${className}">
              <span style="width: ${Math.min(percent, 100)}%"></span>
            </div>
          </div>
        `;
      })
      .join('')}
  `;

  const extraSpent = expenses
    .filter((expense) => ['COMIDA', 'OCIO', 'VARIOS'].includes(expense.categoria))
    .reduce((sum, expense) => sum + Number(expense.monto || 0), 0);

  document.getElementById('extraSection').innerHTML = `
    <h3>Comida + ocio + varios</h3>
    <div class="progress-card">
      <div class="section-head compact">
        <strong>Absorbe lo que sobra</strong>
        <span>${formatCurrency(extraSpent)}</span>
      </div>
      <p class="message">Sin tope duro, se usa como amortiguador del mes.</p>
    </div>
  `;

  renderMovements(expenses);
}

function renderMovements(expenses) {
  const list = document.getElementById('movementsList');
  if (!expenses.length) {
    list.innerHTML = '<p class="message">Todavía no hay movimientos en este mes.</p>';
    return;
  }

  list.innerHTML = expenses
    .map((expense) => `
      <div class="movement-item">
        <div>
          <strong>${expense.descripcion}</strong>
          <div class="movement-meta">${formatDate(expense.fecha)} · ${CATEGORY_LABELS[expense.categoria] || expense.categoria}</div>
        </div>
        <div class="movement-meta">
          <div>${formatCurrency(expense.monto)}</div>
          <button class="delete-btn" type="button" data-delete-id="${expense.id}">Borrar</button>
        </div>
      </div>
    `)
    .join('');
}

function renderHistory(expenses) {
  const months = getRecentMonths(6);
  const totals = {};
  expenses.forEach((expense) => {
    if (VARIABLE_CATEGORIES.includes(expense.categoria)) {
      totals[expense.mes] = (totals[expense.mes] || 0) + Number(expense.monto || 0);
    }
  });

  const labels = months.map((monthKey) => formatMonthLabel(monthKey));
  const values = months.map((monthKey) => totals[monthKey] || 0);

  const canvas = document.getElementById('historyChart');
  if (state.chart) {
    state.chart.destroy();
  }

  state.chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Gasto variable',
          data: values,
          backgroundColor: '#111111',
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => formatCurrency(value)
          }
        }
      }
    }
  });
}

function getAhorroSummaryText(config, ahorroAmount) {
  if (config.ahorroModo === 'fijo') {
    return `Ahorro: ${formatCurrency(ahorroAmount)} (monto fijo)`;
  }
  return `Ahorro: ${Number(config.ahorroPct || 0)}% (${formatCurrency(ahorroAmount)})`;
}

function sumExpensesByCategory(expenses, category) {
  return expenses
    .filter((expense) => expense.categoria === category)
    .reduce((sum, expense) => sum + Number(expense.monto || 0), 0);
}

function formatCurrency(value) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function formatDate(value) {
  return new Date(value).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
}

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-');
  return new Date(Number(year), Number(month) - 1).toLocaleDateString('es-AR', {
    month: 'short',
    year: 'numeric'
  });
}

function getMonthKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function getPreviousMonthKey(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  date.setMonth(date.getMonth() - 1);
  return getMonthKey(date);
}

function getRecentMonths(count) {
  const months = [];
  const now = new Date();
  for (let index = count - 1; index >= 0; index -= 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - index, 1);
    months.push(getMonthKey(monthDate));
  }
  return months;
}

document.addEventListener('DOMContentLoaded', initializeApp);
