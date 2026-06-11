const API_BASE = 'https://scriptable-todo.onrender.com/api/todos';
const SHOP_API = 'https://scriptable-todo.onrender.com/api/shopping';
const PROGRESS_API = 'https://scriptable-todo.onrender.com/api/progress';

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

/* ── Sound Manager (Web Audio API) ── */

const SoundManager = {
  _ctx: null,

  _ensureCtx() {
    if (!this._ctx) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      this._ctx = new Ctor();
    }
    if (this._ctx.state === 'suspended') {
      this._ctx.resume();
    }
    return this._ctx;
  },

  _tone(freq, duration, type = 'sine', volume = 0.08) {
    const ctx = this._ensureCtx();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch { /* audio non-critical */ }
  },

  check()   { this._tone(880, 0.12, 'sine', 0.07); },
  uncheck() { this._tone(440, 0.12, 'sine', 0.07); },
  add() {
    this._tone(660, 0.08, 'sine', 0.07);
    setTimeout(() => this._tone(880, 0.12, 'sine', 0.07), 60);
  },
  delete() {
    this._tone(440, 0.08, 'sine', 0.07);
    setTimeout(() => this._tone(330, 0.12, 'sine', 0.07), 60);
  },
  drop() { this._tone(220, 0.12, 'triangle', 0.05); },
  click() { this._tone(600, 0.04, 'sine', 0.04); },
  success() {
    this._tone(660, 0.06, 'sine', 0.06);
    setTimeout(() => this._tone(880, 0.08, 'sine', 0.06), 60);
  },
  levelUp() {
    this._tone(523, 0.1, 'sine', 0.07);
    setTimeout(() => this._tone(659, 0.1, 'sine', 0.07), 120);
    setTimeout(() => this._tone(784, 0.15, 'sine', 0.07), 240);
  },
};

let todos = [];
let shoppingItems = [];
let currentFilter = localStorage.getItem('meor-filter') || 'all';
let activeTab = localStorage.getItem('meor-tab') || 'todo';
let shoppingFilter = localStorage.getItem('meor-shop-filter') || 'all';
let todoSearchQuery = '';
let shopSearchQuery = '';

/* ── RPG State ── */

let rpgXP = 0;
let rpgLevel = 1;
let rpgStreak = 0;
let rpgLastDate = '';
let rpgTotalCompleted = 0;

async function loadRpgState() {
  try {
    const data = await progressFetch('GET');
    rpgXP = data.xp || 0;
    rpgLevel = data.level || 1;
    rpgStreak = data.streak || 0;
    rpgLastDate = data.lastDate || '';
    rpgTotalCompleted = data.totalCompleted || 0;
  } catch {
    // API unavailable — use defaults
    rpgXP = 0;
    rpgLevel = 1;
    rpgStreak = 0;
    rpgLastDate = '';
    rpgTotalCompleted = 0;
  }
}

async function saveRpgState() {
  try {
    await progressFetch('PUT', {
      xp: rpgXP,
      level: rpgLevel,
      streak: rpgStreak,
      lastDate: rpgLastDate,
      totalCompleted: rpgTotalCompleted
    });
  } catch {
    // Non-critical — fail silently
  }
}

function xpForLevel(level) {
  // Cumulative XP needed to reach a given level
  // Level 1 = 0, Level 2 = 50, Level 3 = 130, etc.
  let xp = 0;
  for (let i = 1; i < level; i++) {
    xp += i * 30 + 20;
  }
  return xp;
}

function calcLevel(totalXp) {
  let level = 1;
  while (level < 20 && totalXp >= xpForLevel(level + 1)) {
    level++;
  }
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = level < 20 ? xpForLevel(level + 1) - currentLevelXp : 1;
  const currentXpInLevel = totalXp - currentLevelXp;
  return { level, currentXpInLevel, nextLevelXp };
}

function getBaseXp(tag) {
  if (tag === '!ui') return 20;
  if (tag === '!nui') return 15;
  if (tag === '!uni') return 10;
  return 5;
}

