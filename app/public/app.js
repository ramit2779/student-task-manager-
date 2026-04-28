const API = '/api/tasks';
let allTasks = [];
let currentFilter = 'all';

async function fetchTasks() {
  try {
    const res = await fetch(API);
    const json = await res.json();
    allTasks = json.data || [];
    renderTasks();
  } catch (err) {
    document.getElementById('task-list').innerHTML =
      '<p class="empty-state">Could not connect to server.</p>';
  }
}

function renderTasks() {
  const list = document.getElementById('task-list');
  const filtered = allTasks.filter(t => {
    if (currentFilter === 'pending') return !t.completed;
    if (currentFilter === 'completed') return t.completed;
    return true;
  });

  document.getElementById('task-count').textContent =
    `${allTasks.length} task${allTasks.length !== 1 ? 's' : ''}`;

  if (filtered.length === 0) {
    list.innerHTML = '<p class="empty-state">No tasks here. Add one above!</p>';
    return;
  }

  list.innerHTML = filtered.map(task => `
    <div class="task-card priority-${task.priority} ${task.completed ? 'completed' : ''}" data-id="${task.id}">
      <div class="task-info">
        <div class="task-title">${escapeHtml(task.title)}</div>
        <div class="task-meta">
          ${task.subject ? `<span>&#x1F4D6; ${escapeHtml(task.subject)}</span>` : ''}
          <span>&#x26A1; ${capitalize(task.priority)}</span>
          ${task.dueDate ? `<span>&#x1F4C5; Due ${task.dueDate}</span>` : ''}
        </div>
      </div>
      <div class="task-actions">
        <button class="btn btn-success" onclick="toggleTask('${task.id}', ${task.completed})">
          ${task.completed ? 'Undo' : 'Done'}
        </button>
        <button class="btn btn-danger" onclick="deleteTask('${task.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

async function addTask(e) {
  e.preventDefault();
  const errEl = document.getElementById('form-error');
  errEl.classList.add('hidden');

  const body = {
    title: document.getElementById('title').value.trim(),
    subject: document.getElementById('subject').value.trim(),
    priority: document.getElementById('priority').value,
    dueDate: document.getElementById('dueDate').value,
  };

  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) {
      errEl.textContent = json.error || 'Failed to add task';
      errEl.classList.remove('hidden');
      return;
    }
    allTasks.unshift(json.data);
    renderTasks();
    e.target.reset();
  } catch {
    errEl.textContent = 'Network error. Try again.';
    errEl.classList.remove('hidden');
  }
}

async function toggleTask(id, isCompleted) {
  try {
    const res = await fetch(`${API}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !isCompleted }),
    });
    const json = await res.json();
    if (res.ok) {
      const idx = allTasks.findIndex(t => t.id === id);
      if (idx !== -1) allTasks[idx] = json.data;
      renderTasks();
    }
  } catch { /* silently ignore network errors on toggle */ }
}

async function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  try {
    const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
    if (res.ok) {
      allTasks = allTasks.filter(t => t.id !== id);
      renderTasks();
    }
  } catch { /* silently ignore network errors on delete */ }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

document.getElementById('task-form').addEventListener('submit', addTask);
fetchTasks();
