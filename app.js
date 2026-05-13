// ============================================================
// APP.JS — Lógica principal del sistema de asistencia
// ============================================================

let currentPanel = '';
let searchTimer = null;

// ---------- INICIALIZACIÓN ----------
document.addEventListener('DOMContentLoaded', () => {
  // Fecha en header
  const now = new Date();
  document.getElementById('headerDate').textContent =
    now.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Buscar en tiempo real
  document.getElementById('searchInput').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => applySearch(e.target.value), 250);
  });
});

// ---------- BUSCAR ----------
function clearSearch() {
  document.getElementById('searchInput').value = '';
  applySearch('');
}

function applySearch(query) {
  if (!currentPanel) return;
  showPanel(currentPanel, query.trim().toLowerCase());
}

// ---------- MOSTRAR PANEL ----------
function showPanel(tipo, filtro = '') {
  currentPanel = tipo;
  // Actualizar botón activo
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  event && event.target && event.target.closest('.nav-btn') &&
    event.target.closest('.nav-btn').classList.add('active');

  const registros = getRegistros();
  let alumnos = [];
  let titulo = '';
  let renderFn = renderListaAlumnos;

  switch(tipo) {
    case 'sinCredencial':
      titulo = '🪪 Alumnos Sin Credencial';
      alumnos = sortAlumnos(
        ALUMNOS_BASE.filter(a => {
          const r = registros.find(r => r.alumnoId === a.id && r.fecha === HOY);
          return r && r.asistencia !== 'falta' && r.credencial === false;
        })
      );
      break;

    case 'sinUniforme':
      titulo = '👕 Alumnos Sin Uniforme';
      alumnos = sortAlumnos(
        ALUMNOS_BASE.filter(a => {
          const r = registros.find(r => r.alumnoId === a.id && r.fecha === HOY);
          return r && r.asistencia !== 'falta' && r.uniforme === false;
        })
      );
      break;

    case 'enPlantel':
      titulo = '🏫 Alumnos en la Institución';
      alumnos = sortAlumnos(
        ALUMNOS_BASE.filter(a => {
          const r = registros.find(r => r.alumnoId === a.id && r.fecha === HOY);
          return r && (r.asistencia === 'presente' || r.asistencia === 'retardo');
        })
      );
      break;

    case 'todosRegistrados':
      titulo = '📋 Todos los Alumnos (por Semestre)';
      alumnos = sortPorSemestre(ALUMNOS_BASE);
      renderFn = renderListaTodos;
      break;

    case 'faltantes':
      titulo = '❌ Alumnos Faltantes';
      alumnos = sortAlumnos(
        ALUMNOS_BASE.filter(a => {
          const r = registros.find(r => r.alumnoId === a.id && r.fecha === HOY);
          return r && r.asistencia === 'falta';
        })
      );
      break;

    case 'registrar':
      titulo = '✏️ Registrar Alumnos';
      renderRegistrarPanel(filtro);
      return;

    case 'noRegistrados':
      titulo = '⏳ Alumnos Aún No Registrados';
      alumnos = sortAlumnos(
        ALUMNOS_BASE.filter(a => !registros.find(r => r.alumnoId === a.id && r.fecha === HOY))
      );
      renderNoRegistradosPanel(alumnos, filtro, titulo);
      return;
  }

  // Aplicar filtro de búsqueda
  if (filtro) {
    alumnos = alumnos.filter(a =>
      nombreCompleto(a).toLowerCase().includes(filtro) ||
      a.grupo.toLowerCase().includes(filtro)
    );
  }

  setPanelHeader(titulo, alumnos.length);
  const html = alumnos.length === 0
    ? emptyState()
    : renderFn(alumnos, registros);
  document.getElementById('panelBody').innerHTML = html;
  animateCards();
}

// ---------- RENDER LISTA BÁSICA ----------
function renderListaAlumnos(alumnos, registros) {
  return `<div class="student-list">${alumnos.map(a => {
    const r = registros.find(r => r.alumnoId === a.id && r.fecha === HOY);
    return studentCard(a, r);
  }).join('')}</div>`;
}