function getStreakMultiplier() {
  if (rpgStreak >= 7) return 2;
  if (rpgStreak >= 3) return 1.5;
  return 1;
}

function updateStreak() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  if (rpgLastDate === todayStr) return; // already counted today

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yyyy2 = yesterday.getFullYear();
  const mm2 = String(yesterday.getMonth() + 1).padStart(2, '0');
  const dd2 = String(yesterday.getDate()).padStart(2, '0');
  const yesterdayStr = `${yyyy2}-${mm2}-${dd2}`;

  if (rpgLastDate === yesterdayStr) {
    rpgStreak++;
  } else {
    rpgStreak = 1;
  }
  rpgLastDate = todayStr;
}

async function awardXp(baseXp) {
  const mult = getStreakMultiplier();
  const awarded = Math.round(baseXp * mult);

  rpgXP += awarded;
  rpgTotalCompleted++;

  updateStreak();

  const oldLevel = rpgLevel;
  const info = calcLevel(rpgXP);
  rpgLevel = info.level;

  await saveRpgState();
  renderRpgBadge();

  if (rpgLevel > oldLevel) {
    triggerLevelUp();
  }
}

function renderRpgBadge() {
  const levelEl = document.querySelector('.rpg-level');
  const fillEl = document.querySelector('.rpg-xp-fill');
  const streakEl = document.querySelector('.rpg-streak');
  if (!levelEl || !fillEl) return;

  const info = calcLevel(rpgXP);
  const pct = info.nextLevelXp > 0 ? (info.currentXpInLevel / info.nextLevelXp) * 100 : 100;

  levelEl.textContent = `Lv. ${rpgLevel}`;
  fillEl.style.width = `${Math.min(pct, 100)}%`;

  if (rpgStreak > 0 && streakEl) {
    streakEl.textContent = `🔥 ${rpgStreak}d`;
  } else if (streakEl) {
    streakEl.textContent = '';
  }
}

