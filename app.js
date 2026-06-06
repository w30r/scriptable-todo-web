const API_BASE = 'https://scriptable-todo.onrender.com/api/todos';
const SHOP_API = 'https://scriptable-todo.onrender.com/api/shopping';

const QUADRANTS = [
  { key: 'q1', tag: '!ui',   title: 'Do First',    sub: 'Urgent & Important' },
  { key: 'q2', tag: '!nui',  title: 'Schedule',    sub: 'Not Urgent & Important' },
  { key: 'q3', tag: '!uni',  title: 'Delegate',    sub: 'Urgent & Not Important' },
  { key: 'q4', tag: '',      title: 'Eliminate',   sub: 'Not Urgent & Not Important' },
];

const CATEGORIES = [
  { key: 'grocery', label: 'Grocery', color: '#30d158' },
  { key: 'watsons', label: 'Watsons', color: '#0a84ff' },
  { key: 'mrdiy',   label: 'MRDIY',   color: '#ff9f0a' },
  { key: 'online',  label: 'Online',  color: '#bf5af2' },
  { key: 'etc',     label: 'Etc',     color: '#636366' },
];

let todos = [];
let shoppingItems = [];
let currentFilter = localStorage.getItem('meor-filter') || 'all';
let activeTab = localStorage.getItem('meor-tab') || 'todo';
let shoppingFilter = localStorage.getItem('meor-shop-filter') || 'all';

const matrix = document.getElementById('matrix');
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const quadrantSelect = document.getElementById('quadrant-select');
const addBtn = document.getElementById('add-btn');
const todoCount = document.getElementById('todo-count');
const clearCompletedBtn = document.getElementById('clear-completed');
const filterBtns = document.querySelectorAll('.filter-btn');

const shopForm = document.getElementById('shop-form');
const shopInput = document.getElementById('shop-input');
const shopCategory = document.getElementById('shop-category');
const shopAddBtn = document.getElementById('shop-add-btn');
const shopList = document.getElementById('shopping-list');
const shopCount = document.getElementById('shop-count');
const shopBoughtCount = document.getElementById('shop-bought-count');
const clearBoughtBtn = document.getElementById('clear-bought');
const shopFilterBtns = document.querySelectorAll('.shop-filter-btn');
const tabBtns = document.querySelectorAll('.tab');
const todoSection = document.getElementById('todo-section');
const shoppingSection = document.getElementById('shopping-section');

function getQuadrantKey(title) {
  if (title.includes('!ui')) return 'q1';
  if (title.includes('!nui')) return 'q2';
  if (title.includes('!uni')) return 'q3';
  return 'q4';
}

function getCurrentTag(title) {
  if (title.includes('!ui')) return '!ui';
  if (title.includes('!nui')) return '!nui';
  if (title.includes('!uni')) return '!uni';
  return '';
}

function stripTag(title) {
  return title.replace(/\s*!(?:ui|nui|uni)\s*/g, '').trim();
}

function formatDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' });
}

async function fetchWithTimeout(url, options, timeout = 3000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(id);
  }
}

