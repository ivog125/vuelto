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

const DEFAULT_CATEGORY_DEFINITIONS = [
  { id: 'nafta', nombre: 'Nafta', tieneTope: true, tope: 0, activa: true },
  { id: 'futbol', nombre: 'Fútbol', tieneTope: true, tope: 0, activa: true },
  { id: 'compras', nombre: 'Compras', tieneTope: true, tope: 0, activa: true },
  { id: 'comida', nombre: 'Comida', tieneTope: false, tope: 0, activa: true },
  { id: 'ocio', nombre: 'Ocio', tieneTope: false, tope: 0, activa: true },
  { id: 'varios', nombre: 'Varios', tieneTope: false, tope: 0, activa: true }
];

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
  incomes: [],
  categories: []
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
    registerForm: document.getElementById('registerForm'),
    registerEmailInput: document.getElementById('registerEmailInput'),
    registerPasswordInput: document.getElementById('registerPasswordInput'),
    showRegisterLink: document.getElementById('showRegisterLink'),
    showLoginLink: document.getElementById('showLoginLink'),
    authMessage: document.getElementById('authMessage'),
    saveConfigBtn: document.getElementById('saveConfigBtn'),
    expenseForm: document.getElementById('expenseForm'),
    incomeForm: document.getElementById('incomeForm'),
    monthSelect: document.getElementById('monthSelect'),
    summaryCards: document.getElementById('summaryCards'),
    budgetSection: document.getElementById('budgetSection'),
    extraSection: document.getElementById('extraSection'),
    movementsList: document.getElementById('movementsList'),
    expenseCategorySelect: document.getElementById('expenseCategory'),
    categoriesList: document.getElementById('categoriesList'),
    categoryForm: document.getElementById('categoryForm'),
    categoryNameInput: document.getElementById('categoryNameInput'),
    categoryHasTopeInput: document.getElementById('categoryHasTopeInput'),
    categoryTopeInput: document.getElementById('categoryTopeInput'),
    categoryTopeGroup: document.getElementById('categoryTopeGroup'),
    categorySubmitBtn: document.getElementById('categorySubmitBtn'),
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
  elements.registerForm.addEventListener('submit', handleRegister);
  elements.showRegisterLink.addEventListener('click', (event) => {
    event.preventDefault();
    showRegisterForm();
  });
  elements.showLoginLink.addEventListener('click', (event) => {
    event.preventDefault();
    showLoginForm();
  });
  elements.logoutBtn.addEventListener('click', handleLogout);
  elements.saveConfigBtn.addEventListener('click', handleSaveConfig);
  elements.expenseForm.addEventListener('submit', handleExpenseSubmit);
  elements.incomeForm.addEventListener('submit', handleIncomeSubmit);
  elements.monthSelect.addEventListener('change', (event) => {
    state.currentMonth = event.target.value;
    loadMonthData();
  });
  elements.movementsList.addEventListener('click', handleDeleteMovement);
  elements.categoriesList.addEventListener('click', handleCategoryListClick);
  elements.categoryForm.addEventListener('submit', handleCategorySubmit);
  elements.categoryHasTopeInput.addEventListener('change', () => toggleCategoryTopeInput(elements.categoryHasTopeInput.checked));
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

async function handleRegister(event) {
  event.preventDefault();
  const email = document.getElementById('registerEmailInput').value.trim();
  const password = document.getElementById('registerPasswordInput').value;
  const message = document.getElementById('authMessage');

  try {
    await state.auth.createUserWithEmailAndPassword(email, password);
    message.textContent = '';
  } catch (error) {
    message.textContent = error.message;
  }
}

function handleLogout() {
  state.auth.signOut();
}

function showLoginForm() {
  document.getElementById('loginForm').classList.remove('hidden');
  document.getElementById('registerForm').classList.add('hidden');
  document.getElementById('loginToggleText').classList.remove('hidden');
  document.getElementById('registerToggleText').classList.add('hidden');
}

function showRegisterForm() {
  document.getElementById('loginForm').classList.add('hidden');
  document.getElementById('registerForm').classList.remove('hidden');
  document.getElementById('loginToggleText').classList.add('hidden');
  document.getElementById('registerToggleText').classList.remove('hidden');
}

function getCurrentUserUid() {
  if (!state.user || !state.user.uid) {
    throw new Error('Usuario no autenticado: no se puede acceder a la colección de usuario.');
  }
  return state.user.uid;
}

function getUserCollection(collectionName) {
  return state.db.collection('users').doc(getCurrentUserUid()).collection(collectionName);
}

function getUserConfigDoc(docId) {
  return getUserCollection('config').doc(docId);
}

function getUserCategoriesDoc() {
  return getUserConfigDoc('categorias');
}