function spawnConfetti() {
  const colors = ['#30d158', '#0a84ff', '#ff9f0a', '#bf5af2', '#ff453a', '#ffd60a'];
  const header = document.querySelector('header');
  if (!header) return;
  const rect = header.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  for (let i = 0; i < 40; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = 6 + Math.random() * 6;
    const spread = (Math.random() - 0.5) * 300;
    el.style.cssText = `
      left: ${cx + spread}px;
      top: ${cy}px;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      animation-delay: ${Math.random() * 0.3}s;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2000);
  }
}

function triggerLevelUp() {
  SoundManager.levelUp();
  spawnConfetti();
  const levelEl = document.querySelector('.rpg-level');
  if (levelEl) {
    levelEl.classList.remove('pulse');
    void levelEl.offsetWidth; // force reflow
    levelEl.classList.add('pulse');
  }
}

const matrix = document.getElementById('matrix');
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
const calendarSection = document.getElementById('calendar-section');

const floatAddBtn = document.getElementById('float-add-btn');
const addModal = document.getElementById('add-modal');
const modalInput = document.getElementById('modal-input');
const modalClose = document.getElementById('modal-close');
const modalDateRow = document.querySelector('.modal-date-row');
const modalDate = document.getElementById('modal-date');

const editModal = document.getElementById('edit-modal');
const editInput = document.getElementById('edit-input');
const editDate = document.getElementById('edit-date');
const editQuadrants = document.getElementById('edit-quadrants');
const editSave = document.getElementById('edit-save');
const editClose = document.getElementById('edit-close');
let editingTodoId = null;

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

function formatDueDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(d); target.setHours(0, 0, 0, 0);
  const dayDiff = Math.round((target - today) / 86400000);

  if (dayDiff === 0) return 'Due today';
  if (dayDiff === 1) return 'Due tomorrow';
  if (dayDiff > 0) return `Due in ${dayDiff} days`;
  return `Due ${d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}`;
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

async function progressFetch(method, body) {
  return fetchWithTimeout(PROGRESS_API, {
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

  const query = todoSearchQuery.toLowerCase().trim();
  const filtered = todos.filter(t => {
    if (currentFilter === 'active') return !t.completed;
    if (currentFilter === 'completed') return t.completed;
    return true;
  }).filter(t => {
    if (!query) return true;
    return stripTag(t.title).toLowerCase().includes(query);
  });

  const grouped = { q1: [], q2: [], q3: [], q4: [] };
  for (const t of filtered) {
    const q = getQuadrantKey(t.title);
    grouped[q].push(t);
  }

  grouped.q2.sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate) - new Date(b.dueDate);
  });

  if (currentFilter === 'all') {
    for (const q of ['q2', 'q3', 'q4']) {
      const urgent = grouped[q].filter(t => {
        if (!t.dueDate) return false;
        const days = (new Date(t.dueDate) - Date.now()) / 86400000;
        return days >= 0 && days <= 2;
      });
      grouped.q1.push(...urgent);
      grouped[q] = grouped[q].filter(t => !urgent.includes(t));
    }
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
              const dd = t.dueDate ? new Date(t.dueDate) : null;
              const ddStr = dd ? `<span class="todo-due">${formatDueDate(dd)}</span>` : '';
              return `
            <div class="todo-item ${t.completed ? 'completed' : ''}" draggable="true" data-id="${t._id}">
              <input type="checkbox" class="todo-checkbox" ${t.completed ? 'checked' : ''}>
              <div class="todo-body">
                <span class="todo-title">${escapeHtml(stripTag(t.title))}</span>
                <div class="todo-meta">
                  <span class="todo-date">${formatDate(t.createdAt)}${t.updatedAt !== t.createdAt ? ' · edited ' + formatDate(t.updatedAt) : ''}${dd ? ' · ' : ''}${ddStr}</span>
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
  const query = shopSearchQuery.toLowerCase().trim();
  const filtered = shoppingItems.filter(item => {
    if (shoppingFilter !== 'all') return item.category === shoppingFilter;
    return true;
  }).filter(item => {
    if (!query) return true;
    return item.name.toLowerCase().includes(query);
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

async function addTodo(titleRaw, tag, dueDate) {
  const title = tag ? `${titleRaw} ${tag}` : titleRaw;
  try {
    const body = { title };
    if (dueDate) body.dueDate = dueDate;
    const newTodo = await apiFetch('POST', body);
    todos.push(newTodo);
    SoundManager.add();
    render();
  } catch (err) {
    alert('Failed to add todo: ' + err.message);
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
    if (completed) awardXp(getBaseXp(getCurrentTag(updated.title)));
    render();
  } catch (err) {
    alert('Failed to update todo: ' + err.message);
  }
}

async function deleteTodo(id) {
  try {
    await apiFetchId(id, 'DELETE');
    todos = todos.filter(t => t._id !== id);
    SoundManager.delete();
    render();
  } catch (err) {
    alert('Failed to delete todo: ' + err.message);
  }
}

async function clearCompleted() {
  const completed = todos.filter(t => t.completed);
  if (completed.length === 0) return;
  SoundManager.success();
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
    SoundManager.add();
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
    if (completed) awardXp(3);
    renderShopping();
  } catch (err) {
    alert('Failed to update shopping item: ' + err.message);
  }
}

async function deleteShoppingItem(id) {
  try {
    await shopFetchId(id, 'DELETE');
    shoppingItems = shoppingItems.filter(i => i._id !== id);
    SoundManager.delete();
    renderShopping();
  } catch (err) {
    alert('Failed to delete shopping item: ' + err.message);
  }
}

async function clearBought() {
  const bought = shoppingItems.filter(i => i.completed);
  if (bought.length === 0) return;
  SoundManager.success();
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
  SoundManager.click();
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
  SoundManager.click();
  shoppingFilter = cat;
  localStorage.setItem('meor-shop-filter', cat);
  applyShopFilterUI();
  renderShopping();
}

function switchTab(tab) {
  SoundManager.click();
  activeTab = tab;
  localStorage.setItem('meor-tab', tab);
  todoSection.style.display = tab === 'todo' ? '' : 'none';
  shoppingSection.style.display = tab === 'shopping' ? '' : 'none';
  calendarSection.style.display = tab === 'calendar' ? '' : 'none';
  tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  if (tab === 'shopping') shopInput.focus();
  if (tab === 'calendar') renderCalendar();
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

/* ── Edit Modal ── */

function openEditModal(todo) {
  editingTodoId = todo._id;
  editInput.value = stripTag(todo.title);
  if (todo.dueDate) {
    const d = new Date(todo.dueDate);
    editDate.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  } else {
    editDate.value = '';
  }
  const currentTag = getCurrentTag(todo.title);

  editQuadrants.querySelectorAll('.modal-quadrant').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.tag === currentTag);
  });

  editModal.style.display = 'flex';
  setTimeout(() => editInput.focus(), 50);
}

function closeEditModal() {
  SoundManager.click();
  editModal.style.display = 'none';
  editingTodoId = null;
}

async function saveEdit() {
  SoundManager.click();
  const id = editingTodoId;
  if (!id) return;
  const title = editInput.value.trim();
  if (!title) return;

  const selected = editQuadrants.querySelector('.modal-quadrant.selected');
  const tag = selected ? selected.dataset.tag : '';
  const newTitle = tag ? `${title} ${tag}` : title;
  const dueDate = editDate.value || null;

  try {
    const body = { title: newTitle };
    body.dueDate = dueDate || null;
    const updated = await apiFetchId(id, 'PUT', body);
    const idx = todos.findIndex(t => t._id === id);
    if (idx !== -1) todos[idx] = updated;
    closeEditModal();
    render();
  } catch (err) {
    alert('Failed to save todo: ' + err.message);
  }
}

editModal.addEventListener('click', (e) => {
  if (e.target === editModal) closeEditModal();
});

editClose.addEventListener('click', closeEditModal);
editSave.addEventListener('click', saveEdit);

editInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); saveEdit(); }
  if (e.key === 'Escape') { closeEditModal(); }
});

