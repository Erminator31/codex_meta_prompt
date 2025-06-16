const STORAGE_KEY = 'todoTasks';
const THEME_KEY = 'theme';
let tasks = [];

// Helpers for storage
function loadTasks() {
  const raw = localStorage.getItem(STORAGE_KEY);
  tasks = raw ? JSON.parse(raw) : [];
}
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// Task operations
function addTask(text, priority) {
  const order = tasks.filter(t => !t.isDone).length;
  tasks.push({
    id: crypto.randomUUID(),
    text,
    priority,
    createdAt: new Date().toISOString(),
    doneAt: null,
    isDone: false,
    order
  });
  saveTasks();
}
function findTask(id) {
  return tasks.find(t => t.id === id);
}
function toggleDone(id, done) {
  const t = findTask(id);
  if (!t) return;
  t.isDone = done;
  t.doneAt = done ? new Date().toISOString() : null;
  saveTasks();
}
function updateText(id, text) {
  const t = findTask(id);
  if (!t) return;
  t.text = text;
  saveTasks();
}
function restoreTask(id) {
  const t = findTask(id);
  if (!t) return;
  t.isDone = false;
  t.doneAt = null;
  t.order = tasks.filter(a => !a.isDone).length;
  saveTasks();
}
function updateOrder(idList) {
  idList.forEach((id, idx) => {
    const t = findTask(id);
    if (t) t.order = idx;
  });
  saveTasks();
}

// Rendering
function render() {
  renderOpen();
  renderDone();
}
function renderOpen() {
  const list = document.getElementById('todo-list');
  list.innerHTML = '';
  const sort = document.getElementById('sortSelect').value;
  let open = tasks.filter(t => !t.isDone);
  if (sort === 'priority') {
    const p = { high: 0, medium: 1, low: 2 };
    open.sort((a, b) => p[a.priority] - p[b.priority]);
  } else {
    open.sort((a, b) => a.order - b.order);
  }
  open.forEach(t => {
    const li = document.createElement('li');
    li.dataset.id = t.id;
    li.draggable = true;
    li.innerHTML = `
      <input type="checkbox">
      <span aria-label="Tasktext" class="text"></span>
      <span class="priority-badge priority-${t.priority}">${t.priority}</span>
    `;
    li.querySelector('span.text').textContent = t.text;
    li.querySelector('input').addEventListener('change', e => {
      toggleDone(t.id, e.target.checked);
      render();
    });
    li.querySelector('span.text').addEventListener('dblclick', () => startEdit(li, t.id));
    li.addEventListener('dragstart', dragStart);
    li.addEventListener('dragover', dragOver);
    li.addEventListener('drop', drop);
    li.addEventListener('dragend', dragEnd);
    list.appendChild(li);
  });
}
function renderDone() {
  const list = document.getElementById('done-list');
  list.innerHTML = '';
  const done = tasks.filter(t => t.isDone).sort((a, b) => new Date(b.doneAt) - new Date(a.doneAt));
  done.forEach(t => {
    const li = document.createElement('li');
    li.dataset.id = t.id;
    li.innerHTML = `
      <span>${t.text}</span>
      <time datetime="${t.createdAt}">${new Date(t.createdAt).toLocaleString()}</time>
      <time datetime="${t.doneAt}">${new Date(t.doneAt).toLocaleString()}</time>
      <button class="restore-button">↩</button>
    `;
    li.querySelector('button').addEventListener('click', () => {
      restoreTask(t.id);
      render();
    });
    list.appendChild(li);
  });
}

// Drag & drop
let dragSrc = null;
function dragStart(e) {
  dragSrc = this.dataset.id;
  e.dataTransfer.effectAllowed = 'move';
}
function dragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}
function drop(e) {
  e.preventDefault();
  const targetId = this.dataset.id;
  const items = Array.from(document.querySelectorAll('#todo-list li')).map(li => li.dataset.id);
  const srcIdx = items.indexOf(dragSrc);
  const tgtIdx = items.indexOf(targetId);
  if (srcIdx > -1 && tgtIdx > -1 && srcIdx !== tgtIdx) {
    items.splice(tgtIdx, 0, items.splice(srcIdx, 1)[0]);
    updateOrder(items);
    render();
  }
}
function dragEnd() {
  dragSrc = null;
}

// Inline edit
function startEdit(li, id) {
  const span = li.querySelector('span.text');
  const input = document.createElement('input');
  input.type = 'text';
  input.value = span.textContent;
  span.replaceWith(input);
  input.focus();
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      updateText(id, input.value.substring(0, 200));
      render();
    } else if (e.key === 'Escape') {
      render();
    }
  });
}

// Theme handling
function initTheme() {
  let theme = localStorage.getItem(THEME_KEY);
  if (!theme) {
    theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.dataset.theme = theme;
}
function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem(THEME_KEY, next);
}

document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

document.getElementById('todo-input').addEventListener('input', e => {
  document.getElementById('add-button').disabled = e.target.value.trim() === '';
});

document.getElementById('add-button').addEventListener('click', () => {
  const text = document.getElementById('todo-input').value.trim().substring(0, 200);
  const priority = document.getElementById('priority-select').value;
  if (text) {
    addTask(text, priority);
    document.getElementById('todo-input').value = '';
    document.getElementById('add-button').disabled = true;
    render();
  }
});

document.getElementById('sortSelect').addEventListener('change', render);

function handleRoute() {
  const done = location.hash === '#/done';
  document.getElementById('open-view').hidden = done;
  document.getElementById('done-view').hidden = !done;
  render();
}
window.addEventListener('hashchange', handleRoute);

// Initialize app
loadTasks();
initTheme();
if (!location.hash) location.hash = '#/';
handleRoute();
