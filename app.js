// ===============================
// APP v13 - Simulador de preguntas (con múltiples tipos)
// ===============================

// --- Config y estado ---
const MATERIA_URL = 'preguntas/gestion_proyectos.json';
const CANTIDAD_EXAMEN = 30;
const MATERIA_NOMBRE = 'gestion_proyectos';

const estado = document.getElementById('estado');
const contenedor = document.getElementById('contenedor');
const timerEl = document.getElementById('timer');

const btnEmpezar = document.getElementById('btnEmpezar');
const btnGuardar = document.getElementById('btnGuardar'); 
const btnCargar = document.getElementById('btnCargar'); 

const modoSel = document.getElementById('modo');
const minutosSel = document.getElementById('minutos');

let banco = []; 
let ronda = []; 
let idx = 0;
let correctas = 0;
let respuestas = [];
let interval = null;

// --- Utils ---
function shuffle(a){ const b=a.slice(); for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [b[i],b[j]]=[b[j],b[i]];} return b; }
function sample(a,n){ return shuffle(a).slice(0, Math.min(n, a.length)); }
function fmt(seg){ const m=Math.floor(seg/60).toString().padStart(2,'0'); const s=(seg%60).toString().padStart(2,'0'); return `${m}:${s}`; }

async function cargarMateria(){
  const res = await fetch(MATERIA_URL); 
  if(!res.ok) throw new Error('No pude cargar el banco de preguntas');
  const data = await res.json();
  if(!Array.isArray(data)) throw new Error('El JSON de preguntas debe ser un arreglo');
  return data;
}

// --- Lógica y Render ---

function iniciarTimer(){
  clearInterval(interval);
  let seg = parseInt(minutosSel.value,10)*60;
  if (seg <= 0){ timerEl.textContent = 'Sin tiempo'; return; }
  timerEl.textContent = fmt(seg);
  interval = setInterval(()=>{
    seg--; timerEl.textContent = fmt(seg);
    if(seg<=0){ clearInterval(interval); finalizar(true); }
  },1000);
}

function mostrarPregunta(){
  if (idx >= ronda.length) { finalizar(false); return; }
  const q = ronda[idx];
  const tipo = q.tipo || 'multiple';

  contenedor.innerHTML = `
    <div class="space-y-4 animate-fade-in">
      <!-- Caja de la pregunta -->
      <div class="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
        <div class="flex items-center gap-2 mb-3">
          <span class="pill text-sm font-semibold">📋 Pregunta ${idx+1} / ${ronda.length}</span>
          <span class="pill-secondary text-xs">${getTipoLabel(tipo)}</span>
        </div>
        <h2 class="text-xl font-bold text-gray-800">${q.pregunta}</h2>
        ${q.imagen ? `
        <div class="flex justify-center mt-4">
          <img src="${q.imagen}" alt="Imagen de la pregunta"
                class="img-pregunta">
        </div>
        ` : ''}
      </div>

      <!-- Opciones según tipo -->
      <div id="opciones" class="space-y-3"></div>

      <!-- Feedback -->
      <div id="feedback" class="mt-4"></div>

      <!-- Botones de navegación -->
      <div class="bg-white rounded-xl shadow-lg p-4 border-2 border-gray-200 flex flex-wrap gap-3">
        <button id="btnPrev" class="btn btn-ghost"
                ${idx===0 ? "disabled" : ""}>⬅️ Anterior</button>
        <button id="btnNext" class="btn btn-ghost">
          Siguiente ➡️
        </button>
        <button id="btnFin" class="btn btn-primary ml-auto">
          ✅ Finalizar
        </button>
      </div>
    </div>
  `;

  // Renderizar según tipo de pregunta
  renderizarSegunTipo(q, tipo);

  document.getElementById('btnPrev').onclick = () => { if (idx>0) { idx--; mostrarPregunta(); } };
  document.getElementById('btnNext').onclick = () => { if (idx<ronda.length-1) { idx++; mostrarPregunta(); } else { finalizar(false); } };
  document.getElementById('btnFin').onclick  = () => finalizar(false);

  // Si ya había respuesta, mostrar feedback
  if (respuestas[idx] != null){
    verificarRespuesta(tipo);
  }
}

function getTipoLabel(tipo){
  const labels = {
    'multiple': 'Opción Múltiple',
    'multiple_seleccion': 'Selección Múltiple',
    'emparejamiento': 'Emparejamiento',
    'ordenamiento': 'Ordenamiento'
  };
  return labels[tipo] || 'Pregunta';
}

