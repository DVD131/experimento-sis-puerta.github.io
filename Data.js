// ============================================================
// DATA.JS — Base de datos de alumnos y asistencias
// ============================================================

// Fecha actual para registros del día
const HOY = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });

// ---- CATÁLOGO DE ALUMNOS ----
// Formato: { id, apPaterno, apMaterno, nombre, grupo }
// Grupos: 6A2, 6A1, 5B2, 5B1, 4C2, 4C1, 3D2, 3D1, 2E2, 2E1, 1F2, 1F1
const ALUMNOS_BASE = [
  { id: 1,  apPaterno: "Alvarado",    apMaterno: "Benítez",   nombre: "Carlos",    grupo: "6A2" },
  { id: 2,  apPaterno: "Bernal",      apMaterno: "Cruz",      nombre: "Sofía",     grupo: "6A1" },
  { id: 3,  apPaterno: "Campos",      apMaterno: "Díaz",      nombre: "Andrés",    grupo: "5B2" },
  { id: 4,  apPaterno: "Domínguez",   apMaterno: "Espinosa",  nombre: "Valeria",   grupo: "5B1" },
  { id: 5,  apPaterno: "Estrada",     apMaterno: "Flores",    nombre: "Miguel",    grupo: "4C2" },
  { id: 6,  apPaterno: "Fuentes",     apMaterno: "García",    nombre: "Daniela",   grupo: "4C1" },
  { id: 7,  apPaterno: "García",      apMaterno: "Hernández", nombre: "Luis",      grupo: "3D2" },
  { id: 8,  apPaterno: "Hernández",   apMaterno: "Jiménez",   nombre: "Mariana",   grupo: "3D1" },
  { id: 9,  apPaterno: "Ibarra",      apMaterno: "López",     nombre: "Rodrigo",   grupo: "2E2" },
  { id: 10, apPaterno: "Jiménez",     apMaterno: "Martínez",  nombre: "Ana",       grupo: "2E1" },
  { id: 11, apPaterno: "López",       apMaterno: "Mendoza",   nombre: "Fernando",  grupo: "1F2" },
  { id: 12, apPaterno: "Martínez",    apMaterno: "Morales",   nombre: "Laura",     grupo: "1F1" },
  { id: 13, apPaterno: "Mendoza",     apMaterno: "Núñez",     nombre: "Jorge",     grupo: "6A2" },
  { id: 14, apPaterno: "Morales",     apMaterno: "Ortega",    nombre: "Paola",     grupo: "6A1" },
  { id: 15, apPaterno: "Núñez",       apMaterno: "Pérez",     nombre: "Diego",     grupo: "5B2" },
  { id: 16, apPaterno: "Ortega",      apMaterno: "Ramírez",   nombre: "Claudia",   grupo: "5B1" },
  { id: 17, apPaterno: "Pérez",       apMaterno: "Reyes",     nombre: "Eduardo",   grupo: "4C2" },
  { id: 18, apPaterno: "Ramírez",     apMaterno: "Rivera",    nombre: "Natalia",   grupo: "4C1" },
  { id: 19, apPaterno: "Reyes",       apMaterno: "Rodríguez", nombre: "Alejandro", grupo: "3D2" },
  { id: 20, apPaterno: "Rivera",      apMaterno: "Ruiz",      nombre: "Isabel",    grupo: "3D1" },
  { id: 21, apPaterno: "Rodríguez",   apMaterno: "Sánchez",   nombre: "Gabriel",   grupo: "2E2" },
  { id: 22, apPaterno: "Ruiz",        apMaterno: "Torres",    nombre: "Mónica",    grupo: "2E1" },
  { id: 23, apPaterno: "Sánchez",     apMaterno: "Vargas",    nombre: "Arturo",    grupo: "1F2" },
  { id: 24, apPaterno: "Torres",      apMaterno: "Vega",      nombre: "Rebeca",    grupo: "1F1" },
  { id: 25, apPaterno: "Vargas",      apMaterno: "Velázquez", nombre: "Hugo",      grupo: "6A2" },
  { id: 26, apPaterno: "Velázquez",   apMaterno: "Aguilar",   nombre: "Carmen",    grupo: "6A1" },
  { id: 27, apPaterno: "Aguilar",     apMaterno: "Alvarado",  nombre: "Javier",    grupo: "5B2" },
  { id: 28, apPaterno: "Castillo",    apMaterno: "Bernal",    nombre: "Gabriela",  grupo: "5B1" },
  { id: 29, apPaterno: "Delgado",     apMaterno: "Campos",    nombre: "Óscar",     grupo: "4C2" },
  { id: 30, apPaterno: "Gutiérrez",   apMaterno: "Delgado",   nombre: "Patricia",  grupo: "4C1" },
];