async function handleSaveConfig() {
  const payload = collectConfigValues();
  const configRef = getUserConfigDoc(state.currentMonth);
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

  await getUserCollection('gastos').add(payload);
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

  await getUserCollection('ingresos').add(payload);
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
  await getUserCollection('gastos').doc(id).delete();
  await loadMonthData();
}

async function handleCategorySubmit(event) {
  event.preventDefault();
  const name = document.getElementById('categoryNameInput').value.trim();
  const hasTope = document.getElementById('categoryHasTopeInput').checked;
  const tope = Number(document.getElementById('categoryTopeInput').value || 0);

  if (!name) {
    return;
  }

  const categories = [...state.categories];
  if (state.editingCategoryId) {
    const index = categories.findIndex((category) => category.id === state.editingCategoryId);
    if (index >= 0) {
      categories[index] = {
        ...categories[index],
        nombre: name,
        tieneTope: hasTope,
        tope: hasTope ? tope : 0,
        activa: categories[index].activa !== false
      };
    }
  } else {
    categories.push({
      id: buildCategoryId(name, categories),
      nombre: name,
      tieneTope: hasTope,
      tope: hasTope ? tope : 0,
      activa: true
    });
  }

  await getUserCategoriesDoc().set({ items: categories }, { merge: true });
  state.categories = categories;
  state.editingCategoryId = null;
  resetCategoryForm();
  renderCategoriesList();
  renderCategorySelect();
  await loadMonthData();
}

async function handleCategoryListClick(event) {
  const button = event.target.closest('[data-category-action]');
  if (!button) {
    return;
  }

  const id = button.dataset.categoryId;
  const action = button.dataset.categoryAction;
  if (action === 'edit') {
    startEditingCategory(id);
    return;
  }

  if (action === 'delete') {
    const categories = state.categories.map((category) => (
      category.id === id ? { ...category, activa: false } : category
    ));
    await getUserCategoriesDoc().set({ items: categories }, { merge: true });
    state.categories = categories;
    renderCategoriesList();
    renderCategorySelect();
    await loadMonthData();
  }
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

function toggleCategoryTopeInput(visible) {
  const group = document.getElementById('categoryTopeGroup');
  if (visible) {
    group.classList.remove('hidden');
  } else {
    group.classList.add('hidden');
  }
}

function resetCategoryForm() {
  document.getElementById('categoryForm').reset();
  document.getElementById('categoryTopeGroup').classList.add('hidden');
  document.getElementById('categorySubmitBtn').textContent = 'Agregar categoría';
  state.editingCategoryId = null;
}

function startEditingCategory(categoryId) {
  const category = state.categories.find((item) => item.id === categoryId);
  if (!category) {
    return;
  }

  state.editingCategoryId = categoryId;
  document.getElementById('categoryNameInput').value = category.nombre;
  document.getElementById('categoryHasTopeInput').checked = Boolean(category.tieneTope);
  document.getElementById('categoryTopeInput').value = category.tope || 0;
  toggleCategoryTopeInput(Boolean(category.tieneTope));
  document.getElementById('categorySubmitBtn').textContent = 'Guardar cambios';
}

function buildCategoryId(name, categories) {
  const base = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 20);

  const baseId = base || 'categoria';
  const existingIds = categories.map((category) => category.id);
  if (!existingIds.includes(baseId)) {
    return baseId;
  }

  let suffix = 2;
  let candidate = `${baseId}${suffix}`;
  while (existingIds.includes(candidate)) {
    suffix += 1;
    candidate = `${baseId}${suffix}`;
  }
  return candidate;
}

function renderCategorySelect() {
  const select = document.getElementById('expenseCategory');
  const activeCategories = state.categories.filter((category) => category.activa !== false);
  select.innerHTML = activeCategories
    .map((category) => `<option value="${category.id}">${category.nombre}</option>`)
    .join('');

  if (!select.value && activeCategories.length) {
    select.value = activeCategories[0].id;
  }
}