editQuadrants.addEventListener('click', (e) => {
  const btn = e.target.closest('.modal-quadrant');
  if (!btn) return;
  SoundManager.click();
  editQuadrants.querySelectorAll('.modal-quadrant').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
});

/* ── Add Modal ── */

function openModal() {
  SoundManager.click();
  modalInput.value = '';
  modalDate.value = '';
  modalDateRow.style.display = 'none';
  addModal.style.display = 'flex';
  setTimeout(() => modalInput.focus(), 50);
}

function closeModal() {
  SoundManager.click();
  addModal.style.display = 'none';
}

addModal.addEventListener('click', (e) => {
  if (e.target === addModal) closeModal();
});

modalClose.addEventListener('click', closeModal);

modalInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const title = modalInput.value.trim();
    if (!title) return;
    e.preventDefault();
    addTodo(title, '', modalDate.value || null);
    closeModal();
  }
});

addModal.addEventListener('click', (e) => {
  const btn = e.target.closest('.modal-quadrant');
  if (!btn) return;
  const title = modalInput.value.trim();
  if (!title) return;
  const tag = btn.dataset.tag;

  if (tag === '!nui' && !modalDate.value) {
    modalDateRow.style.display = '';
    modalDate.focus();
    modalDate.showPicker?.();
    return;
  }

  addTodo(title, tag, modalDate.value || null);
  closeModal();
});

floatAddBtn.addEventListener('click', openModal);

/* ── Calendar ── */

let calendarViewDate = new Date();

