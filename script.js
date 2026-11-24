// Default sample data for first visit
const defaultData = {
  classes: [
    { id: 'c1', name: 'Algebra II', teacher: 'Ms. Chen • Period 1', color: '#2563eb' },
    { id: 'c2', name: 'World History', teacher: 'Mr. Davis • Period 4', color: '#059669' }
  ],
  assignments: [
    { id: 'a1', classId: 'c1', title: 'Quadratic Functions Quiz', due: '2026-11-28', earned: 46, max: 50, done: true },
    { id: 'a2', classId: 'c1', title: 'Chapter 5 Problem Set', due: '2026-12-02', earned: null, max: 25, done: false },
    { id: 'a3', classId: 'c2', title: 'Primary Source Essay', due: '2026-11-25', earned: 92, max: 100, done: true }
  ]
};

let state = JSON.parse(localStorage.getItem('studyhub_data')) || defaultData;

function saveState() {
  localStorage.setItem('studyhub_data', JSON.stringify(state));
  renderAll();
}

// Tab Navigation
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tabName = btn.dataset.tab;
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + tabName).classList.add('active');
    btn.classList.add('active');
  });
});

function getLetterGrade(pct) {
  if (pct === null) return 'N/A';
  if (pct >= 93) return 'A';
  if (pct >= 90) return 'A-';
  if (pct >= 87) return 'B+';
  if (pct >= 83) return 'B';
  if (pct >= 80) return 'B-';
  if (pct >= 77) return 'C+';
  if (pct >= 73) return 'C';
  if (pct >= 70) return 'C-';
  if (pct >= 60) return 'D';
  return 'F';
}

function calcClassStats(classId) {
  const items = state.assignments.filter(
    a => a.classId === classId && a.earned !== null && a.earned !== ''
  );
  if (items.length === 0) return { earned: 0, max: 0, pct: null, count: 0 };

  const earned = items.reduce((sum, a) => sum + Number(a.earned), 0);
  const max = items.reduce((sum, a) => sum + Number(a.max), 0);
  const pct = max > 0 ? Math.round((earned / max) * 1000) / 10 : null;

  return { earned, max, pct, count: items.length };
}

// Add Class Form
document.getElementById('class-form').addEventListener('submit', e => {
  e.preventDefault();
  state.classes.push({
    id: 'c' + Date.now(),
    name: document.getElementById('class-name').value.trim(),
    teacher: document.getElementById('class-teacher').value.trim(),
    color: document.getElementById('class-color').value
  });
  e.target.reset();
  saveState();
});

// Add Assignment Form
document.getElementById('assignment-form').addEventListener('submit', e => {
  e.preventDefault();
  state.assignments.push({
    id: 'a' + Date.now(),
    classId: document.getElementById('assign-class').value,
    title: document.getElementById('assign-title').value.trim(),
    due: document.getElementById('assign-due').value,
    earned: null,
    max: Number(document.getElementById('assign-max').value),
    done: false
  });
  e.target.reset();
  document.getElementById('assign-max').value = 100;
  saveState();
});

function toggleDone(id) {
  const item = state.assignments.find(a => a.id === id);
  if (item) item.done = !item.done;
  saveState();
}

function updateGrade(id, value) {
  const item = state.assignments.find(a => a.id === id);
  if (!item) return;
  item.earned = value === '' ? null : Number(value);
  if (item.earned !== null) item.done = true;
  saveState();
}

function deleteAssignment(id) {
  state.assignments = state.assignments.filter(a => a.id !== id);
  saveState();
}

function deleteClass(id) {
  state.classes = state.classes.filter(c => c.id !== id);
  state.assignments = state.assignments.filter(a => a.classId !== id);
  saveState();
}

function renderAll() {
  // Update Class Dropdown
  const select = document.getElementById('assign-class');
  select.innerHTML = state.classes
    .map(c => `<option value="${c.id}">${c.name}</option>`)
    .join('');

  // Render Class Cards
  const classList = document.getElementById('class-list');
  if (state.classes.length === 0) {
    classList.innerHTML = '<div class="empty-msg">No classes added yet.</div>';
  } else {
    classList.innerHTML = state.classes
      .map(c => {
        const stats = calcClassStats(c.id);
        const pending = state.assignments.filter(a => a.classId === c.id && !a.done).length;
        return `
          <div class="class-card">
            <div class="class-banner" style="background:${c.color}">
              <div>
                <h3>${c.name}</h3>
                <p>${c.teacher || 'General Course'}</p>
              </div>
              <div class="grade-pill">${
                stats.pct !== null ? stats.pct + '% (' + getLetterGrade(stats.pct) + ')' : 'No Grades'
              }</div>
            </div>
            <div class="class-body">
              <div><strong>${pending}</strong> pending assignment${pending === 1 ? '' : 's'}</div>
              <div>
                <button class="action-btn" onclick="deleteClass('${c.id}')">Remove Class</button>
              </div>
            </div>
          </div>
        `;
      })
      .join('');
  }

  // Render Assignments Table
  const assignTable = document.getElementById('assignment-table');
  if (state.assignments.length === 0) {
    assignTable.innerHTML = '<tr><td colspan="6" class="empty-msg">No assignments yet.</td></tr>';
  } else {
    assignTable.innerHTML = state.assignments
      .map(a => {
        const cls = state.classes.find(c => c.id === a.classId);
        return `
          <tr>
            <td><span class="badge ${a.done ? 'badge-done' : 'badge-pending'}">${
          a.done ? 'Done' : 'To Do'
        }</span></td>
            <td><strong>${a.title}</strong></td>
            <td>${cls ? cls.name : 'Unknown'}</td>
            <td>${a.due}</td>
            <td>
              <input class="grade-input" type="number" step="0.5" placeholder="—"
                value="${a.earned !== null ? a.earned : ''}"
                onchange="updateGrade('${a.id}', this.value)" /> / ${a.max}
            </td>
            <td>
              <button class="action-btn" onclick="toggleDone('${a.id}')">${
          a.done ? 'Undo' : 'Mark Done'
        }</button>
              <button class="action-btn" onclick="deleteAssignment('${a.id}')">Delete</button>
            </td>
          </tr>
        `;
      })
      .join('');
  }

  // Render Gradebook Table & Top Stats
  const gradeTable = document.getElementById('gradebook-table');
  let totalPctSum = 0;
  let gradedClasses = 0;

  gradeTable.innerHTML = state.classes
    .map(c => {
      const stats = calcClassStats(c.id);
      if (stats.pct !== null) {
        totalPctSum += stats.pct;
        gradedClasses++;
      }
      return `
        <tr>
          <td><strong>${c.name}</strong></td>
          <td>${c.teacher || '—'}</td>
          <td>${stats.count}</td>
          <td>${stats.count > 0 ? `${stats.earned} / ${stats.max}` : '—'}</td>
          <td><strong>${stats.pct !== null ? stats.pct + '%' : '—'}</strong></td>
          <td><strong>${getLetterGrade(stats.pct)}</strong></td>
        </tr>
      `;
    })
    .join('');

  document.getElementById('stat-avg').textContent =
    gradedClasses > 0 ? Math.round((totalPctSum / gradedClasses) * 10) / 10 + '%' : '—';
  document.getElementById('stat-pending').textContent = state.assignments.filter(
    a => !a.done
  ).length;
  document.getElementById('stat-completed').textContent = state.assignments.filter(
    a => a.done
  ).length;
}

// Initial render
renderAll();