async function apiFetch(method, body) {
  return fetchWithTimeout(API_BASE, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

async function apiFetchId(id, method, body) {
  return fetchWithTimeout(`${API_BASE}/${id}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

async function shopFetch(method, body) {
  return fetchWithTimeout(SHOP_API, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

async function shopFetchId(id, method, body) {
  return fetchWithTimeout(`${SHOP_API}/${id}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

function render() {
  if (todos.length === 0) {
    matrix.innerHTML = '<div class="loading">No todos yet. Add one above!</div>';
    todoCount.textContent = '0 items left';
    return;
  }

  const filtered = todos.filter(t => {
    if (currentFilter === 'active') return !t.completed;
    if (currentFilter === 'completed') return t.completed;
    return true;
  });

  const grouped = { q1: [], q2: [], q3: [], q4: [] };
  for (const t of filtered) {
    const q = getQuadrantKey(t.title);
    grouped[q].push(t);
  }

  matrix.innerHTML = QUADRANTS.map(q => `
    <div class="quadrant ${q.key}">
      <div class="quadrant-header">
        <div class="quadrant-title">
          <span class="label">${q.title}</span>
          <span class="sublabel">${q.sub}</span>
        </div>
        <span class="badge">${grouped[q.key].length}</span>
      </div>
      <div class="quadrant-list">
        ${grouped[q.key].length === 0
          ? `<div class="quadrant-empty">No tasks</div>`
          : grouped[q.key].map(t => {
              const tag = getCurrentTag(t.title);
              const opts = ['!ui', '!nui', '!uni', ''];
              return `
            <div class="todo-item ${t.completed ? 'completed' : ''}" data-id="${t._id}">
              <input type="checkbox" class="todo-checkbox" ${t.completed ? 'checked' : ''}>
              <div class="todo-body">
                <div class="todo-row">
                  <span class="todo-title">${escapeHtml(stripTag(t.title))}</span>
                  <select class="todo-tag-select">
                    ${opts.map(o => `<option value="${o}"${tag === o ? ' selected' : ''}>${o || '·'}</option>`).join('')}
                  </select>
                </div>
                <div class="todo-meta">
                  <span class="todo-date">${formatDate(t.createdAt)}${t.updatedAt !== t.createdAt ? ' · edited ' + formatDate(t.updatedAt) : ''}</span>
                </div>
              </div>
              <button class="todo-delete" title="Delete">✕</button>
            </div>`;
          }).join('')
        }
      </div>
    </div>
  `).join('');

  const activeCount = todos.filter(t => !t.completed).length;
  todoCount.textContent = `${activeCount} item${activeCount !== 1 ? 's' : ''} left`;

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const doneToday = todos.filter(t => t.completed && new Date(t.updatedAt) >= todayStart).length;
  const todayEl = document.getElementById('today-count');
  todayEl.textContent = doneToday ? `${doneToday} done today` : '';
}

function renderShopping() {
  const filtered = shoppingItems.filter(item => {
    if (shoppingFilter !== 'all') return item.category === shoppingFilter;
    return true;
  });

  const grouped = {};
  for (const cat of CATEGORIES) {
    grouped[cat.key] = [];
  }
  for (const item of filtered) {
    if (grouped[item.category]) {
      grouped[item.category].push(item);
    }
  }

  const hasItems = Object.values(grouped).some(arr => arr.length > 0);

  if (shoppingItems.length === 0) {
    shopList.innerHTML = '<div class="loading">Nothing to buy yet. Add something above!</div>';
    shopCount.textContent = '0 items';
    shopBoughtCount.textContent = '';
    return;
  }

  if (!hasItems) {
    shopList.innerHTML = '<div class="loading">No items in this category.</div>';
    shopCount.textContent = `${shoppingItems.length} item${shoppingItems.length !== 1 ? 's' : ''}`;
    const boughtCount = shoppingItems.filter(i => i.completed).length;
    shopBoughtCount.textContent = boughtCount ? `${boughtCount} bought` : '';
    return;
  }

  shopList.innerHTML = CATEGORIES.map(cat => {
    const items = grouped[cat.key];
    if (items.length === 0) return '';
    return `
      <div class="shop-category" data-category="${cat.key}">
        <div class="shop-category-header" style="--cat-color: ${cat.color}">
          <span class="shop-cat-label">${cat.label}</span>
          <span class="badge">${items.length}</span>
        </div>
        <div class="shop-category-list">
          ${items.map(item => `
            <div class="shop-item ${item.completed ? 'completed' : ''}" data-id="${item._id}">
              <input type="checkbox" class="shop-checkbox" ${item.completed ? 'checked' : ''}>
              <div class="shop-body">
                <span class="shop-name">${escapeHtml(item.name)}</span>
                <span class="shop-cat-badge" style="--cat-color: ${cat.color}">${cat.label}</span>
              </div>
              <button class="shop-delete" title="Delete">✕</button>
            </div>
          `).join('')}
        </div>
      </div>`;
  }).join('');

  const total = shoppingItems.length;
  const bought = shoppingItems.filter(i => i.completed).length;
  shopCount.textContent = `${total} item${total !== 1 ? 's' : ''}`;
  shopBoughtCount.textContent = bought ? `${bought} bought` : '';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function loadTodos() {
  matrix.innerHTML = '<div class="loading">Loading todos...</div>';
  for (;;) {
    try {
      todos = await apiFetch('GET');
      applyFilterUI();
      render();
      loadShopping();
      return;
    } catch {
      matrix.innerHTML = '<div class="loading">Render is probably spinning this up, retrying in 5s...</div>';
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

async function loadShopping() {
  try {
    shoppingItems = await shopFetch('GET');
    applyShopFilterUI();
    renderShopping();
  } catch {
    shopList.innerHTML = '<div class="loading">Failed to load shopping items.</div>';
  }
}

async function addTodo(titleRaw) {
  const tag = quadrantSelect.value;
  const title = tag ? `${titleRaw} ${tag}` : titleRaw;
  addBtn.disabled = true;
  addBtn.textContent = 'Adding...';
  try {
    const newTodo = await apiFetch('POST', { title });
    todos.push(newTodo);
    todoInput.value = '';
    render();
  } catch (err) {
    alert('Failed to add todo: ' + err.message);
  } finally {
    addBtn.disabled = false;
    addBtn.textContent = 'Add';
    todoInput.focus();
  }
}

async function renameTodo(id, newTitle) {
  try {
    const updated = await apiFetchId(id, 'PUT', { title: newTitle });
    const idx = todos.findIndex(t => t._id === id);
    if (idx !== -1) todos[idx] = updated;
    render();
  } catch (err) {
    alert('Failed to rename todo: ' + err.message);
  }
}

async function toggleTodo(id, completed) {
  try {
    const updated = await apiFetchId(id, 'PUT', { completed });
    const idx = todos.findIndex(t => t._id === id);
    if (idx !== -1) todos[idx] = updated;
    render();
  } catch (err) {
    alert('Failed to update todo: ' + err.message);
  }
}

async function deleteTodo(id) {
  try {
    await apiFetchId(id, 'DELETE');
    todos = todos.filter(t => t._id !== id);
    render();
  } catch (err) {
    alert('Failed to delete todo: ' + err.message);
  }
}

async function clearCompleted() {
  const completed = todos.filter(t => t.completed);
  if (completed.length === 0) return;
  try {
    await Promise.all(completed.map(t => apiFetchId(t._id, 'DELETE')));
    todos = todos.filter(t => !t.completed);
    render();
  } catch (err) {
    alert('Failed to clear completed: ' + err.message);
  }
}

async function addShoppingItem(name, category) {
  shopAddBtn.disabled = true;
  shopAddBtn.textContent = 'Adding...';
  try {
    const item = await shopFetch('POST', { name, category });
    shoppingItems.unshift(item);
    shopInput.value = '';
    applyShopFilterUI();
    renderShopping();
  } catch (err) {
    alert('Failed to add shopping item: ' + err.message);
  } finally {
    shopAddBtn.disabled = false;
    shopAddBtn.textContent = 'Add';
    shopInput.focus();
  }
}

async function renameShoppingItem(id, newName, category) {
  try {
    const updated = await shopFetchId(id, 'PUT', { name: newName, category });
    const idx = shoppingItems.findIndex(i => i._id === id);
    if (idx !== -1) shoppingItems[idx] = updated;
    renderShopping();
  } catch (err) {
    alert('Failed to rename item: ' + err.message);
  }
}

async function toggleShoppingItem(id, completed) {
  try {
    const updated = await shopFetchId(id, 'PUT', { completed });
    const idx = shoppingItems.findIndex(i => i._id === id);
    if (idx !== -1) shoppingItems[idx] = updated;
    renderShopping();
  } catch (err) {
    alert('Failed to update shopping item: ' + err.message);
  }
}

async function deleteShoppingItem(id) {
  try {
    await shopFetchId(id, 'DELETE');
    shoppingItems = shoppingItems.filter(i => i._id !== id);
    renderShopping();
  } catch (err) {
    alert('Failed to delete shopping item: ' + err.message);
  }
}

async function clearBought() {
  const bought = shoppingItems.filter(i => i.completed);
  if (bought.length === 0) return;
  try {
    await fetchWithTimeout(`${SHOP_API}/completed`, { method: 'DELETE' });
    shoppingItems = shoppingItems.filter(i => !i.completed);
    renderShopping();
  } catch {
    try {
      await Promise.all(bought.map(i => shopFetchId(i._id, 'DELETE')));
      shoppingItems = shoppingItems.filter(i => !i.completed);
      renderShopping();
    } catch (err) {
      alert('Failed to clear bought items: ' + err.message);
    }
  }
}

function applyFilterUI() {
  filterBtns.forEach(b => {
    b.classList.toggle('active', b.dataset.filter === currentFilter);
  });
}

function setFilter(filter) {
  currentFilter = filter;
  localStorage.setItem('meor-filter', filter);
  applyFilterUI();
  render();
}

function applyShopFilterUI() {
  shopFilterBtns.forEach(b => {
    b.classList.toggle('active', b.dataset.cat === shoppingFilter);
  });
}

function setShopFilter(cat) {
  shoppingFilter = cat;
  localStorage.setItem('meor-shop-filter', cat);
  applyShopFilterUI();
  renderShopping();
}

function switchTab(tab) {
  activeTab = tab;
  localStorage.setItem('meor-tab', tab);
  todoSection.style.display = tab === 'todo' ? '' : 'none';
  shoppingSection.style.display = tab === 'shopping' ? '' : 'none';
  tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  if (tab === 'shopping') shopInput.focus();
  else todoInput.focus();
}

/* ── Inline edit (todo) ── */

function startEdit(item) {
  const titleEl = item.querySelector('.todo-title');
  const raw = titleEl.textContent;
  const id = item.dataset.id;
  const todo = todos.find(t => t._id === id);
  if (!todo) return;
  const tag = getCurrentTag(todo.title);

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'todo-edit-input';
  input.value = raw;
  item.querySelector('.todo-body').prepend(input);
  titleEl.style.display = 'none';
  item.querySelector('.todo-tag-select').style.display = 'none';
  item.classList.add('editing');
  input.focus();
  input.select();

  function save() {
    const val = input.value.trim();
    if (val && val !== raw) {
      const newTitle = tag ? `${val} ${tag}` : val;
      renameTodo(id, newTitle);
    }
    cleanup();
  }

  function cleanup() {
    input.remove();
    titleEl.style.display = '';
    const tagEl = item.querySelector('.todo-tag-select');
    if (tagEl) tagEl.style.display = '';
    item.classList.remove('editing');
  }

  input.addEventListener('blur', save);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
    if (e.key === 'Escape') { cleanup(); }
  });
}

/* ── Inline edit (shopping) ── */

function startShopEdit(item) {
  const nameEl = item.querySelector('.shop-name');
  const raw = nameEl.textContent;
  const id = item.dataset.id;
  const shopItem = shoppingItems.find(i => i._id === id);
  if (!shopItem) return;
  const cat = shopItem.category;

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'shop-edit-input';
  input.value = raw;
  item.querySelector('.shop-body').prepend(input);
  nameEl.style.display = 'none';
  item.querySelector('.shop-cat-badge').style.display = 'none';
  item.classList.add('editing');
  input.focus();
  input.select();

  function save() {
    const val = input.value.trim();
    if (val && val !== raw) {
      renameShoppingItem(id, val, cat);
    }
    cleanup();
  }

  function cleanup() {
    input.remove();
    nameEl.style.display = '';
    const badge = item.querySelector('.shop-cat-badge');
    if (badge) badge.style.display = '';
    item.classList.remove('editing');
  }

  input.addEventListener('blur', save);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
    if (e.key === 'Escape') { cleanup(); }
  });
}

/* ── Change tag via dropdown ── */

async function changeTag(item, newTag) {
  const id = item.dataset.id;
  const todo = todos.find(t => t._id === id);
  if (!todo) return;
  const current = getCurrentTag(todo.title);
  if (current === newTag) return;
  const clean = stripTag(todo.title);
  const newTitle = newTag ? `${clean} ${newTag}` : clean;
  try {
    const updated = await apiFetchId(id, 'PUT', { title: newTitle });
    const idx = todos.findIndex(t => t._id === id);
    if (idx !== -1) todos[idx] = updated;
    render();
  } catch (err) {
    alert('Failed to update quadrant: ' + err.message);
  }
}

/* ── Event listeners ── */

todoForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = todoInput.value.trim();
  if (title) addTodo(title);
});

shopForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = shopInput.value.trim();
  const cat = shopCategory.value;
  if (name && cat) addShoppingItem(name, cat);
});