function renderCalendar() {
  const grid = document.getElementById('cal-grid');
  const titleEl = document.getElementById('cal-title');
  const year = calendarViewDate.getFullYear();
  const month = calendarViewDate.getMonth();

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  titleEl.textContent = `${monthNames[month]} ${year}`;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  // Build a map of dueDate → todos for quick lookup
  const dueMap = {};
  for (const t of todos) {
    if (!t.dueDate) continue;
    const d = new Date(t.dueDate);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if (!dueMap[key]) dueMap[key] = [];
    dueMap[key].push(t);
  }

  const cells = [];
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  for (let i = 0; i < totalCells; i++) {
    let dayNum, dateStr, isOther = false;

    if (i < firstDay) {
      dayNum = daysInPrev - firstDay + i + 1;
      isOther = true;
    } else if (i >= firstDay + daysInMonth) {
      dayNum = i - firstDay - daysInMonth + 1;
      isOther = true;
    } else {
      dayNum = i - firstDay + 1;
    }

    const m = isOther ? (i < firstDay ? (month === 0 ? 11 : month - 1) : (month === 11 ? 0 : month + 1)) : month;
    const y = isOther ? (i < firstDay && month === 0 ? year - 1 : (i >= firstDay + daysInMonth && month === 11 ? year + 1 : year)) : year;
    dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(dayNum).padStart(2,'0')}`;

    const isToday = dateStr === todayStr;
    const dayTodos = dueMap[dateStr] || [];

    let dotsHtml = '';
    for (const t of dayTodos) {
      const cls = t.completed ? 'done' : (new Date(t.dueDate) < new Date(todayStr) ? 'overdue' : 'upcoming');
      dotsHtml += `<span class="cal-task-dot ${cls}" data-id="${t._id}">${escapeHtml(stripTag(t.title))}</span>`;
    }

    cells.push(`
      <div class="cal-day${isOther ? ' other-month' : ''}${isToday ? ' today' : ''}" data-date="${dateStr}">
        <div class="cal-day-num">${dayNum}</div>
        <div class="cal-tasks">${dotsHtml}</div>
      </div>
    `);
  }

  grid.innerHTML = grid.querySelectorAll('.cal-day-header').length
    ? grid.querySelector('.cal-day-header').outerHTML + cells.join('')
    : cells.join('');

  // Keep day headers
  const headers = grid.querySelectorAll('.cal-day-header');
  if (headers.length === 0) {
    const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    grid.innerHTML = dayNames.map(d => `<div class="cal-day-header">${d}</div>`).join('') + cells.join('');
  }
}

/* ── Pomodoro Timer ── */

const POMO_FOCUS = 25 * 60;
const POMO_BREAK = 5 * 60;

let pomoState = 'idle'; // idle | running | paused | break | breakRunning
let pomoTimeLeft = POMO_FOCUS;
let pomoInterval = null;
let pomoSessions = parseInt(localStorage.getItem('meor-pomo-sessions')) || 0;

const pomoTimeEl = document.getElementById('pomo-time');
const pomoStartBtn = document.getElementById('pomo-start');
const pomoResetBtn = document.getElementById('pomo-reset');
const pomoSessionsEl = document.getElementById('pomo-sessions');
const pomoIconEl = document.getElementById('pomo-icon');

function pomoFormat(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function pomoUpdateDisplay() {
  pomoTimeEl.textContent = pomoFormat(pomoTimeLeft);
  pomoTimeEl.classList.toggle('break', pomoState === 'break' || pomoState === 'breakRunning');
  pomoSessionsEl.textContent = pomoSessions > 0 ? `🍅 x${pomoSessions}` : '';
  pomoIconEl.textContent = (pomoState === 'break' || pomoState === 'breakRunning') ? '☕' : '⏱';

  if (pomoState === 'running' || pomoState === 'breakRunning') {
    pomoStartBtn.textContent = '⏸';
    pomoStartBtn.classList.add('running');
  } else {
    pomoStartBtn.textContent = '▶';
    pomoStartBtn.classList.remove('running');
  }
}

function pomoStop() {
  if (pomoInterval) {
    clearInterval(pomoInterval);
    pomoInterval = null;
  }
}

function pomoTick() {
  pomoTimeLeft--;
  pomoUpdateDisplay();

  if (pomoTimeLeft <= 0) {
    pomoStop();

    if (pomoState === 'running') {
      // Focus session complete
      pomoSessions++;
      localStorage.setItem('meor-pomo-sessions', pomoSessions);
      SoundManager.levelUp(); // triumphant sound
      pomoState = 'break';
      pomoTimeLeft = POMO_BREAK;
      pomoUpdateDisplay();
      // Auto-start break
      pomoStartBreak();
    } else if (pomoState === 'breakRunning') {
      // Break complete
      SoundManager.success();
      pomoState = 'idle';
      pomoTimeLeft = POMO_FOCUS;
      pomoUpdateDisplay();
    }
  }
}

function pomoStartFocus() {
  pomoStop();
  pomoState = 'running';
  pomoInterval = setInterval(pomoTick, 1000);
  pomoUpdateDisplay();
}

function pomoStartBreak() {
  pomoStop();
  pomoState = 'breakRunning';
  pomoInterval = setInterval(pomoTick, 1000);
  pomoUpdateDisplay();
}

function pomoStartPause() {
  if (pomoState === 'idle' || pomoState === 'break') {
    // Start
    if (pomoState === 'idle') {
      pomoTimeLeft = POMO_FOCUS;
      pomoStartFocus();
    } else {
      pomoStartBreak();
    }
  } else if (pomoState === 'running' || pomoState === 'breakRunning') {
    // Pause
    pomoStop();
    pomoState = pomoState === 'running' ? 'paused' : 'break';
    pomoUpdateDisplay();
  } else if (pomoState === 'paused') {
    // Resume
    pomoStartFocus();
  }
}

pomoStartBtn.addEventListener('click', () => {
  SoundManager.click();
  pomoStartPause();
});

pomoResetBtn.addEventListener('click', () => {
  SoundManager.click();
  pomoStop();
  pomoState = 'idle';
  pomoTimeLeft = POMO_FOCUS;
  pomoUpdateDisplay();
});

pomoUpdateDisplay();

/* ── Stats Dashboard ── */

function renderStats() {
  const el = document.getElementById('stats-content');

  // Overview
  const info = calcLevel(rpgXP);
  const pct = info.nextLevelXp > 0 ? Math.round((info.currentXpInLevel / info.nextLevelXp) * 100) : 100;

  // This week: completed tasks per day
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const weekData = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const start = new Date(d); start.setHours(0, 0, 0, 0);
    const end = new Date(d); end.setHours(23, 59, 59, 999);
    const count = todos.filter(t => t.completed && new Date(t.updatedAt) >= start && new Date(t.updatedAt) <= end).length;
    const dayLabel = i === 0 ? 'Today' : i === 1 ? 'Yest' : days[d.getDay()];
    weekData.push({ label: dayLabel, count, max: 0 });
  }
  const maxWeek = Math.max(...weekData.map(d => d.count), 1);

  // Quadrant distribution
  const quadCounts = { q1: 0, q2: 0, q3: 0, q4: 0 };
  for (const t of todos) {
    if (t.completed) continue;
    quadCounts[getQuadrantKey(t.title)]++;
  }
  const totalActive = Object.values(quadCounts).reduce((a, b) => a + b, 0) || 1;

  // Shopping category breakdown
  const catCounts = { grocery: 0, watsons: 0, mrdiy: 0, online: 0, etc: 0 };
  for (const item of shoppingItems) {
    if (item.completed) continue;
    if (catCounts[item.category] !== undefined) catCounts[item.category]++;
  }
  const catTotal = Object.values(catCounts).reduce((a, b) => a + b, 0) || 1;

  // Streak grid (last 30 days)
  const streakCells = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${day}`;
    const isActive = todos.some(t => {
      if (!t.completed) return false;
      const u = new Date(t.updatedAt);
      return `${u.getFullYear()}-${String(u.getMonth()+1).padStart(2,'0')}-${String(u.getDate()).padStart(2,'0')}` === dateStr;
    });
    const isToday = dateStr === `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    streakCells.push(`<div class="streak-cell${isActive ? ' active' : ''}${isToday && !isActive ? ' today-cell' : ''}"></div>`);
  }

  const quadOrder = [
    { key: 'q1', label: 'Do First', cls: 'q1' },
    { key: 'q2', label: 'Schedule', cls: 'q2' },
    { key: 'q3', label: 'Delegate', cls: 'q3' },
    { key: 'q4', label: 'Eliminate', cls: 'q4' },
  ];

  const catOrder = [
    { key: 'grocery', label: 'Grocery', color: 'var(--green)' },
    { key: 'watsons', label: 'Watsons', color: 'var(--blue)' },
    { key: 'mrdiy', label: 'MRDIY', color: 'var(--orange)' },
    { key: 'online', label: 'Online', color: 'var(--purple)' },
    { key: 'etc', label: 'Etc', color: 'var(--text-tertiary)' },
  ];

  el.innerHTML = `
    <div class="stats-section">
      <h4>Overview</h4>
      <div class="stats-overview">
        <div class="stat-box"><span class="stat-value">${rpgLevel}</span><span class="stat-label">Level</span></div>
        <div class="stat-box"><span class="stat-value">${rpgXP}</span><span class="stat-label">XP</span></div>
        <div class="stat-box"><span class="stat-value">${rpgStreak}</span><span class="stat-label">Streak</span></div>
        <div class="stat-box"><span class="stat-value">${rpgTotalCompleted}</span><span class="stat-label">Done</span></div>
      </div>
    </div>
    <div class="stats-section">
      <h4>This Week</h4>
      <div class="chart-bars">
        ${weekData.map(d => `
          <div class="chart-bar-wrap">
            <div class="chart-bar${d.count > 0 ? ' done' : ''}" style="height:${(d.count / maxWeek) * 100}%"></div>
            <span class="chart-label">${d.label}</span>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="stats-section">
      <h4>Active Tasks by Quadrant</h4>
      ${quadOrder.map(q => {
        const pct = Math.round((quadCounts[q.key] / totalActive) * 100);
        return `
          <div class="chart-hbar">
            <span class="hbar-label">${q.label}</span>
            <div class="hbar-track"><div class="hbar-fill ${q.cls}" style="width:${pct}%"></div></div>
            <span style="font-size:0.7rem;color:var(--text-tertiary);min-width:3ch">${quadCounts[q.key]}</span>
          </div>`;
      }).join('')}
    </div>
    <div class="stats-section">
      <h4>Shopping by Category</h4>
      ${catOrder.map(c => {
        const pct = Math.round((catCounts[c.key] / catTotal) * 100);
        return `
          <div class="chart-hbar">
            <span class="hbar-label">${c.label}</span>
            <div class="hbar-track"><div class="hbar-fill" style="width:${pct}%;background:${c.color}"></div></div>
            <span style="font-size:0.7rem;color:var(--text-tertiary);min-width:3ch">${catCounts[c.key]}</span>
          </div>`;
      }).join('')}
    </div>
    <div class="stats-section">
      <h4>Last 30 Days</h4>
      <div class="streak-grid">${streakCells.join('')}</div>
    </div>
  `;
}

document.getElementById('stats-btn').addEventListener('click', () => {
  SoundManager.click();
  document.getElementById('stats-modal').style.display = 'flex';
  renderStats();
});

document.getElementById('stats-close').addEventListener('click', () => {
  SoundManager.click();
  document.getElementById('stats-modal').style.display = 'none';
});

document.getElementById('stats-modal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('stats-modal')) {
    document.getElementById('stats-modal').style.display = 'none';
  }
});