function studentCard(a, r) {
  const asistBadge = r ? badgeAsistencia(r.asistencia) : '';
  const credBadge = r ? `<span class="badge ${r.credencial ? 'badge-ok' : 'badge-no'}">${r.credencial ? '✓ Credencial' : '✗ Credencial'}</span>` : '';
  const unifBadge = r ? `<span class="badge ${r.uniforme ? 'badge-ok' : 'badge-no'}">${r.uniforme ? '✓ Uniforme' : '✗ Uniforme'}</span>` : '';

  return `
  <div class="student-card">
    <div class="student-info">
      <div class="student-name">${nombreCompleto(a)}</div>
      <div class="student-meta">
        <span class="student-group">${a.grupo}</span>
        ${r ? `<span class="student-date">📅 ${r.fecha}</span>` : ''}
        ${asistBadge}${credBadge}${unifBadge}
      </div>
    </div>

    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <button class="btn-historial" onclick="verHistorial(${a.id})">
        📜 Historial
      </button>

      <button class="btn-save" onclick="mostrarMasInfo(${a.id})">
        ℹ️ Más info
      </button>

      <button class="btn-faltante" onclick="borrarAlumno(${a.id})">
        🗑 Eliminar
      </button>
    </div>
  </div>`;
}

// ---------- RENDER LISTA TODOS (por semestre) ----------
function renderListaTodos(alumnos, registros) {
  let html = '<div class="student-list">';
  let grupoActual = '';
  alumnos.forEach(a => {
    if (a.grupo !== grupoActual) {
      grupoActual = a.grupo;
      html += `<div style="color:#BBDEFB;font-weight:800;font-family:'Rajdhani',sans-serif;
               font-size:1.05rem;padding:10px 4px 4px;letter-spacing:1px;
               border-bottom:1px solid rgba(255,255,255,0.2);margin-bottom:4px;">
               🗂 Grupo ${grupoActual}</div>`;
    }
    const r = registros.find(r => r.alumnoId === a.id && r.fecha === HOY);
    html += studentCard(a, r);
  });
  html += '</div>';
  return html;
}

// ---------- RENDER REGISTRAR ----------
function renderRegistrarPanel(filtro = '') {
  setPanelHeader('✏️ Registrar Alumnos', null);
  const registros = getRegistros();

  let alumnosFiltrados = ALUMNOS_BASE;
  if (filtro) {
    alumnosFiltrados = ALUMNOS_BASE.filter(a =>
      nombreCompleto(a).toLowerCase().includes(filtro) ||
      a.grupo.toLowerCase().includes(filtro)
    );
  }

  let cardsHTML = '';
  if (alumnosFiltrados.length > 0) {
    cardsHTML = alumnosFiltrados.map(a => {
      const r = registros.find(r => r.alumnoId === a.id && r.fecha === HOY) || {};
      const asistChecked = r.asistencia === 'presente' ? 'checked' : '';
      const credChecked = r.credencial ? 'checked' : '';
      const unifChecked = r.uniforme ? 'checked' : '';
      return `
      <div class="register-card" id="regcard-${a.id}">
        <div class="register-name">${nombreCompleto(a)} <span style="font-size:0.78rem;font-weight:600;
          background:var(--azul-fuerte);color:#fff;padding:2px 8px;border-radius:20px;
          margin-left:6px;">${a.grupo}</span></div>
        <div class="register-actions">
          <label class="check-btn ${r.asistencia === 'presente' || r.asistencia === 'retardo' ? 'checked' : ''}" id="lbl-asist-${a.id}">
            <input type="checkbox" id="chk-asist-${a.id}" ${asistChecked}
              onchange="updateCheckStyle(${a.id},'asist')"> 🏫 Asistencia
          </label>
          <label class="check-btn ${r.credencial ? 'checked' : ''}" id="lbl-cred-${a.id}">
            <input type="checkbox" id="chk-cred-${a.id}" ${credChecked}
              onchange="updateCheckStyle(${a.id},'cred')"> 🪪 Credencial
          </label>
          <label class="check-btn ${r.uniforme ? 'checked' : ''}" id="lbl-unif-${a.id}">
            <input type="checkbox" id="chk-unif-${a.id}" ${unifChecked}
              onchange="updateCheckStyle(${a.id},'unif')"> 👕 Uniforme
          </label>
          <button class="btn-save" onclick="guardarAlumno(${a.id})">💾 Guardar</button>
          <button class="btn-ver-historial" onclick="verHistorial(${a.id})">📜 Historial</button>
        </div>
      </div>`;
    }).join('');
  } else {
    cardsHTML = '<div style="color:rgba(255,255,255,0.6);text-align:center;padding:30px;">No se encontraron alumnos.</div>';
  }

  document.getElementById('panelBody').innerHTML = `
  <div class="registrar-section">
    <div class="registrar-search-box">
      <label>🔎 Buscar alumno para registrar:</label>
      <input type="text" class="registrar-search-input" id="regSearch"
        placeholder="Escribe nombre, apellido o grupo..."
        value="${filtro}"
        oninput="buscarParaRegistrar(this.value)">
    </div>
    <div class="register-results">${cardsHTML}</div>
  </div>`;
  animateCards();
}

function buscarParaRegistrar(val) {
  renderRegistrarPanel(val.trim().toLowerCase());
}

