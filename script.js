/* app.js
   Programa de organización y gestión de la información
   - Guarda datos en localStorage (clave: 'orggest_records')
   - Soporta CRUD, búsqueda, filtros, export/import JSON y reporte simple
*/

/* ====================
   Utilidades y estado
   ==================== */
const STORAGE_KEY = 'orggest_records';

let state = {
  records: [],
  editingId: null
};

/* ====================
   Elementos DOM
   ==================== */
const form = document.getElementById('record-form');
const titleInput = document.getElementById('title');
const categoryInput = document.getElementById('category');
const ownerInput = document.getElementById('owner');
const dateInput = document.getElementById('date');
const descInput = document.getElementById('description');
const btnReset = document.getElementById('btn-reset');

const recordsContainer = document.getElementById('records-container');
const emptyMsg = document.getElementById('empty-msg');

const searchInput = document.getElementById('search');
const filterCategory = document.getElementById('filter-category');
const sortBy = document.getElementById('sort-by');

const btnExport = document.getElementById('btn-export');
const importFile = document.getElementById('import-file');
const btnClear = document.getElementById('btn-clear');
const btnReport = document.getElementById('btn-report');

const modalGuide = document.getElementById('modal-guide');
const modalCredits = document.getElementById('modal-credits');
const modalReport = document.getElementById('modal-report');
const btnOpenGuide = document.getElementById('btn-open-guide');
const btnOpenCredits = document.getElementById('btn-open-credits');

/* ====================
   Almacenamiento
   ==================== */
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    state.records = raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error leyendo localStorage', e);
    state.records = [];
  }
}
function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.records));
}

/* ====================
   Renderizado
   ==================== */
function renderRecords() {
  const q = (searchInput.value || '').trim().toLowerCase();
  const cat = filterCategory.value;
  const sortVal = sortBy.value;

  let list = [...state.records];

  if (cat) list = list.filter(r => r.category === cat);

  if (q) {
    list = list.filter(r =>
      (r.title || '').toLowerCase().includes(q) ||
      (r.owner || '').toLowerCase().includes(q) ||
      (r.description || '').toLowerCase().includes(q)
    );
  }

  // Sorting
  list.sort((a,b) => {
    if (sortVal === 'date-desc') return (b.date||'').localeCompare(a.date||'');
    if (sortVal === 'date-asc') return (a.date||'').localeCompare(b.date||'');
    if (sortVal === 'title-asc') return (a.title||'').localeCompare(b.title||'');
    if (sortVal === 'title-desc') return (b.title||'').localeCompare(a.title||'');
    return 0;
  });

  recordsContainer.innerHTML = '';
  if (!list.length) {
    emptyMsg.style.display = 'block';
    return;
  } else {
    emptyMsg.style.display = 'none';
  }

  list.forEach(r => {
    const node = document.createElement('article');
    node.className = 'record';
    node.dataset.id = r.id;

    node.innerHTML = `
      <div class="meta">
        <h4>${escapeHtml(r.title)}</h4>
        <div class="small">${escapeHtml(r.category)} • ${r.date || 'Sin fecha'}</div>
        <div class="small">Responsable: ${escapeHtml(r.owner || '—')}</div>
        <div class="small" style="margin-top:8px">${escapeHtml(truncate(r.description || '', 200))}</div>
      </div>
      <div class="actions">
        <button class="icon-btn" title="Editar" data-action="edit">✎</button>
        <button class="icon-btn" title="Eliminar" data-action="delete">🗑️</button>
        <button class="icon-btn" title="Ver JSON" data-action="view">📄</button>
      </div>
    `;

    // listeners
    node.querySelector('[data-action="edit"]').addEventListener('click', () => startEdit(r.id));
    node.querySelector('[data-action="delete"]').addEventListener('click', () => {
      if (confirm(`¿Eliminar "${r.title}"? Esta acción es irreversible.`)) removeRecord(r.id);
    });
    node.querySelector('[data-action="view"]').addEventListener('click', () => {
      alert(JSON.stringify(r, null, 2));
    });

    recordsContainer.appendChild(node);
  });
}

/* ====================
   CRUD
   ==================== */
function addRecord(data) {
  const newRec = { id: 'r' + Date.now(), ...data, createdAt: new Date().toISOString() };
  state.records.push(newRec);
  saveToStorage();
  renderRecords();
  return newRec;
}

function updateRecord(id, newData) {
  const idx = state.records.findIndex(r => r.id === id);
  if (idx >= 0) {
    state.records[idx] = { ...state.records[idx], ...newData, updatedAt: new Date().toISOString() };
    saveToStorage();
    renderRecords();
  }
}

function removeRecord(id) {
  state.records = state.records.filter(r => r.id !== id);
  saveToStorage();
  renderRecords();
  // if we were editing that record, reset form
  if (state.editingId === id) {
    resetForm();
  }
}

/* ====================
   Form handling
   ==================== */