/* ── Event listeners ── */

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
    return;
  }
  if (e.target.classList.contains('todo-checkbox')) return;
  const todo = todos.find(t => t._id === item.dataset.id);
  if (todo) openEditModal(todo);
});

shopList.addEventListener('click', (e) => {
  if (e.target.classList.contains('shop-delete')) {
    const item = e.target.closest('.shop-item');
    if (item) deleteShoppingItem(item.dataset.id);
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
    if (item) {
      SoundManager[e.target.checked ? 'check' : 'uncheck']();
      toggleTodo(item.dataset.id, e.target.checked);
    }
  }
});

shopList.addEventListener('change', (e) => {
  if (e.target.classList.contains('shop-checkbox')) {
    const item = e.target.closest('.shop-item');
    if (item) {
      SoundManager[e.target.checked ? 'check' : 'uncheck']();
      toggleShoppingItem(item.dataset.id, e.target.checked);
    }
  }
});

/* ── Drag and Drop ── */

matrix.addEventListener('dragstart', (e) => {
  if (e.target.closest('.todo-checkbox') || e.target.closest('.todo-delete')) {
    e.preventDefault();
    return;
  }
  const item = e.target.closest('.todo-item');
  if (!item) { e.preventDefault(); return; }
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', item.dataset.id);
  item.classList.add('dragging');
});