function renderizarSegunTipo(q, tipo){
  const wrap = document.getElementById('opciones');
  
  switch(tipo){
    case 'multiple':
      renderMultiple(q, wrap);
      break;
    case 'multiple_seleccion':
      renderMultipleSeleccion(q, wrap);
      break;
    case 'emparejamiento':
      renderEmparejamiento(q, wrap);
      break;
    case 'ordenamiento':
      renderOrdenamiento(q, wrap);
      break;
    default:
      renderMultiple(q, wrap);
  }
}

// --- Renderizado por tipo ---

function renderMultiple(q, wrap){
  wrap.innerHTML = q.opciones.map((op,i)=>`
    <button
      class="w-full bg-white rounded-xl shadow-md p-4 text-left border-2 border-gray-200 hover:border-indigo-400 hover:shadow-lg transition-all duration-200 text-gray-800 font-medium"
      data-i="${i}">
      <span class="font-bold text-indigo-600 mr-2">${String.fromCharCode(65 + i)}.</span>
      ${op}
    </button>
  `).join('');

  wrap.querySelectorAll('button').forEach(btn=>{
    btn.addEventListener('click', () => {
      respuestas[idx] = parseInt(btn.dataset.i, 10);
      verificarRespuesta('multiple');
    });
  });
}

function renderMultipleSeleccion(q, wrap){
  wrap.innerHTML = `
    <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200 mb-3">
      <p class="text-sm text-blue-800 font-semibold">ℹ️ Selecciona todas las opciones correctas</p>
    </div>
    ${q.opciones.map((op,i)=>`
      <label class="flex items-start gap-3 w-full bg-white rounded-xl shadow-md p-4 border-2 border-gray-200 hover:border-indigo-400 hover:shadow-lg transition-all duration-200 cursor-pointer">
        <input type="checkbox" class="mt-1 w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500" data-i="${i}">
        <span class="text-gray-800 font-medium flex-1">
          <span class="font-bold text-indigo-600 mr-2">${String.fromCharCode(65 + i)}.</span>
          ${op}
        </span>
      </label>
    `).join('')}
    <button id="btnVerificar" class="btn btn-primary w-full mt-3">
      Verificar Respuestas
    </button>
  `;

  document.getElementById('btnVerificar').onclick = () => {
    const seleccionadas = [];
    wrap.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      if(cb.checked) seleccionadas.push(parseInt(cb.dataset.i, 10));
    });
    respuestas[idx] = seleccionadas;
    verificarRespuesta('multiple_seleccion');
  };
}

function renderEmparejamiento(q, wrap){
  const pares = q.pares;
  const derechas = shuffle(pares.map(p => p.derecha));
  
  wrap.innerHTML = `
    <div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200 mb-3">
      <p class="text-sm text-purple-800 font-semibold">🔗 Empareja cada concepto con su definición</p>
    </div>
    ${pares.map((par, i) => `
      <div class="bg-white rounded-xl shadow-md p-4 border-2 border-gray-200 mb-3">
        <div class="font-semibold text-gray-800 mb-2">
          <span class="text-indigo-600">${i+1}.</span> ${par.izquierda}
        </div>
        <select class="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" data-i="${i}">
          <option value="">-- Selecciona --</option>
          ${derechas.map((der, j) => `
            <option value="${j}">${der}</option>
          `).join('')}
        </select>
      </div>
    `).join('')}
    <button id="btnVerificar" class="btn btn-primary w-full mt-3">
      Verificar Emparejamiento
    </button>
  `;

  document.getElementById('btnVerificar').onclick = () => {
    const emparejamientos = [];
    wrap.querySelectorAll('select').forEach((sel, i) => {
      const valorSeleccionado = sel.value;
      if(valorSeleccionado !== ""){
        emparejamientos.push({
          izquierda: pares[i].izquierda,
          derecha: derechas[parseInt(valorSeleccionado, 10)]
        });
      }
    });
    respuestas[idx] = { emparejamientos, derechas };
    verificarRespuesta('emparejamiento');
  };
}