form.addEventListener('submit', e => {
  e.preventDefault();
  const data = readForm();
  // validation minimal: title + category
  if (!data.title || !data.category) {
    alert('Por favor completa los campos requeridos: Título y Categoría.');
    return;
  }

  if (state.editingId) {
    updateRecord(state.editingId, data);
    state.editingId = null;
    document.getElementById('btn-save').textContent = 'Guardar';
  } else {
    addRecord(data);
  }
  resetForm();
});

btnReset.addEventListener('click', resetForm);

function readForm() {
  return {
    title: titleInput.value.trim(),
    category: categoryInput.value,
    owner: ownerInput.value.trim(),
    date: dateInput.value || '',
    description: descInput.value.trim()
  };
}

function resetForm() {
  form.reset();
  state.editingId = null;
  document.getElementById('btn-save').textContent = 'Guardar';
}

/* ====================
   Edit flow
   ==================== */
function startEdit(id) {
  const r = state.records.find(x => x.id === id);
  if (!r) return;
  state.editingId = id;
  titleInput.value = r.title || '';
  categoryInput.value = r.category || '';
  ownerInput.value = r.owner || '';
  dateInput.value = r.date || '';
  descInput.value = r.description || '';
  document.getElementById('btn-save').textContent = 'Actualizar';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ====================
   Search / filters
   ==================== */
searchInput.addEventListener('input', () => renderRecords());
filterCategory.addEventListener('change', () => renderRecords());
sortBy.addEventListener('change', () => renderRecords());

/* ====================
   Export / Import / Clear
   ==================== */
btnExport.addEventListener('click', () => {
  const dataStr = JSON.stringify(state.records, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `orggest_records_${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

importFile.addEventListener('change', (e) => {
  const f = e.target.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const parsed = JSON.parse(evt.target.result);
      if (!Array.isArray(parsed)) throw new Error('El archivo no contiene una lista válida.');
      // Merge: add imported records but preserve IDs (or assign new ids if missing)
      const imported = parsed.map(p => ({
        id: p.id || ('r' + Date.now() + Math.floor(Math.random()*1000)),
        title: p.title || 'Sin título',
        category: p.category || 'Otro',
        owner: p.owner || '',
        date: p.date || '',
        description: p.description || '',
        createdAt: p.createdAt || new Date().toISOString()
      }));
      // ask user whether to merge or replace
      const choice = confirm('¿Deseas reemplazar todos los registros con los datos importados? Pulsa OK para REEMPLAZAR, Cancelar para MERGE (añadir).');
      if (choice) {
        state.records = imported;
      } else {
        // append but avoid duplicates by id
        const existingIds = new Set(state.records.map(r=>r.id));
        imported.forEach(r => { if (!existingIds.has(r.id)) state.records.push(r); });
      }
      saveToStorage();
      renderRecords();
      alert('Importación finalizada.');
    } catch (err) {
      alert('Error importando archivo JSON: ' + err.message);
    }
  };
  reader.readAsText(f);
  // reset input
  importFile.value = '';
});

btnClear.addEventListener('click', () => {
  if (confirm('¿Borrar todos los registros? Esta acción no se puede deshacer.')) {
    state.records = [];
    saveToStorage();
    renderRecords();
  }
});

/* ====================
   Report
   ==================== */
btnReport.addEventListener('click', () => {
  const byCat = state.records.reduce((acc,r) => {
    acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, {});
  let html = `<p>Total de registros: <b>${state.records.length}</b></p>`;
  if (Object.keys(byCat).length) {
    html += `<ul>`;
    for (const k of Object.keys(byCat)) {
      html += `<li>${escapeHtml(k)}: <b>${byCat[k]}</b></li>`;
    }
    html += `</ul>`;
  } else {
    html += `<p>No hay datos para mostrar.</p>`;
  }
  document.getElementById('report-body').innerHTML = html;
  openModal(modalReport);
});

/* ====================
   Modal helpers
   ==================== */
function openModal(modal) {
  modal.setAttribute('aria-hidden', 'false');
}
function closeModal(modal) {
  modal.setAttribute('aria-hidden', 'true');
}
document.querySelectorAll('.modal-close').forEach(b => b.addEventListener('click', (e) => {
  const modal = e.target.closest('.modal');
  if (modal) closeModal(modal);
}));
btnOpenGuide.addEventListener('click', () => openModal(modalGuide));
btnOpenCredits.addEventListener('click', () => openModal(modalCredits));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal[aria-hidden="false"]').forEach(m => closeModal(m));
  }
});

/* Close modals when clicking outside content */
document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal(modal);
  });
});

/* ====================
   Boot
   ==================== */
function boot() {
  loadFromStorage();
  renderRecords();
}
boot();

/* ====================
   Small helpers
   ==================== */
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
}
function truncate(s, n=140) {
  return s.length > n ? s.slice(0,n) + '…' : s;
}
