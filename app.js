const API_BASE = 'https://scriptable-todo.onrender.com/api/todos';

const QUADRANTS = [
  { key: 'q1', tag: '!ui',   title: 'Do First',    sub: 'Urgent & Important' },
  { key: 'q2', tag: '!nui',  title: 'Schedule',    sub: 'Not Urgent & Important' },
  { key: 'q3', tag: '!uni',  title: 'Delegate',    sub: 'Urgent & Not Important' },
  { key: 'q4', tag: '',      title: 'Eliminate',   sub: 'Not Urgent & Not Important' },
];

let todos = [];
let currentFilter = localStorage.getItem('meor-filter') || 'all';

const matrix = document.getElementById('matrix');
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const quadrantSelect = document.getElementById('quadrant-select');
const addBtn = document.getElementById('add-btn');
const todoCount = document.getElementById('todo-count');
const clearCompletedBtn = document.getElementById('clear-completed');
const filterBtns = document.querySelectorAll('.filter-btn');

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
      return;
    } catch {
      matrix.innerHTML = '<div class="loading">Render is probably spinning this up, retrying in 5s...</div>';
      await new Promise(r => setTimeout(r, 5000));
    }
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

/* ── Inline edit ── */

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

matrix.addEventListener('click', (e) => {
  const item = e.target.closest('.todo-item');
  if (!item) return;
  if (e.target.classList.contains('todo-delete')) {
    deleteTodo(item.dataset.id);
  }
});

matrix.addEventListener('dblclick', (e) => {
  const item = e.target.closest('.todo-item');
  if (!item || item.classList.contains('editing')) return;
  if (e.target.classList.contains('todo-title')) {
    startEdit(item);
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

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    setFilter(btn.dataset.filter);
  });
});

clearCompletedBtn.addEventListener('click', clearCompleted);

document.addEventListener('keydown', (e) => {
  if (e.key === 'n' || e.key === '/') {
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'SELECT') {
      e.preventDefault();
      todoInput.focus();
    }
  }
});

loadTodos();
