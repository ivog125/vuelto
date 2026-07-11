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
  ahorroModo: 'porcentaje',
  ahorroMontoFijo: 0,
  ahorroPct: 0
};

const DEFAULT_GENERAL_CONFIG = {
  saldoInicialTarjeta: 0,
  fechaCierre: null,
  fechaVencimiento: null,
  tieneDeuda: false
};

const state = {
  auth: null,
  db: null,
  user: null,
  currentMonth: getMonthKey(new Date()),
  chart: null,
  expenses: [],
  incomes: [],
  categories: [],
  tarjeta: [],
  tarjetaAll: [],
  acreedores: [],
  deuda: [],
  deudaAll: [],
  config: null,
  generalConfig: null,
  editingAcreedorId: null
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
    saveGeneralConfigBtn: document.getElementById('saveGeneralConfigBtn'),
    expenseForm: document.getElementById('expenseForm'),
    incomeForm: document.getElementById('incomeForm'),
    tarjetaForm: document.getElementById('tarjetaForm'),
    tarjetaDate: document.getElementById('tarjetaDate'),
    tarjetaTipo: document.getElementById('tarjetaTipo'),
    tarjetaDescription: document.getElementById('tarjetaDescription'),
    tarjetaAmount: document.getElementById('tarjetaAmount'),
    tarjetaPagoCompletoInput: document.getElementById('tarjetaPagoCompletoInput'),
    tarjetaList: document.getElementById('tarjetaList'),
    acreedorForm: document.getElementById('acreedorForm'),
    acreedoresList: document.getElementById('acreedoresList'),
    deudaForm: document.getElementById('deudaForm'),
    deudaTipo: document.getElementById('deudaTipo'),
    deudaAcreedor: document.getElementById('deudaAcreedor'),
    deudaList: document.getElementById('deudaList'),
    saveDeudaToggleBtn: document.getElementById('saveDeudaToggleBtn'),
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
    tabTarjetaBtn: document.getElementById('tabTarjetaBtn'),
    tabDeudaBtn: document.getElementById('tabDeudaBtn'),
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
  toggleTarjetaDescription(appElements.tarjetaTipo?.value);
  toggleDeudaDescription(appElements.deudaTipo?.value);
  updateTarjetaPagoCompletoUI();

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
  elements.tabTarjetaBtn?.addEventListener('click', () => showTab('tarjeta'));
  elements.tarjetaForm?.addEventListener('submit', handleTarjetaSubmit);
  elements.tarjetaList?.addEventListener('click', handleTarjetaListClick);
  elements.tarjetaTipo?.addEventListener('change', (event) => {
    toggleTarjetaDescription(event.target.value);
    updateTarjetaPagoCompletoUI();
  });
  elements.tarjetaPagoCompletoInput?.addEventListener('change', handleTarjetaPagoCompletoChange);
  elements.tabDeudaBtn?.addEventListener('click', () => showTab('deuda'));
  elements.acreedorForm?.addEventListener('submit', handleAcreedorSubmit);
  elements.acreedoresList?.addEventListener('click', handleAcreedorListClick);
  elements.deudaForm?.addEventListener('submit', handleDeudaSubmit);
  elements.deudaList?.addEventListener('click', handleDeudaListClick);
  elements.deudaTipo?.addEventListener('change', (event) => toggleDeudaDescription(event.target.value));
  elements.deudaAcreedor?.addEventListener('change', () => {
    const tipoValue = document.getElementById('deudaTipo')?.value;
    if (tipoValue === 'pago') {
      toggleDeudaDescription('pago');
    }
  });
  elements.logoutBtn.addEventListener('click', handleLogout);
  elements.saveConfigBtn.addEventListener('click', handleSaveConfig);
  elements.saveGeneralConfigBtn?.addEventListener('click', handleSaveGeneralConfig);
  elements.saveDeudaToggleBtn?.addEventListener('click', handleSaveGeneralConfig);
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
  elements.categoriesList.addEventListener('input', handleCategoryListInput);
  elements.categoriesList.addEventListener('change', handleCategoryListChange);
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

function getUserGeneralConfigDoc() {
  return getUserConfigDoc('general');
}

function getUserAcreedoresDoc() {
  return getUserConfigDoc('acreedores');
}

async function handleSaveConfig() {
  const payload = collectConfigValues();
  const configRef = getUserConfigDoc(state.currentMonth);
  await configRef.set(payload, { merge: true });
  await loadMonthData();
}

async function handleSaveGeneralConfig() {
  const payload = collectGeneralConfigValues();
  await getUserGeneralConfigDoc().set(payload, { merge: true });
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
  if (button) {
    const id = button.dataset.categoryId;
    const action = button.dataset.categoryAction;
    if (action === 'edit') {
      startInlineEditingCategory(id);
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
}

function handleCategoryListInput(event) {
  const slider = event.target.closest('[data-tope-slider-id]');
  if (!slider) return;

  const categoryId = slider.dataset.topeSliderId;
  const valueLabel = document.querySelector(`[data-tope-value-id="${categoryId}"]`);
  if (valueLabel) {
    valueLabel.textContent = formatCurrency(slider.value);
  }
}

async function handleCategoryListChange(event) {
  const slider = event.target.closest('[data-tope-slider-id]');
  if (!slider) return;

  const categoryId = slider.dataset.topeSliderId;
  const newValue = Number(slider.value || 0);
  const existing = state.categories.find((category) => category.id === categoryId);
  if (!existing || existing.tope === newValue) {
    return;
  }

  const categories = state.categories.map((category) => (
    category.id === categoryId ? { ...category, tope: newValue } : category
  ));
  await getUserCategoriesDoc().set({ items: categories }, { merge: true });
  state.categories = categories;
  renderCategorySelect();
  showSavedIndicator(categoryId);
}

function showSavedIndicator(categoryId) {
  const indicator = document.querySelector(`[data-topes-saved-id="${categoryId}"]`);
  if (!indicator) return;
  // show with fade-in
  indicator.classList.add('show');
  // hide after 1.5s with fade-out
  setTimeout(() => {
    indicator.classList.remove('show');
  }, 1500);
}

function showAuthenticatedView(elements) {
  elements.authCard.classList.add('hidden');
  elements.app.classList.remove('hidden');
  elements.logoutBtn.classList.remove('hidden');
}

function showTab(tab) {
  const registerSection = document.getElementById('registerSection');
  const tarjetaSection = document.getElementById('tarjetaSection');
  const deudaSection = document.getElementById('deudaSection');
  const summarySection = document.getElementById('summarySection');
  const settingsSection = document.getElementById('settingsSection');
  const tabRegisterBtn = document.getElementById('tabRegisterBtn');
  const tabTarjetaBtn = document.getElementById('tabTarjetaBtn');
  const tabDeudaBtn = document.getElementById('tabDeudaBtn');
  const tabSummaryBtn = document.getElementById('tabSummaryBtn');
  const tabSettingsBtn = document.getElementById('tabSettingsBtn');

  [registerSection, tarjetaSection, deudaSection, summarySection, settingsSection].forEach((section) => section.classList.add('hidden'));
  [tabRegisterBtn, tabTarjetaBtn, tabDeudaBtn, tabSummaryBtn, tabSettingsBtn].forEach((btn) => btn.classList.remove('active'));

  if (tab === 'summary') {
    summarySection.classList.remove('hidden');
    tabSummaryBtn.classList.add('active');
  } else if (tab === 'tarjeta') {
    tarjetaSection.classList.remove('hidden');
    tabTarjetaBtn.classList.add('active');
  } else if (tab === 'deuda') {
    if (!state.generalConfig?.tieneDeuda) {
      showTab('register');
      return;
    }
    deudaSection.classList.remove('hidden');
    tabDeudaBtn.classList.add('active');
  } else if (tab === 'settings') {
    settingsSection.classList.remove('hidden');
    tabSettingsBtn.classList.add('active');
  } else {
    registerSection.classList.remove('hidden');
    tabRegisterBtn.classList.add('active');
  }
}

function updateDeudaTabVisibility() {
  const tabDeudaBtn = document.getElementById('tabDeudaBtn');
  const deudaSection = document.getElementById('deudaSection');
  if (!tabDeudaBtn || !deudaSection) return;

  const tieneDeuda = Boolean(state.generalConfig?.tieneDeuda);
  tabDeudaBtn.classList.toggle('hidden', !tieneDeuda);

  if (!tieneDeuda && !deudaSection.classList.contains('hidden')) {
    showTab('register');
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

function closeInlineEditor() {
  const existing = document.getElementById('inline-category-editor');
  if (existing) existing.remove();
  state.editingCategoryId = null;
}

function startInlineEditingCategory(categoryId) {
  // Close any other inline editor first
  closeInlineEditor();

  const category = state.categories.find((item) => item.id === categoryId);
  if (!category) return;

  state.editingCategoryId = categoryId;

  // find the category row to insert the editor after
  const triggerBtn = document.querySelector(`button[data-category-id="${categoryId}"]`);
  const row = triggerBtn ? triggerBtn.closest('.category-item') : null;
  if (!row) return;

  const container = document.createElement('div');
  container.id = 'inline-category-editor';
  container.className = 'card inline-editor';
  container.innerHTML = `
    <form id="inline-form-${categoryId}" class="inline-category-form">
      <div class="grid-2">
        <div class="field">
          <label>Nombre</label>
          <input type="text" name="name" value="${escapeHtml(category.nombre)}" />
        </div>
        <div class="field inline">
          <label class="checkbox-row"><input type="checkbox" name="hasTope" ${category.tieneTope ? 'checked' : ''} /> Tiene tope</label>
        </div>
      </div>
      <div class="field" id="inline-tope-group-${categoryId}" style="margin-top:0.6rem;">
        <label>Monto del tope</label>
        <input type="number" name="tope" value="${category.tope || 0}" min="0" step="0.01" />
      </div>
      <div style="display:flex;gap:0.6rem;margin-top:0.6rem;">
        <button type="submit" class="primary">Guardar</button>
        <button type="button" class="ghost" id="inline-cancel-btn">Cancelar</button>
      </div>
    </form>
  `;

  row.insertAdjacentElement('afterend', container);

  const form = container.querySelector('form');
  const nameInput = form.querySelector('input[name="name"]');
  const hasTopeInput = form.querySelector('input[name="hasTope"]');
  const topeInput = form.querySelector('input[name="tope"]');
  const topeGroup = document.getElementById(`inline-tope-group-${categoryId}`);

  function toggleInlineTope() {
    if (hasTopeInput.checked) {
      topeGroup.style.display = '';
    } else {
      topeGroup.style.display = 'none';
    }
  }

  toggleInlineTope();
  hasTopeInput.addEventListener('change', toggleInlineTope);

  // focus name input
  nameInput.focus();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const hasTope = Boolean(hasTopeInput.checked);
    const tope = Number(topeInput.value || 0);

    if (!name) return;

    const categories = [...state.categories];
    const index = categories.findIndex((c) => c.id === categoryId);
    if (index >= 0) {
      categories[index] = {
        ...categories[index],
        nombre: name,
        tieneTope: hasTope,
        tope: hasTope ? tope : 0,
        activa: categories[index].activa !== false
      };
    }

    await getUserCategoriesDoc().set({ items: categories }, { merge: true });
    state.categories = categories;
    closeInlineEditor();
    renderCategoriesList();
    renderCategorySelect();
    await loadMonthData();
  });

  container.querySelector('#inline-cancel-btn').addEventListener('click', () => {
    closeInlineEditor();
  });
}

// small helper to escape HTML in values
function escapeHtml(text) {
  if (typeof text !== 'string') return text;
  return text.replace(/[&<>"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
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

function getTopeSliderMax(category) {
  const sueldo = Number(state.config?.sueldo || 0);
  const currentTope = Number(category.tope || 0);
  const candidate = Math.max(sueldo, currentTope, 10000);
  return Math.ceil(candidate / 1000) * 1000;
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
        <div class="category-row">
          <div>
            <strong>${category.nombre}</strong>
            ${!category.tieneTope ? '<div class="movement-meta">Sin tope</div>' : ''}
          </div>
          <div class="category-actions">
            <button class="ghost" type="button" data-category-action="edit" data-category-id="${category.id}">Editar</button>
            <button class="delete-btn" type="button" data-category-action="delete" data-category-id="${category.id}">Borrar</button>
          </div>
        </div>
        ${category.tieneTope ? `
          <div class="tope-slider-row">
            <input
              type="range"
              class="tope-slider"
              data-tope-slider-id="${category.id}"
              min="0"
              max="${getTopeSliderMax(category)}"
              step="500"
              value="${category.tope || 0}"
            />
            <span class="tope-slider-value" data-tope-value-id="${category.id}">${formatCurrency(category.tope || 0)}</span>
            <span class="topes-saved" data-topes-saved-id="${category.id}">✓</span>
          </div>
        ` : ''}
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
  const tarjetaDateEl = document.getElementById('tarjetaDate');
  if (tarjetaDateEl) tarjetaDateEl.value = today;
  const deudaDateEl = document.getElementById('deudaDate');
  if (deudaDateEl) deudaDateEl.value = today;
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

function collectGeneralConfigValues() {
  const values = {};
  document.querySelectorAll('[data-general-config-field]').forEach((input) => {
    const key = input.dataset.generalConfigField;
    if (input.type === 'checkbox') {
      values[key] = input.checked;
      return;
    }
    values[key] = input.value === '' ? null : Number(input.value);
  });

  return {
    ...DEFAULT_GENERAL_CONFIG,
    ...values
  };
}

async function loadMonthData() {
  if (!state.user || !state.db) {
    return;
  }

  const historyMonths = getRecentMonths(6);
  const [
    configSnap,
    expensesSnap,
    incomesSnap,
    categoriesSnap,
    tarjetaSnap,
    tarjetaAllSnap,
    generalConfigSnap,
    acreedoresSnap,
    deudaSnap,
    deudaAllSnap
  ] = await Promise.all([
    getUserConfigDoc(state.currentMonth).get(),
    getUserCollection('gastos').where('mes', 'in', historyMonths).get(),
    getUserCollection('ingresos').where('mes', '==', state.currentMonth).get(),
    getUserCategoriesDoc().get(),
    getUserCollection('tarjeta').where('mes', '==', state.currentMonth).get(),
    getUserCollection('tarjeta').get(),
    getUserGeneralConfigDoc().get(),
    getUserAcreedoresDoc().get(),
    getUserCollection('deuda').where('mes', '==', state.currentMonth).get(),
    getUserCollection('deuda').get()
  ]);

  let configData = configSnap.exists ? configSnap.data() : null;
  if (!configData) {
    configData = await ensureConfigForMonth(state.currentMonth);
  }

  state.config = configData;

  if (generalConfigSnap.exists) {
    state.generalConfig = { ...DEFAULT_GENERAL_CONFIG, ...generalConfigSnap.data() };
  } else {
    state.generalConfig = { ...DEFAULT_GENERAL_CONFIG };
    await getUserGeneralConfigDoc().set(state.generalConfig, { merge: true });
  }

  state.categories = await ensureCategoriesConfig(configData, categoriesSnap);

  state.tarjeta = tarjetaSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((t) => t.mes === state.currentMonth)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  state.tarjetaAll = tarjetaAllSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  state.acreedores = await ensureAcreedoresConfig(acreedoresSnap);

  state.deuda = deudaSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((item) => item.mes === state.currentMonth)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  state.deudaAll = deudaAllSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  const allExpenses = expensesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  state.expenses = allExpenses
    .filter((expense) => expense.mes === state.currentMonth)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  state.incomes = incomesSnap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  renderConfigForm(configData);
  renderGeneralConfigForm(state.generalConfig);
  renderCategorySelect();
  renderCategoriesList();
  renderSummary(configData, state.expenses, state.incomes);
  renderHistory(allExpenses);
  renderTarjetaMovements(state.tarjeta);
  renderTarjetaSaldoPendiente();
  updateTarjetaPagoCompletoUI();
  renderAcreedoresList();
  renderAcreedoresSaldos();
  renderDeudaAcreedorSelect();
  toggleDeudaDescription(document.getElementById('deudaTipo')?.value);
  renderDeudaMovements(state.deuda);
  updateDeudaTabVisibility();
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

async function ensureAcreedoresConfig(acreedoresSnap) {
  const acreedoresRef = getUserAcreedoresDoc();
  if (acreedoresSnap && acreedoresSnap.exists && Array.isArray(acreedoresSnap.data().items)) {
    return normalizeAcreedores(acreedoresSnap.data().items);
  }

  await acreedoresRef.set({ items: [] }, { merge: true });
  return [];
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

function renderGeneralConfigForm(generalConfig) {
  document.querySelectorAll('[data-general-config-field]').forEach((input) => {
    const key = input.dataset.generalConfigField;
    if (input.type === 'checkbox') {
      input.checked = Boolean(generalConfig[key]);
      return;
    }
    const value = generalConfig[key];
    input.value = value === null || value === undefined ? '' : value;
  });
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
  const tieneDeuda = Boolean(state.generalConfig?.tieneDeuda);
  const deudaTotal = tieneDeuda
    ? (state.deuda || [])
        .filter((item) => getDeudaTipo(item) === 'pago')
        .reduce((sum, item) => sum + Number(item.monto || 0), 0)
    : 0;
  const tarjetaTotal = (state.tarjeta || [])
    .filter((t) => getTarjetaTipo(t) === 'pago')
    .reduce((sum, t) => sum + Number(t.monto || 0), 0);
  const ingresoExtraTotal = incomes.reduce((sum, income) => sum + Number(income.monto || 0), 0);
  const ahorroAmount = config.ahorroModo === 'fijo'
    ? Number(config.ahorroMontoFijo || 0)
    : (sueldo * Number(config.ahorroPct || 0)) / 100;
  const fixedAndSavingsTotal = fijos + tarjetaTotal + deudaTotal + ahorroAmount;
  const variableTotal = expenses
    .filter((expense) => isActiveVariableCategory(expense.categoria))
    .reduce((sum, expense) => sum + Number(expense.monto || 0), 0);
  const remainingMargin = sueldo + ingresoExtraTotal - fixedAndSavingsTotal - variableTotal;
  const fixedLabel = tieneDeuda ? 'Fijos + tarjeta + deuda + ahorro' : 'Fijos + tarjeta + ahorro';

  const cards = [
    { label: 'Sueldo', value: formatCurrency(sueldo) },
    { label: 'Ingreso extra del mes', value: formatCurrency(ingresoExtraTotal) },
    { label: fixedLabel, value: formatCurrency(fixedAndSavingsTotal), subText: getAhorroSummaryText(config, ahorroAmount) },
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

function getTarjetaTipo(item) {
  return item && item.tipo === 'pago' ? 'pago' : 'cargo';
}

function calcularSaldoPendienteTarjeta() {
  const saldoInicial = Number(state.generalConfig?.saldoInicialTarjeta || 0);
  const totales = (state.tarjetaAll || []).reduce((acc, item) => {
    const monto = Number(item.monto || 0);
    if (getTarjetaTipo(item) === 'pago') {
      acc.pagos += monto;
    } else {
      acc.cargos += monto;
    }
    return acc;
  }, { cargos: 0, pagos: 0 });

  return saldoInicial + totales.cargos - totales.pagos;
}

function renderTarjetaSaldoPendiente() {
  const el = document.getElementById('tarjetaSaldoPendiente');
  if (!el) return;
  const saldoPendiente = calcularSaldoPendienteTarjeta();
  el.classList.toggle('negative', saldoPendiente > 0);
  el.innerHTML = `
    <div class="summary-label">Saldo pendiente de tarjeta</div>
    <div class="summary-value">${formatCurrency(saldoPendiente)}</div>
  `;
}

function updateTarjetaPagoCompletoUI() {
  const group = document.getElementById('tarjetaPagoCompletoGroup');
  const checkbox = document.getElementById('tarjetaPagoCompletoInput');
  const tipoInput = document.getElementById('tarjetaTipo');
  if (!group || !checkbox || !tipoInput) return;

  const tipo = tipoInput.value === 'pago' ? 'pago' : 'cargo';
  const disponible = calcularSaldoPendienteTarjeta() > 0;

  group.classList.toggle('hidden', tipo !== 'pago');
  checkbox.disabled = !disponible;
  if (!disponible && checkbox.checked) {
    checkbox.checked = false;
  }
}

function handleTarjetaPagoCompletoChange(event) {
  const checkbox = event.target;
  if (!checkbox.checked) return;

  const saldoPendiente = calcularSaldoPendienteTarjeta();
  if (saldoPendiente <= 0) {
    checkbox.checked = false;
    return;
  }

  const amountInput = document.getElementById('tarjetaAmount');
  if (amountInput) {
    amountInput.value = saldoPendiente;
  }
}

function renderTarjetaMovements(tarjeta) {
  const list = document.getElementById('tarjetaList');
  if (!tarjeta || !tarjeta.length) {
    list.innerHTML = '<p class="message">Todavía no hay movimientos de tarjeta en este mes.</p>';
    return;
  }

  list.innerHTML = tarjeta
    .map((item) => {
      const tipo = getTarjetaTipo(item);
      const tipoLabel = tipo === 'pago' ? 'Pago' : 'Cargo';
      return `
      <div class="movement-item">
        <div>
          <strong>${item.descripcion}</strong>
          <div class="movement-meta">
            <span class="tarjeta-tipo tarjeta-tipo-${tipo}">${tipoLabel}</span>
            ${formatDate(item.fecha)}
          </div>
        </div>
        <div class="movement-meta">
          <div>${formatCurrency(item.monto)}</div>
          <button class="delete-btn" type="button" data-tarjeta-delete-id="${item.id}">Borrar</button>
        </div>
      </div>
    `;
    })
    .join('');
}

function toggleTarjetaDescription(tipo) {
  const group = document.getElementById('tarjetaDescriptionGroup');
  const input = document.getElementById('tarjetaDescription');
  if (!group || !input) return;

  const isPago = tipo === 'pago';
  group.classList.toggle('hidden', isPago);
  input.required = !isPago;
  if (isPago) {
    input.value = 'Pago de tarjeta';
  }
}

async function handleTarjetaSubmit(event) {
  event.preventDefault();
  const tipoInput = document.getElementById('tarjetaTipo');
  const tipo = tipoInput && tipoInput.value === 'pago' ? 'pago' : 'cargo';
  const descriptionInput = document.getElementById('tarjetaDescription');
  const descripcion = tipo === 'pago'
    ? 'Pago de tarjeta'
    : descriptionInput.value.trim();

  if (tipo === 'pago') {
    descriptionInput.required = false;
    descriptionInput.value = descripcion;
  }

  const payload = {
    fecha: document.getElementById('tarjetaDate').value,
    tipo,
    descripcion,
    monto: Number(document.getElementById('tarjetaAmount').value),
    mes: state.currentMonth
  };

  if (!payload.fecha || !payload.descripcion || !payload.monto) {
    return;
  }

  await getUserCollection('tarjeta').add(payload);
  event.target.reset();
  setDefaultDate();
  toggleTarjetaDescription(tipoInput ? tipoInput.value : 'cargo');
  updateTarjetaPagoCompletoUI();
  await loadMonthData();
}

async function handleTarjetaListClick(event) {
  const button = event.target.closest('[data-tarjeta-delete-id]');
  if (!button) return;
  const id = button.dataset.tarjetaDeleteId;
  await getUserCollection('tarjeta').doc(id).delete();
  await loadMonthData();
}

function getAcreedorDisplayName(acreedorId) {
  const acreedor = state.acreedores.find((item) => item.id === acreedorId);
  return acreedor ? acreedor.nombre : 'Acreedor eliminado';
}

function calcularSaldoPendientePorAcreedor() {
  const totalesPorAcreedor = {};
  (state.deudaAll || []).forEach((item) => {
    const acreedorId = item.acreedorId;
    if (!acreedorId) return;
    if (!totalesPorAcreedor[acreedorId]) {
      totalesPorAcreedor[acreedorId] = { cargos: 0, pagos: 0 };
    }
    const monto = Number(item.monto || 0);
    if (getDeudaTipo(item) === 'pago') {
      totalesPorAcreedor[acreedorId].pagos += monto;
    } else {
      totalesPorAcreedor[acreedorId].cargos += monto;
    }
  });

  return state.acreedores
    .filter((acreedor) => acreedor.activa !== false)
    .map((acreedor) => {
      const totales = totalesPorAcreedor[acreedor.id] || { cargos: 0, pagos: 0 };
      const saldoInicial = Number(acreedor.saldoInicial || 0);
      const saldoPendiente = saldoInicial + totales.cargos - totales.pagos;
      return { ...acreedor, saldoPendiente };
    });
}

function renderAcreedoresSaldos() {
  const container = document.getElementById('acreedoresSaldos');
  if (!container) return;

  const acreedoresActivos = state.acreedores.filter((acreedor) => acreedor.activa !== false);
  if (!acreedoresActivos.length) {
    container.innerHTML = '<p class="message">Todavía no cargaste ningún acreedor. Agregá el primero más abajo para empezar a llevar el saldo.</p>';
    return;
  }

  const saldos = calcularSaldoPendientePorAcreedor();
  container.innerHTML = saldos
    .map((acreedor) => `
      <div class="summary-card${acreedor.saldoPendiente > 0 ? ' negative' : ''}">
        <div class="summary-label">${acreedor.nombre}</div>
        <div class="summary-value">${formatCurrency(acreedor.saldoPendiente)}</div>
      </div>
    `)
    .join('');
}

function renderAcreedoresList() {
  const list = document.getElementById('acreedoresList');
  if (!list) return;
  const acreedores = state.acreedores.filter((acreedor) => acreedor.activa !== false);

  if (!acreedores.length) {
    list.innerHTML = '<p class="message">Todavía no hay acreedores cargados.</p>';
    return;
  }

  list.innerHTML = acreedores
    .map((acreedor) => `
      <div class="category-item">
        <div class="category-row">
          <div>
            <strong>${acreedor.nombre}</strong>
            <div class="movement-meta">Saldo inicial: ${formatCurrency(acreedor.saldoInicial || 0)}</div>
          </div>
          <div class="category-actions">
            <button class="ghost" type="button" data-acreedor-action="edit" data-acreedor-id="${acreedor.id}">Editar</button>
            <button class="delete-btn" type="button" data-acreedor-action="delete" data-acreedor-id="${acreedor.id}">Borrar</button>
          </div>
        </div>
      </div>
    `)
    .join('');
}

async function handleAcreedorSubmit(event) {
  event.preventDefault();
  const name = document.getElementById('acreedorNombreInput').value.trim();
  const saldoInicial = Number(document.getElementById('acreedorSaldoInicialInput').value || 0);

  if (!name) {
    return;
  }

  const acreedores = [
    ...state.acreedores,
    {
      id: buildAcreedorId(name, state.acreedores),
      nombre: name,
      saldoInicial,
      activa: true
    }
  ];

  await getUserAcreedoresDoc().set({ items: acreedores }, { merge: true });
  event.target.reset();
  await loadMonthData();
}

async function handleAcreedorListClick(event) {
  const button = event.target.closest('[data-acreedor-action]');
  if (!button) return;

  const id = button.dataset.acreedorId;
  const action = button.dataset.acreedorAction;

  if (action === 'edit') {
    startInlineEditingAcreedor(id);
    return;
  }

  if (action === 'delete') {
    const acreedores = state.acreedores.map((acreedor) => (
      acreedor.id === id ? { ...acreedor, activa: false } : acreedor
    ));
    await getUserAcreedoresDoc().set({ items: acreedores }, { merge: true });
    await loadMonthData();
  }
}

function closeAcreedorInlineEditor() {
  const existing = document.getElementById('inline-acreedor-editor');
  if (existing) existing.remove();
  state.editingAcreedorId = null;
}

function startInlineEditingAcreedor(acreedorId) {
  closeAcreedorInlineEditor();

  const acreedor = state.acreedores.find((item) => item.id === acreedorId);
  if (!acreedor) return;

  state.editingAcreedorId = acreedorId;

  const triggerBtn = document.querySelector(`button[data-acreedor-id="${acreedorId}"]`);
  const row = triggerBtn ? triggerBtn.closest('.category-item') : null;
  if (!row) return;

  const container = document.createElement('div');
  container.id = 'inline-acreedor-editor';
  container.className = 'card inline-editor';
  container.innerHTML = `
    <form id="inline-acreedor-form-${acreedorId}" class="inline-category-form">
      <div class="grid-2">
        <div class="field">
          <label>Nombre</label>
          <input type="text" name="name" value="${escapeHtml(acreedor.nombre)}" />
        </div>
        <div class="field">
          <label>Saldo inicial</label>
          <input type="number" name="saldoInicial" value="${acreedor.saldoInicial || 0}" step="0.01" />
        </div>
      </div>
      <div style="display:flex;gap:0.6rem;margin-top:0.6rem;">
        <button type="submit" class="primary">Guardar</button>
        <button type="button" class="ghost" id="inline-acreedor-cancel-btn">Cancelar</button>
      </div>
    </form>
  `;

  row.insertAdjacentElement('afterend', container);

  const form = container.querySelector('form');
  const nameInput = form.querySelector('input[name="name"]');
  const saldoInput = form.querySelector('input[name="saldoInicial"]');
  nameInput.focus();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const saldoInicial = Number(saldoInput.value || 0);

    if (!name) return;

    const acreedores = [...state.acreedores];
    const index = acreedores.findIndex((item) => item.id === acreedorId);
    if (index >= 0) {
      acreedores[index] = {
        ...acreedores[index],
        nombre: name,
        saldoInicial,
        activa: acreedores[index].activa !== false
      };
    }

    await getUserAcreedoresDoc().set({ items: acreedores }, { merge: true });
    closeAcreedorInlineEditor();
    await loadMonthData();
  });

  container.querySelector('#inline-acreedor-cancel-btn').addEventListener('click', () => {
    closeAcreedorInlineEditor();
  });
}

function renderDeudaAcreedorSelect() {
  const select = document.getElementById('deudaAcreedor');
  if (!select) return;

  const previousValue = select.value;
  const activeAcreedores = state.acreedores.filter((acreedor) => acreedor.activa !== false);
  select.innerHTML = activeAcreedores
    .map((acreedor) => `<option value="${acreedor.id}">${acreedor.nombre}</option>`)
    .join('');

  if (activeAcreedores.some((acreedor) => acreedor.id === previousValue)) {
    select.value = previousValue;
  } else if (activeAcreedores.length) {
    select.value = activeAcreedores[0].id;
  }
}

function getDeudaTipo(item) {
  return item && item.tipo === 'cargo' ? 'cargo' : 'pago';
}

function renderDeudaMovements(deuda) {
  const list = document.getElementById('deudaList');
  if (!list) return;

  if (!deuda || !deuda.length) {
    list.innerHTML = '<p class="message">Todavía no hay movimientos de deuda en este mes.</p>';
    return;
  }

  list.innerHTML = deuda
    .map((item) => {
      const tipo = getDeudaTipo(item);
      const tipoLabel = tipo === 'pago' ? 'Pago' : 'Cargo';
      return `
      <div class="movement-item">
        <div>
          <strong>${item.descripcion}</strong>
          <div class="movement-meta">
            <span class="tarjeta-tipo tarjeta-tipo-${tipo}">${tipoLabel}</span>
            ${formatDate(item.fecha)} · ${getAcreedorDisplayName(item.acreedorId)}
          </div>
        </div>
        <div class="movement-meta">
          <div>${formatCurrency(item.monto)}</div>
          <button class="delete-btn" type="button" data-deuda-delete-id="${item.id}">Borrar</button>
        </div>
      </div>
    `;
    })
    .join('');
}

function toggleDeudaDescription(tipo) {
  const group = document.getElementById('deudaDescriptionGroup');
  const input = document.getElementById('deudaDescription');
  if (!group || !input) return;

  const isPago = tipo === 'pago';
  group.classList.toggle('hidden', isPago);
  input.required = !isPago;
  if (isPago) {
    const acreedorId = document.getElementById('deudaAcreedor')?.value;
    input.value = `Pago a ${getAcreedorDisplayName(acreedorId)}`;
  }
}

async function handleDeudaSubmit(event) {
  event.preventDefault();
  const acreedorId = document.getElementById('deudaAcreedor').value;
  const tipoInput = document.getElementById('deudaTipo');
  const tipo = tipoInput && tipoInput.value === 'cargo' ? 'cargo' : 'pago';
  const descriptionInput = document.getElementById('deudaDescription');
  const descripcion = tipo === 'pago'
    ? `Pago a ${getAcreedorDisplayName(acreedorId)}`
    : descriptionInput.value.trim();

  if (tipo === 'pago') {
    descriptionInput.required = false;
    descriptionInput.value = descripcion;
  }

  const payload = {
    fecha: document.getElementById('deudaDate').value,
    acreedorId,
    tipo,
    descripcion,
    monto: Number(document.getElementById('deudaAmount').value),
    mes: state.currentMonth
  };

  if (!payload.fecha || !payload.acreedorId || !payload.descripcion || !payload.monto) {
    return;
  }

  await getUserCollection('deuda').add(payload);
  event.target.reset();
  setDefaultDate();
  toggleDeudaDescription(tipoInput ? tipoInput.value : 'pago');
  await loadMonthData();
}

async function handleDeudaListClick(event) {
  const button = event.target.closest('[data-deuda-delete-id]');
  if (!button) return;
  const id = button.dataset.deudaDeleteId;
  await getUserCollection('deuda').doc(id).delete();
  await loadMonthData();
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

function normalizeAcreedores(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  const seenIds = new Set();
  return items.map((item, index) => {
    const rawName = String(item?.nombre || '').trim();
    const nombre = rawName || `Acreedor ${index + 1}`;
    const rawId = String(item?.id || nombre).trim();
    const baseId = normalizeCategoryValue(rawId) || `acreedor${index + 1}`;

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
      saldoInicial: Number(item?.saldoInicial || 0),
      activa: item?.activa !== false
    };
  });
}

function buildAcreedorId(name, acreedores) {
  const base = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 20);

  const baseId = base || 'acreedor';
  const existingIds = acreedores.map((acreedor) => acreedor.id);
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