matrix.addEventListener('dragend', () => {
  document.querySelectorAll('.todo-item.dragging').forEach(el => el.classList.remove('dragging'));
  document.querySelectorAll('.quadrant.drag-over').forEach(el => el.classList.remove('drag-over'));
});

matrix.addEventListener('dragover', (e) => {
  const quadrant = e.target.closest('.quadrant');
  if (!quadrant) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  quadrant.classList.add('drag-over');
});

matrix.addEventListener('dragleave', (e) => {
  const quadrant = e.target.closest('.quadrant');
  if (!quadrant) return;
  if (e.relatedTarget && quadrant.contains(e.relatedTarget)) return;
  quadrant.classList.remove('drag-over');
});

matrix.addEventListener('drop', (e) => {
  e.preventDefault();
  document.querySelectorAll('.quadrant.drag-over').forEach(el => el.classList.remove('drag-over'));
  document.querySelectorAll('.todo-item.dragging').forEach(el => el.classList.remove('dragging'));

  const quadrant = e.target.closest('.quadrant');
  if (!quadrant) return;

  const todoId = e.dataTransfer.getData('text/plain');
  if (!todoId) return;

  const qClass = Array.from(quadrant.classList).find(c => /^q[1-4]$/.test(c));
  if (!qClass) return;

  const targetTag = QUADRANTS.find(q => q.key === qClass).tag;
  const todo = todos.find(t => t._id === todoId);
  if (!todo) return;

  const currentTag = getCurrentTag(todo.title);
  if (currentTag === targetTag) return;

  const cleanTitle = stripTag(todo.title);
  const newTitle = targetTag ? `${cleanTitle} ${targetTag}` : cleanTitle;

  SoundManager.drop();
  renameTodo(todoId, newTitle);
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

/* ── Search ── */

const todoSearch = document.getElementById('todo-search');
const shopSearch = document.getElementById('shop-search');

todoSearch.addEventListener('input', () => {
  todoSearchQuery = todoSearch.value;
  render();
});

shopSearch.addEventListener('input', () => {
  shopSearchQuery = shopSearch.value;
  renderShopping();
});

/* ── Calendar events ── */

document.getElementById('cal-prev').addEventListener('click', () => {
  SoundManager.click();
  calendarViewDate.setMonth(calendarViewDate.getMonth() - 1);
  renderCalendar();
});

document.getElementById('cal-next').addEventListener('click', () => {
  SoundManager.click();
  calendarViewDate.setMonth(calendarViewDate.getMonth() + 1);
  renderCalendar();
});

document.getElementById('cal-grid').addEventListener('click', (e) => {
  const dot = e.target.closest('.cal-task-dot');
  if (dot) {
    const todo = todos.find(t => t._id === dot.dataset.id);
    if (todo) openEditModal(todo);
    return;
  }
  const day = e.target.closest('.cal-day');
  if (day && !day.classList.contains('other-month')) {
    const date = day.dataset.date;
    if (date) {
      openModal();
      document.getElementById('modal-date').value = date;
      modalDateRow.style.display = '';
    }
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (editModal.style.display === 'flex') closeEditModal();
    else if (addModal.style.display === 'flex') closeModal();
    return;
  }
  if (e.key === 'n' || e.key === '/') {
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'SELECT') {
      e.preventDefault();
      if (activeTab === 'shopping') shopInput.focus();
      else openModal();
    }
  }
});

/* ── Init ── */

loadRpgState().then(() => {
  renderRpgBadge();
  switchTab(activeTab);
  loadTodos();
});
