const API = '/api/tasks';
let allTasks = [];
let currentFilter = 'all';

const PRIORITY_LABEL = { high: 'Critical', medium: 'Standard', low: 'Low Impact' };

async function fetchTasks() {
  try {
    const res = await fetch(API);
    const json = await res.json();
    allTasks = json.data || [];
    renderTasks();
  } catch (err) {
    document.getElementById('task-list').innerHTML =
      '<p class="empty-state">Unable to reach monitoring service. Check your connection.</p>';
  }
}

function updateStats() {
  const active   = allTasks.filter(t => !t.completed).length;
  const deployed = allTasks.filter(t =>  t.completed).length;
  document.getElementById('stat-total').textContent    = allTasks.length;
  document.getElementById('stat-active').textContent   = active;
  document.getElementById('stat-deployed').textContent = deployed;
  document.getElementById('task-count').textContent =
    `${allTasks.length} resource${allTasks.length !== 1 ? 's' : ''}`;
}

function renderTasks() {
  updateStats();

  const list = document.getElementById('task-list');
  const filtered = allTasks.filter(t => {
    if (currentFilter === 'pending')   return !t.completed;
    if (currentFilter === 'completed') return  t.completed;
    return true;
  });

  if (filtered.length === 0) {
    list.innerHTML = '<p class="empty-state">No resources found. Register one above.</p>';
    return;
  }

  list.innerHTML = filtered.map(r => `
    <div class="task-card priority-${r.priority} ${r.completed ? 'completed' : ''}" data-id="${r.id}">
      <div class="task-info">
        <div class="task-header">
          <div class="task-title">${escapeHtml(r.title)}</div>
          <span class="status-badge ${r.completed ? 'status-deployed' : 'status-active'}">
            &#x25CF; ${r.completed ? 'Deployed' : 'Active'}
          </span>
        </div>
        <div class="task-meta">
          ${r.subject  ? `<span>&#x1F527; ${escapeHtml(r.subject)}</span>` : ''}
          <span>&#x26A1; ${PRIORITY_LABEL[r.priority] || capitalize(r.priority)}</span>
          ${r.dueDate  ? `<span>&#x1F4C5; Deploy by: ${r.dueDate}</span>` : ''}
        </div>
      </div>
      <div class="task-actions">
        ${r.completed
          ? `<button class="btn btn-reactivate" onclick="toggleTask('${r.id}', true)">Reactivate</button>`
          : `<button class="btn btn-success"    onclick="toggleTask('${r.id}', false)">Mark Deployed</button>`
        }
        <button class="btn btn-danger" onclick="deleteTask('${r.id}')">Remove</button>
      </div>
    </div>
  `).join('');
}

async function addTask(e) {
  e.preventDefault();
  const errEl = document.getElementById('form-error');
  errEl.classList.add('hidden');

  const body = {
    title:    document.getElementById('title').value.trim(),
    subject:  document.getElementById('subject').value.trim(),
    priority: document.getElementById('priority').value,
    dueDate:  document.getElementById('dueDate').value,
  };

  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) {
      errEl.textContent = json.error || 'Failed to register resource';
      errEl.classList.remove('hidden');
      return;
    }
    allTasks.unshift(json.data);
    renderTasks();
    e.target.reset();
  } catch {
    errEl.textContent = 'Network error. Please try again.';
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
  } catch { /* ignore transient network errors */ }
}

async function deleteTask(id) {
  if (!confirm('Remove this resource from monitoring?')) return;
  try {
    const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
    if (res.ok) {
      allTasks = allTasks.filter(t => t.id !== id);
      renderTasks();
    }
  } catch { /* ignore transient network errors */ }
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