function renderCategoriesList() {
  const list = document.getElementById('categoriesList');
  const categories = state.categories.filter((category) => category.activa !== false);

  if (!categories.length) {
    list.innerHTML = '<p class="message">Todavía no hay categorías variables.</p>';
    return;
  }

  list.innerHTML = categories
    .map((category) => `
      <div class="category-item">
        <div>
          <strong>${category.nombre}</strong>
          <div class="movement-meta">${category.tieneTope ? `Tope: ${formatCurrency(category.tope || 0)}` : 'Sin tope'}</div>
        </div>
        <div class="category-actions">
          <button class="ghost" type="button" data-category-action="edit" data-category-id="${category.id}">Editar</button>
          <button class="delete-btn" type="button" data-category-action="delete" data-category-id="${category.id}">Borrar</button>
        </div>
      </div>
    `)
    .join('');
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
  const [configSnap, expensesSnap, incomesSnap, categoriesSnap] = await Promise.all([
    getUserConfigDoc(state.currentMonth).get(),
    getUserCollection('gastos').where('mes', 'in', historyMonths).get(),
    getUserCollection('ingresos').where('mes', '==', state.currentMonth).get(),
    getUserCategoriesDoc().get()
  ]);

  let configData = configSnap.exists ? configSnap.data() : null;
  if (!configData) {
    configData = await ensureConfigForMonth(state.currentMonth);
  }

  state.categories = await ensureCategoriesConfig(configData, categoriesSnap);

  const allExpenses = expensesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  state.expenses = allExpenses
    .filter((expense) => expense.mes === state.currentMonth)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  state.incomes = incomesSnap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  renderConfigForm(configData);
  renderCategorySelect();
  renderCategoriesList();
  renderSummary(configData, state.expenses, state.incomes);
  renderHistory(allExpenses);
}

async function ensureConfigForMonth(monthKey) {
  const configRef = getUserConfigDoc(monthKey);
  const existing = await configRef.get();
  if (existing.exists) {
    return existing.data();
  }

  const previousMonth = getPreviousMonthKey(monthKey);
  const previousSnap = await getUserConfigDoc(previousMonth).get();
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

async function ensureCategoriesConfig(configData, categoriesSnap) {
  const categoriesRef = getUserCategoriesDoc();
  if (categoriesSnap && categoriesSnap.exists && Array.isArray(categoriesSnap.data().items)) {
    return normalizeCategories(categoriesSnap.data().items);
  }

  const defaults = DEFAULT_CATEGORY_DEFINITIONS.map((category) => ({
    ...category,
    tope: category.id === 'nafta'
      ? Number(configData.topeNafta || 0)
      : category.id === 'futbol'
        ? Number(configData.topeFutbol || 0)
        : category.id === 'compras'
          ? Number(configData.topeCompras || 0)
          : 0
  }));

  await categoriesRef.set({ items: defaults }, { merge: true });
  return defaults;
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
    .filter((expense) => isActiveVariableCategory(expense.categoria))
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

  const budgets = state.categories.filter((category) => category.activa !== false && category.tieneTope);
  document.getElementById('budgetSection').innerHTML = `
    <h3>Sobre de gastos</h3>
    ${budgets
      .map((category) => {
        const spent = sumExpensesByCategory(expenses, category.id);
        const limit = Number(category.tope || 0);
        const percent = limit > 0 ? (spent / limit) * 100 : 0;
        const className = percent > 100 ? 'danger' : percent > 80 ? 'warning' : '';
        return `
          <div class="progress-card">
            <div class="section-head compact">
              <strong>${category.nombre}</strong>
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

  const extraCategories = state.categories.filter((category) => category.activa !== false && !category.tieneTope);
  const extraSpent = expenses
    .filter((expense) => extraCategories.some((category) => matchesCategory(expense.categoria, category.id)))
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
          <div class="movement-meta">${formatDate(expense.fecha)} · ${getCategoryDisplayName(expense.categoria)}</div>
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
    if (isActiveVariableCategory(expense.categoria)) {
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

function isActiveVariableCategory(categoryValue) {
  return state.categories.some((category) => matchesCategory(categoryValue, category.id));
}

function matchesCategory(categoryValue, categoryId) {
  return normalizeCategoryValue(categoryValue) === normalizeCategoryValue(categoryId);
}

function normalizeCategoryValue(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '');
}

function normalizeCategories(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  const seenIds = new Set();
  return items.map((item, index) => {
    const rawName = String(item?.nombre || '').trim();
    const nombre = rawName || `Categoría ${index + 1}`;
    const rawId = String(item?.id || nombre).trim();
    const baseId = normalizeCategoryValue(rawId) || `categoria${index + 1}`;

    let id = baseId;
    let suffix = 2;
    while (seenIds.has(id)) {
      id = `${baseId}${suffix}`;
      suffix += 1;
    }
    seenIds.add(id);

    return {
      ...item,
      id,
      nombre,
      tieneTope: Boolean(item?.tieneTope),
      tope: Number(item?.tope || 0),
      activa: item?.activa !== false
    };
  });
}

function getCategoryDisplayName(categoryValue) {
  const category = state.categories.find((item) => matchesCategory(categoryValue, item.id));
  if (category) {
    return category.nombre;
  }
  return CATEGORY_LABELS[normalizeCategoryValue(categoryValue).toUpperCase()] || String(categoryValue || 'Sin categoría');
}

function sumExpensesByCategory(expenses, category) {
  return expenses
    .filter((expense) => matchesCategory(expense.categoria, category))
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