function renderOrdenamiento(q, wrap){
  const opciones = q.opciones.map((op, i) => ({texto: op, indice: i}));
  const desordenadas = shuffle(opciones);
  
  wrap.innerHTML = `
    <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200 mb-3">
      <p class="text-sm text-green-800 font-semibold">🔢 Ordena los pasos en el orden correcto</p>
    </div>
    <div id="lista-ordenamiento" class="space-y-2">
      ${desordenadas.map((op, posicion) => `
        <div class="flex items-center gap-3 bg-white rounded-xl shadow-md p-4 border-2 border-gray-200" data-indice="${op.indice}">
          <div class="flex flex-col gap-1">
            <button class="btn-ordenar text-indigo-600 hover:text-indigo-800" onclick="moverArriba(${posicion})" ${posicion === 0 ? 'disabled' : ''}>
              ⬆️
            </button>
            <button class="btn-ordenar text-indigo-600 hover:text-indigo-800" onclick="moverAbajo(${posicion})" ${posicion === desordenadas.length - 1 ? 'disabled' : ''}>
              ⬇️
            </button>
          </div>
          <div class="flex-1 font-medium text-gray-800">
            <span class="text-indigo-600 font-bold">${posicion + 1}.</span> ${op.texto}
          </div>
        </div>
      `).join('')}
    </div>
    <button id="btnVerificar" class="btn btn-primary w-full mt-3">
      Verificar Orden
    </button>
  `;

  document.getElementById('btnVerificar').onclick = () => {
    const orden = Array.from(document.querySelectorAll('#lista-ordenamiento > div'))
      .map(div => parseInt(div.dataset.indice, 10));
    respuestas[idx] = orden;
    verificarRespuesta('ordenamiento');
  };
}

// Funciones globales para ordenamiento
window.moverArriba = function(pos){
  const lista = document.getElementById('lista-ordenamiento');
  const items = Array.from(lista.children);
  if(pos > 0){
    lista.insertBefore(items[pos], items[pos-1]);
    actualizarNumeracion();
  }
};

window.moverAbajo = function(pos){
  const lista = document.getElementById('lista-ordenamiento');
  const items = Array.from(lista.children);
  if(pos < items.length - 1){
    lista.insertBefore(items[pos+1], items[pos]);
    actualizarNumeracion();
  }
};

function actualizarNumeracion(){
  const items = document.querySelectorAll('#lista-ordenamiento > div');
  items.forEach((item, i) => {
    const span = item.querySelector('span');
    span.textContent = `${i + 1}.`;
    
    const btnArriba = item.querySelector('button:first-child');
    const btnAbajo = item.querySelector('button:last-child');
    
    btnArriba.disabled = i === 0;
    btnAbajo.disabled = i === items.length - 1;
    btnArriba.onclick = () => moverArriba(i);
    btnAbajo.onclick = () => moverAbajo(i);
  });
}

// --- Verificación de respuestas ---

function verificarRespuesta(tipo){
  const q = ronda[idx];
  let esCorrecta = false;

  switch(tipo){
    case 'multiple':
      esCorrecta = respuestas[idx] === q.respuesta;
      break;
    
    case 'multiple_seleccion':
      const seleccionadas = respuestas[idx] || [];
      const correctas = q.respuestas_correctas || [];
      esCorrecta = seleccionadas.length === correctas.length && 
                   seleccionadas.every(s => correctas.includes(s));
      break;
    
    case 'emparejamiento':
      const resp = respuestas[idx];
      if(resp && resp.emparejamientos){
        esCorrecta = q.pares.every(par => {
          const match = resp.emparejamientos.find(e => e.izquierda === par.izquierda);
          return match && match.derecha === par.derecha;
        });
      }
      break;
    
    case 'ordenamiento':
      const orden = respuestas[idx];
      esCorrecta = JSON.stringify(orden) === JSON.stringify(q.orden_correcto);
      break;
  }

  if(esCorrecta && !respuestas[idx + '_contado']){
    correctas++;
    respuestas[idx + '_contado'] = true;
  }

  mostrarFeedback(esCorrecta, q, tipo);
  deshabilitarOpciones(tipo, esCorrecta);
}

function mostrarFeedback(ok, q, tipo){
  const box = document.getElementById('feedback');
  const exp = q.explicacion ? ` ${q.explicacion}` : '';
  
  if(ok){
    box.className = 'p-4 rounded-xl border-2 bg-gradient-to-r from-green-100 to-emerald-100 border-green-300 text-green-800 font-medium shadow-md';
    box.innerHTML = `<div class="flex items-center gap-2"><span class="text-2xl">✅</span><span><strong>¡Correcto!</strong> ${exp}</span></div>`;
  }else{
    let detalleIncorrecto = '';
    
    if(tipo === 'multiple'){
      detalleIncorrecto = `Respuesta correcta: <strong>"${q.opciones[q.respuesta]}"</strong>.`;
    } else if(tipo === 'multiple_seleccion'){
      const correctasTexto = q.respuestas_correctas.map(i => q.opciones[i]).join(', ');
      detalleIncorrecto = `Respuestas correctas: <strong>${correctasTexto}</strong>.`;
    }
    
    box.className = 'p-4 rounded-xl border-2 bg-gradient-to-r from-red-100 to-rose-100 border-red-300 text-red-800 font-medium shadow-md';
    box.innerHTML = `<div class="flex items-start gap-2"><span class="text-2xl">❌</span><span><strong>Incorrecto.</strong> ${detalleIncorrecto} ${exp}</span></div>`;
  }
}