matrix.addEventListener('click', (e) => {
  const item = e.target.closest('.todo-item');
  if (!item) return;
  if (e.target.classList.contains('todo-delete')) {
    deleteTodo(item.dataset.id);
  }
});

shopList.addEventListener('click', (e) => {
  if (e.target.classList.contains('shop-delete')) {
    const item = e.target.closest('.shop-item');
    if (item) deleteShoppingItem(item.dataset.id);
  }
});

matrix.addEventListener('dblclick', (e) => {
  const item = e.target.closest('.todo-item');
  if (!item || item.classList.contains('editing')) return;
  if (e.target.classList.contains('todo-title')) {
    startEdit(item);
  }
});

shopList.addEventListener('dblclick', (e) => {
  const item = e.target.closest('.shop-item');
  if (!item || item.classList.contains('editing')) return;
  if (e.target.classList.contains('shop-name')) {
    startShopEdit(item);
  }
});

matrix.addEventListener('change', (e) => {
  if (e.target.classList.contains('todo-checkbox')) {
    const item = e.target.closest('.todo-item');
    if (item) toggleTodo(item.dataset.id, e.target.checked);
  }
  if (e.target.classList.contains('todo-tag-select')) {
    const item = e.target.closest('.todo-item');
    if (item) changeTag(item, e.target.value);
  }
});

shopList.addEventListener('change', (e) => {
  if (e.target.classList.contains('shop-checkbox')) {
    const item = e.target.closest('.shop-item');
    if (item) toggleShoppingItem(item.dataset.id, e.target.checked);
  }
});

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    setFilter(btn.dataset.filter);
  });
});

shopFilterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    setShopFilter(btn.dataset.cat);
  });
});

clearCompletedBtn.addEventListener('click', clearCompleted);
clearBoughtBtn.addEventListener('click', clearBought);

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    switchTab(btn.dataset.tab);
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'n' || e.key === '/') {
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'SELECT') {
      e.preventDefault();
      if (activeTab === 'shopping') shopInput.focus();
      else todoInput.focus();
    }
  }
});

/* ── Init ── */

switchTab(activeTab);
loadTodos();