// ---- REGISTROS DEL DÍA ----
// Se almacena en localStorage. Estructura:
// { alumnoId, fecha, asistencia: 'presente'|'retardo'|'falta', credencial: bool, uniforme: bool }
function getRegistros() {
  try { return JSON.parse(localStorage.getItem('registros') || '[]'); } catch(e) { return []; }
}

function setRegistros(arr) {
  localStorage.setItem('registros', JSON.stringify(arr));
}

function getHistorial() {
  try { return JSON.parse(localStorage.getItem('historial') || '[]'); } catch(e) { return []; }
}

function setHistorial(arr) {
  localStorage.setItem('historial', JSON.stringify(arr));
}

// Obtener registro de HOY para un alumno
function getRegistroHoy(alumnoId) {
  return getRegistros().find(r => r.alumnoId === alumnoId && r.fecha === HOY) || null;
}

// Guardar o actualizar registro del día
function guardarRegistro(alumnoId, asistencia, credencial, uniforme) {
  let registros = getRegistros();
  let historial = getHistorial();
  const idx = registros.findIndex(r => r.alumnoId === alumnoId && r.fecha === HOY);
  const reg = { alumnoId, fecha: HOY, asistencia, credencial, uniforme };

  if (idx >= 0) { registros[idx] = reg; }
  else { registros.push(reg); }
  setRegistros(registros);

  // También actualizar historial
  const hidx = historial.findIndex(h => h.alumnoId === alumnoId && h.fecha === HOY);
  if (hidx >= 0) { historial[hidx] = reg; }
  else { historial.push(reg); }
  setHistorial(historial);
}

// Nombre completo de alumno
function nombreCompleto(a) {
  return `${a.apPaterno} ${a.apMaterno}, ${a.nombre}`;
}

// Ordenar alfabéticamente por apPaterno, apMaterno, nombre
function sortAlumnos(arr) {
  return [...arr].sort((a, b) => {
    const ka = `${a.apPaterno}${a.apMaterno}${a.nombre}`;
    const kb = `${b.apPaterno}${b.apMaterno}${b.nombre}`;
    return ka.localeCompare(kb, 'es');
  });
}

// Ordenar por semestre (grupo) desc (6→1) y terminación 2 antes 1
function sortPorSemestre(arr) {
  const semNum = g => parseInt(g[0]);
  const termNum = g => parseInt(g[g.length - 1]);
  return [...arr].sort((a, b) => {
    const sa = semNum(a.grupo), sb = semNum(b.grupo);
    if (sb !== sa) return sb - sa;
    return termNum(b.grupo) - termNum(a.grupo);
  });
}

// Inicializar datos demo para hoy (algunos alumnos ya registrados)
function initDemoData() {
  if (getRegistros().length > 0) return; // ya hay datos
  const demos = [
    { id: 1, asistencia: 'presente', credencial: false, uniforme: true },
    { id: 2, asistencia: 'presente', credencial: true,  uniforme: false },
    { id: 3, asistencia: 'retardo',  credencial: true,  uniforme: true },
    { id: 4, asistencia: 'presente', credencial: true,  uniforme: true },
    { id: 5, asistencia: 'falta',    credencial: false, uniforme: false },
    { id: 7, asistencia: 'presente', credencial: false, uniforme: false },
    { id: 9, asistencia: 'presente', credencial: true,  uniforme: true },
    { id: 11, asistencia: 'retardo', credencial: false, uniforme: true },
    { id: 13, asistencia: 'presente', credencial: true, uniforme: true },
    { id: 15, asistencia: 'presente', credencial: true, uniforme: false },
    { id: 17, asistencia: 'presente', credencial: false, uniforme: true },
    { id: 19, asistencia: 'falta',   credencial: false, uniforme: false },
    { id: 21, asistencia: 'presente', credencial: true, uniforme: true },
    { id: 25, asistencia: 'presente', credencial: true, uniforme: true },
  ];
  demos.forEach(d => guardarRegistro(d.id, d.asistencia, d.credencial, d.uniforme));
}

function agregarAlumno(nombreCompleto, curp, numeroControl) {
  const partes = nombreCompleto.trim().split(' ');

  const nombre = partes.pop() || '';
  const apMaterno = partes.pop() || '';
  const apPaterno = partes.join(' ') || '';

  const nuevoAlumno = {
    id: Date.now(),
    apPaterno,
    apMaterno,
    nombre,
    grupo: 'N/A',
    curp,
    numeroControl
  };

  ALUMNOS_BASE.push(nuevoAlumno);
  guardarAlumnos();
}

function eliminarAlumno(id) {
  ALUMNOS_BASE = ALUMNOS_BASE.filter(a => a.id !== id);
  guardarAlumnos();

  let registros = getRegistros().filter(r => r.alumnoId !== id);
  setRegistros(registros);

  let historial = getHistorial().filter(h => h.alumnoId !== id);
  setHistorial(historial);
}

initDemoData();