function updateCheckStyle(id, tipo) {
  const map = { asist: 'asist', cred: 'cred', unif: 'unif' };
  const chkId = `chk-${tipo === 'asist' ? 'asist' : tipo === 'cred' ? 'cred' : 'unif'}-${id}`;
  const lblId = `lbl-${tipo === 'asist' ? 'asist' : tipo === 'cred' ? 'cred' : 'unif'}-${id}`;
  const chk = document.getElementById(chkId);
  const lbl = document.getElementById(lblId);
  if (chk && lbl) lbl.classList.toggle('checked', chk.checked);
}

function guardarAlumno(id) {
  const asist = document.getElementById(`chk-asist-${id}`)?.checked;
  const cred = document.getElementById(`chk-cred-${id}`)?.checked;
  const unif = document.getElementById(`chk-unif-${id}`)?.checked;
  const asistVal = asist ? 'presente' : 'falta';
  guardarRegistro(id, asistVal, cred || false, unif || false);
  showToast('✅ Registro guardado correctamente');
}

// ---------- RENDER NO REGISTRADOS ----------
function renderNoRegistradosPanel(alumnos, filtro, titulo) {
  let lista = alumnos;
  if (filtro) {
    lista = lista.filter(a =>
      nombreCompleto(a).toLowerCase().includes(filtro) ||
      a.grupo.toLowerCase().includes(filtro)
    );
  }

  setPanelHeader(titulo, lista.length);
  if (lista.length === 0) {
    document.getElementById('panelBody').innerHTML = emptyState('¡Todos los alumnos han sido registrados hoy!');
    return;
  }

  const html = `<div class="student-list">${lista.map(a => `
    <div class="no-reg-card">
      <div class="no-reg-info">
        <div class="no-reg-name">${nombreCompleto(a)}</div>
        <span class="no-reg-group">${a.grupo}</span>
      </div>
      <div class="no-reg-actions">
        <button class="btn-retardo" onclick="registrarRetardo(${a.id})">⏰ Registrar Retardo</button>
        <button class="btn-faltante" onclick="registrarFalta(${a.id})">❌ Marcar Faltante</button>
        <button class="btn-historial" onclick="verHistorial(${a.id})">📜 Historial</button>
      </div>
    </div>`).join('')}</div>`;

  document.getElementById('panelBody').innerHTML = html;
  animateCards();
}

function registrarRetardo(id) {
  guardarRegistro(id, 'retardo', false, false);
  showToast('⏰ Alumno registrado con retardo');
  showPanel('noRegistrados');
}

function registrarFalta(id) {
  guardarRegistro(id, 'falta', false, false);
  showToast('❌ Alumno marcado como faltante');
  showPanel('noRegistrados');
}

// ---------- HISTORIAL ----------
function verHistorial(alumnoId) {
  const alumno = ALUMNOS_BASE.find(a => a.id === alumnoId);
  if (!alumno) return;

  const historial = getHistorial().filter(h => h.alumnoId === alumnoId);

  document.getElementById('modalTitle').textContent = `📜 Historial — ${nombreCompleto(alumno)}`;

  if (historial.length === 0) {
    document.getElementById('modalBody').innerHTML =
      '<p style="color:#546E7A;text-align:center;padding:20px;">No hay registros previos para este alumno.</p>';
  } else {
    const filas = historial
      .sort((a, b) => new Date(b.fecha.split('/').reverse().join('-')) - new Date(a.fecha.split('/').reverse().join('-')))
      .map(h => `
      <tr>
        <td>📅 ${h.fecha}</td>
        <td>${badgeAsistenciaText(h.asistencia)}</td>
        <td>${h.credencial ? '✅ Sí' : '❌ No'}</td>
        <td>${h.uniforme ? '✅ Sí' : '❌ No'}</td>
      </tr>`).join('');

    document.getElementById('modalBody').innerHTML = `
    <table class="historial-table">
      <thead><tr>
        <th>Fecha</th><th>Asistencia</th><th>Credencial</th><th>Uniforme</th>
      </tr></thead>
      <tbody>${filas}</tbody>
    </table>`;
  }

  document.getElementById('modalHistorial').classList.add('open');
}

function closeModal() {
  document.getElementById('modalHistorial').classList.remove('open');
}