function deshabilitarOpciones(tipo, esCorrecta){
  const q = ronda[idx];
  
  if(tipo === 'multiple'){
    document.querySelectorAll('#opciones button').forEach((b,i)=>{
      b.disabled = true;
      b.classList.add('cursor-not-allowed', 'opacity-90');
      
      if(i === q.respuesta) {
        b.classList.remove('border-gray-200', 'bg-white');
        b.classList.add('border-green-500', 'bg-green-50', 'ring-4', 'ring-green-300');
      }
      if(i === respuestas[idx] && i !== q.respuesta) {
        b.classList.remove('border-gray-200', 'bg-white');
        b.classList.add('border-red-500', 'bg-red-50', 'ring-4', 'ring-red-300');
      }
    });
  } else if(tipo === 'multiple_seleccion'){
    document.querySelectorAll('#opciones input[type="checkbox"]').forEach((cb, i) => {
      cb.disabled = true;
      const label = cb.closest('label');
      label.classList.add('cursor-not-allowed', 'opacity-90');
      
      if(q.respuestas_correctas.includes(i)){
        label.classList.add('border-green-500', 'bg-green-50', 'ring-2', 'ring-green-300');
      } else if(cb.checked){
        label.classList.add('border-red-500', 'bg-red-50', 'ring-2', 'ring-red-300');
      }
    });
  }
  
  const btnVerificar = document.getElementById('btnVerificar');
  if(btnVerificar){
    btnVerificar.disabled = true;
    btnVerificar.classList.add('opacity-50', 'cursor-not-allowed');
  }
}

async function finalizar(porTiempo){
  clearInterval(interval);
  
  estado.textContent = (porTiempo ? '⏰ Se acabó el tiempo. ' : '🏁 Finalizado. ') + `Puntaje: ${correctas}/${ronda.length}`;
  
  contenedor.innerHTML = `
    <div class="bg-white rounded-xl shadow-lg p-8 border-2 border-gray-200 text-center">
      <h2 class="text-3xl font-bold mb-4 ${correctas/ronda.length >= 0.7 ? 'text-green-600' : 'text-orange-600'}">
        ${correctas/ronda.length >= 0.7 ? '🎉 ¡Excelente trabajo!' : '📚 Sigue practicando'}
      </h2>
      <div class="text-6xl font-bold mb-4 ${correctas/ronda.length >= 0.7 ? 'text-green-600' : 'text-orange-600'}">
        ${correctas} / ${ronda.length}
      </div>
      <div class="text-xl text-gray-600 mb-6">
        ${Math.round((correctas/ronda.length)*100)}% de respuestas correctas
      </div>
      <button onclick="location.reload()" class="btn btn-primary">
        🔄 Nuevo Simulacro
      </button>
    </div>
  `;
}

btnEmpezar.onclick = async () => {
  try{
    btnEmpezar.disabled = true;
    estado.textContent = 'Cargando preguntas...';
    contenedor.innerHTML = '';
    correctas = 0; respuestas = []; idx = 0;

    banco = await cargarMateria(); 

    if (modoSel.value === 'examen') {
        ronda = sample(banco, CANTIDAD_EXAMEN);
    } else {
        ronda = shuffle(banco); 
    }

    estado.textContent = `Preguntas seleccionadas: ${ronda.length}`;
    mostrarPregunta();
    iniciarTimer();
  }catch(e){
    estado.textContent = 'Error al iniciar el simulador: ' + e.message;
  }finally{
    btnEmpezar.disabled = false;
  }
};

const STORAGE_KEY = 'simulador_quiz_estado_v2';

btnGuardar && (btnGuardar.onclick = ()=>{
  const data = { materia: MATERIA_NOMBRE, modo: modoSel.value, minutos: minutosSel.value, ronda, idx, correctas, respuestas };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  alert('✅ Progreso guardado en este dispositivo.');
});

btnCargar && (btnCargar.onclick = ()=>{
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw) return alert('No hay progreso guardado.');
  try{
    const d = JSON.parse(raw);
    modoSel.value = d.modo; minutosSel.value = d.minutos;
    ronda = d.ronda; idx = d.idx; correctas = d.correctas; respuestas = d.respuestas || [];
    estado.textContent = `Progreso cargado. Preguntas: ${ronda.length}`;
    mostrarPregunta(); iniciarTimer();
  }catch(e){ alert('No pude cargar el progreso. Archivo corrupto.'); }
});