// ---------- EXPORTAR EXCEL ----------
function exportarExcel() {
  const registros = getRegistros();
  const rows = [['Apellido Paterno', 'Apellido Materno', 'Nombre', 'Grupo', 'Fecha',
                  'Asistencia', 'Credencial', 'Uniforme']];

  sortAlumnos(ALUMNOS_BASE).forEach(a => {
    const r = registros.find(r => r.alumnoId === a.id && r.fecha === HOY);
    rows.push([
      a.apPaterno,
      a.apMaterno,
      a.nombre,
      a.grupo,
      r ? r.fecha : 'Sin registro',
      r ? r.asistencia : 'N/A',
      r ? (r.credencial ? 'Sí' : 'No') : 'N/A',
      r ? (r.uniforme ? 'Sí' : 'No') : 'N/A',
    ]);
  });

  // Crear CSV como fallback si no hay librería xlsx
  const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `asistencia_${HOY.replace(/\//g, '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('📥 Archivo Excel descargado');
}

// ---------- UTILIDADES ----------
function setPanelHeader(titulo, count) {
  document.getElementById('panelTitle').textContent = titulo;
  document.getElementById('panelCount').textContent =
    count !== null ? `${count} alumno${count !== 1 ? 's' : ''}` : '';
}

function badgeAsistencia(tipo) {
  const map = {
    'presente': '<span class="badge badge-ok">✓ Presente</span>',
    'retardo':  '<span class="badge badge-retardo">⏰ Retardo</span>',
    'falta':    '<span class="badge badge-falta">✗ Falta</span>',
  };
  return map[tipo] || '';
}

function badgeAsistenciaText(tipo) {
  const map = { presente: '✓ Presente', retardo: '⏰ Retardo', falta: '✗ Falta' };
  return map[tipo] || tipo;
}

function emptyState(msg = 'No hay alumnos que coincidan.') {
  return `<div class="empty-state">
    <div class="empty-state-icon">🔍</div>
    <p>${msg}</p>
  </div>`;
}

function animateCards() {
  document.querySelectorAll('.student-card, .register-card, .no-reg-card').forEach((c, i) => {
    c.style.animationDelay = `${i * 40}ms`;
  });
}

function showToast(msg) {
  const old = document.querySelector('.toast');
  if (old) old.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function mostrarMasInfo(alumnoId) {
  const alumno = ALUMNOS_BASE.find(a => a.id === alumnoId);
  if (!alumno) return;

  const historial = getHistorial().filter(h => h.alumnoId === alumnoId);

  const asistencias = historial.filter(h => h.asistencia === 'presente' || h.asistencia === 'retardo').length;
  const faltas = historial.filter(h => h.asistencia === 'falta').length;

  document.getElementById('modalTitle').textContent = 'ℹ️ Información del Alumno';

  document.getElementById('modalBody').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div><strong>Nombre completo:</strong> ${nombreCompleto(alumno)}</div>
      <div><strong>CURP:</strong> ${alumno.curp || 'No registrada'}</div>
      <div><strong>Número de control:</strong> ${alumno.numeroControl || 'No registrado'}</div>
      <div><strong>Total asistencias:</strong> ${asistencias}</div>
      <div><strong>Total faltas:</strong> ${faltas}</div>
    </div>

    <hr style="margin:20px 0;">

    <h4>📜 Historial de asistencias</h4>

    <table class="historial-table">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Asistencia</th>
          <th>Credencial</th>
          <th>Uniforme</th>
        </tr>
      </thead>
      <tbody>
        ${historial.map(h => `
          <tr>
            <td>${h.fecha}</td>
            <td>${badgeAsistenciaText(h.asistencia)}</td>
            <td>${h.credencial ? '✅ Sí' : '❌ No'}</td>
            <td>${h.uniforme ? '✅ Sí' : '❌ No'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  document.getElementById('modalHistorial').classList.add('open');
}

function mostrarFormularioAlumno() {
  document.getElementById('modalAlumno').classList.add('open');
}

function cerrarModalAlumno() {
  document.getElementById('modalAlumno').classList.remove('open');
}

function guardarNuevoAlumno() {
  const nombre = document.getElementById('nuevoNombre').value.trim();
  const curp = document.getElementById('nuevoCurp').value.trim();
  const control = document.getElementById('nuevoControl').value.trim();

  if (!nombre || !curp || !control) {
    showToast('⚠️ Completa todos los campos');
    return;
  }

  agregarAlumno(nombre, curp, control);

  cerrarModalAlumno();

  document.getElementById('nuevoNombre').value = '';
  document.getElementById('nuevoCurp').value = '';
  document.getElementById('nuevoControl').value = '';

  showToast('✅ Alumno agregado correctamente');

  showPanel('todosRegistrados');
}

function borrarAlumno(id) {
  const alumno = ALUMNOS_BASE.find(a => a.id === id);
  if (!alumno) return;

  const confirmar = confirm(`¿Deseas eliminar a ${nombreCompleto(alumno)}?`);

  if (!confirmar) return;

  eliminarAlumno(id);

  showToast('🗑 Alumno eliminado correctamente');

  showPanel(currentPanel || 'todosRegistrados');
}