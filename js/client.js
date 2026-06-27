// ================== SISTEMA DE PIN ==================
let CORRECT_PIN = "1111";
const lockScreen = document.getElementById('lockScreen');
const mainContent = document.getElementById('mainContent');
const pinInput = document.getElementById('pinInput');
const pinBtn = document.getElementById('pinBtn');
const pinError = document.getElementById('pinError');

let completedDays = new Array(TOTAL_DAYS).fill(false);
let cargas = {};
const allExercises = [...exercisesA, ...exercisesB];
allExercises.forEach(ex => {
    if (!cargas[ex]) cargas[ex] = ['', '', '', ''];
});

let startDate = localStorage.getItem('fitnessStartDate');
let systemInitialized = false;
let unsubscribeCliente = null;

// ================== FUNCIONES BASE ==================
function initStartDate() {
    if (!startDate) {
        startDate = new Date().toISOString().split('T')[0];
        localStorage.setItem('fitnessStartDate', startDate);
        console.log('📅 startDate creado:', startDate);
    } else {
        console.log('📅 startDate existente:', startDate);
    }
    updateDateDisplay();
}

function updateDateDisplay() {
    if (!startDate) return;
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(start);
    end.setDate(end.getDate() + TOTAL_DAYS);
    const options = { day: 'numeric', month: 'long' };
    const reviewEl = document.getElementById('reviewDate');
    if (reviewEl) reviewEl.textContent = end.toLocaleDateString('es-ES', options);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysLeft = Math.max(0, Math.ceil((end - today) / (1000 * 60 * 60 * 24)));
    const daysLeftEl = document.getElementById('daysLeft');
    if (daysLeftEl) daysLeftEl.textContent = daysLeft;
}

// ================== AUTOEVALUACIÓN ==================
function evaluacionEstaBloqueada(semana) {
    const diaActual = getDiaPrograma();
    if (semana === 1 && diaActual < 7) return true;
    if (semana === 2 && diaActual < 15) return true;
    if (semana === 4 && diaActual < 28) return true;
    return false;
}

function evaluacionYaGuardada(semana) {
    return localStorage.getItem(`evaluacion_semana${semana}`) !== null;
}

async function guardarEvaluacion(semana) {
    if (evaluacionYaGuardada(semana)) {
        alert('❌ Esta evaluación ya fue guardada y no puede modificarse.');
        return;
    }
    if (evaluacionEstaBloqueada(semana)) {
        alert(`🔒 Esta evaluación se desbloqueará el día ${semana === 1 ? 7 : semana === 2 ? 15 : 28} del programa.`);
        return;
    }

    let peso, musculo, grasa;
    if (semana === 1) {
        peso = document.getElementById('peso_semana1')?.value;
        musculo = document.getElementById('musculo_semana1')?.value;
        grasa = document.getElementById('grasa_semana1')?.value;
    } else if (semana === 2) {
        peso = document.getElementById('peso_semana2')?.value;
        musculo = document.getElementById('musculo_semana2')?.value;
        grasa = document.getElementById('grasa_semana2')?.value;
    } else if (semana === 4) {
        peso = document.getElementById('peso_semana4')?.value;
        musculo = document.getElementById('musculo_semana4')?.value;
        grasa = document.getElementById('grasa_semana4')?.value;
    }

    if (!peso || !musculo || !grasa) {
        alert('⚠️ Por favor, completa todos los campos antes de guardar.');
        return;
    }

    const evaluacion = {
        peso: parseFloat(peso),
        musculo: parseFloat(musculo),
        grasa: parseFloat(grasa),
        fecha: new Date().toISOString(),
        diaPrograma: getDiaPrograma()
    };

    localStorage.setItem(`evaluacion_semana${semana}`, JSON.stringify(evaluacion));

    try {
        const weekKey = semana === 1 ? 'week1' : semana === 2 ? 'week2' : 'week4';
        await ClientRepository.saveEvaluation(weekKey, evaluacion);
        alert(`✅ Evaluación de ${semana === 1 ? 'Semana 1' : semana === 2 ? 'Semana 2' : 'Final'} guardada correctamente.`);
        cargarEvaluacionesGuardadas();
        actualizarBloqueoEvaluaciones();
    } catch (error) {
        console.error('❌ Error al guardar evaluación en Firestore:', error);
        alert('⚠️ Evaluación guardada localmente pero no en la nube.');
    }
}

function cargarEvaluacionesGuardadas() {
    const semanas = [1, 2, 4];
    semanas.forEach(semana => {
        const data = localStorage.getItem(`evaluacion_semana${semana}`);
        if (data) {
            const evaluacion = JSON.parse(data);
            if (semana === 1) {
                const p = document.getElementById('peso_semana1');
                const m = document.getElementById('musculo_semana1');
                const g = document.getElementById('grasa_semana1');
                if (p) p.value = evaluacion.peso;
                if (m) m.value = evaluacion.musculo;
                if (g) g.value = evaluacion.grasa;
            } else if (semana === 2) {
                const p = document.getElementById('peso_semana2');
                const m = document.getElementById('musculo_semana2');
                const g = document.getElementById('grasa_semana2');
                if (p) p.value = evaluacion.peso;
                if (m) m.value = evaluacion.musculo;
                if (g) g.value = evaluacion.grasa;
            } else if (semana === 4) {
                const p = document.getElementById('peso_semana4');
                const m = document.getElementById('musculo_semana4');
                const g = document.getElementById('grasa_semana4');
                if (p) p.value = evaluacion.peso;
                if (m) m.value = evaluacion.musculo;
                if (g) g.value = evaluacion.grasa;
            }
        }
    });
}

function actualizarBloqueoEvaluaciones() {
    const semanas = [1, 2, 4];
    semanas.forEach(semana => {
        const card = document.getElementById(`seguimiento-semana${semana}`);
        if (!card) return;
        const inputs = card.querySelectorAll('.seguimiento-inputs input');
        const btn = document.getElementById(`guardar-btn-${semana}`);
        const mensajeBloqueo = card.querySelector('.bloqueado-mensaje');
        const yaGuardado = evaluacionYaGuardada(semana);
        const estaBloqueada = evaluacionEstaBloqueada(semana);

        if (yaGuardado) {
            inputs.forEach(input => input.disabled = true);
            if (btn) {
                btn.disabled = true;
                btn.textContent = '✅ Completado';
            }
            if (mensajeBloqueo) mensajeBloqueo.style.display = 'none';
        } else if (estaBloqueada) {
            inputs.forEach(input => input.disabled = true);
            if (btn) btn.disabled = true;
            if (mensajeBloqueo) {
                mensajeBloqueo.style.display = 'block';
                mensajeBloqueo.textContent = `🔒 Evaluación bloqueada hasta el día ${semana === 1 ? 7 : semana === 2 ? 15 : 28}`;
            }
        } else {
            inputs.forEach(input => input.disabled = false);
            if (btn) {
                btn.disabled = false;
                btn.textContent = `💾 Guardar ${semana === 1 ? 'Semana 1' : semana === 2 ? 'Semana 2' : 'Final'}`;
            }
            if (mensajeBloqueo) mensajeBloqueo.style.display = 'none';
        }
    });
}

function actualizarTodoEvaluaciones() {
    cargarEvaluacionesGuardadas();
    actualizarBloqueoEvaluaciones();
}

// ================== INDICADOR DE TRANSFORMACIÓN ==================
function actualizarIndicadorTransformacion() {
    const pesoInicial = 95.8;
    const musculoInicial = 29.3;
    const grasaInicial = 42.6;

    let pesoActual = pesoInicial;
    let musculoActual = musculoInicial;
    let grasaActual = grasaInicial;

    const evalFinal = localStorage.getItem('evaluacion_semana4');
    const evalSemana2 = localStorage.getItem('evaluacion_semana2');
    const evalSemana1 = localStorage.getItem('evaluacion_semana1');

    if (evalFinal) {
        const data = JSON.parse(evalFinal);
        pesoActual = data.peso;
        musculoActual = data.musculo;
        grasaActual = data.grasa;
    } else if (evalSemana2) {
        const data = JSON.parse(evalSemana2);
        pesoActual = data.peso;
        musculoActual = data.musculo;
        grasaActual = data.grasa;
    } else if (evalSemana1) {
        const data = JSON.parse(evalSemana1);
        pesoActual = data.peso;
        musculoActual = data.musculo;
        grasaActual = data.grasa;
    }

    document.getElementById('peso-actual').textContent = pesoActual + ' kg';
    document.getElementById('musculo-actual').textContent = musculoActual + ' kg';
    document.getElementById('grasa-actual').textContent = grasaActual + '%';

    let pesoCambio = pesoActual - pesoInicial;
    let pesoCambioTexto = '';
    let progresoPeso = 0;
    if (pesoCambio < 0) {
        pesoCambioTexto = `⬇️ Has reducido ${Math.abs(pesoCambio).toFixed(1)} kg`;
        let reduccionMaxima = 10;
        let reduccionReal = Math.abs(pesoCambio);
        progresoPeso = Math.min(100, Math.round((reduccionReal / reduccionMaxima) * 100));
    } else if (pesoCambio > 0) {
        pesoCambioTexto = `⬆️ Has aumentado ${pesoCambio.toFixed(1)} kg`;
        progresoPeso = 0;
    } else {
        pesoCambioTexto = `➡️ Te mantienes estable`;
        progresoPeso = 0;
    }
    document.getElementById('peso-cambio').textContent = pesoCambioTexto;
    document.getElementById('barra-peso').style.width = progresoPeso + '%';

    let musculoCambio = musculoActual - musculoInicial;
    let musculoCambioTexto = '';
    let progresoMusculo = 0;
    if (musculoCambio > 0) {
        musculoCambioTexto = `⬆️ Has ganado ${musculoCambio.toFixed(1)} kg`;
        let gananciaMaxima = 3;
        progresoMusculo = Math.min(100, Math.round((musculoCambio / gananciaMaxima) * 100));
    } else if (musculoCambio < 0) {
        musculoCambioTexto = `⬇️ Has perdido ${Math.abs(musculoCambio).toFixed(1)} kg`;
        progresoMusculo = 0;
    } else {
        musculoCambioTexto = `➡️ Te mantienes estable`;
        progresoMusculo = 0;
    }
    document.getElementById('musculo-cambio').textContent = musculoCambioTexto;
    document.getElementById('barra-musculo').style.width = progresoMusculo + '%';

    let grasaCambio = grasaActual - grasaInicial;
    let grasaCambioTexto = '';
    let progresoGrasa = 0;
    if (grasaCambio < 0) {
        grasaCambioTexto = `⬇️ Has reducido ${Math.abs(grasaCambio).toFixed(1)}%`;
        let reduccionMaxima = 10;
        let reduccionReal = Math.abs(grasaCambio);
        progresoGrasa = Math.min(100, Math.round((reduccionReal / reduccionMaxima) * 100));
    } else if (grasaCambio > 0) {
        grasaCambioTexto = `⬆️ Ha aumentado ${grasaCambio.toFixed(1)}%`;
        progresoGrasa = 0;
    } else {
        grasaCambioTexto = `➡️ Te mantienes estable`;
        progresoGrasa = 0;
    }
    document.getElementById('grasa-cambio').textContent = grasaCambioTexto;
    document.getElementById('barra-grasa').style.width = progresoGrasa + '%';
}

// ================== CHECK-IN SEMANAL ==================
const ULTIMO_CHECKIN_KEY = 'ultimoCheckinSemana';
const CHECKIN_RESPUESTAS_KEY = 'checkinRespuestas';

function mostrarCheckinSiCorresponde() {
    const container = document.getElementById('checkinContainer');
    if (!container) return;
    const ultimoCheckin = localStorage.getItem(ULTIMO_CHECKIN_KEY);
    const hoy = new Date().toDateString();
    const diaPrograma = getDiaPrograma();
    const esDiaCheckin = [1, 8, 15, 22].includes(diaPrograma);
    const yaHizoCheckinHoy = (ultimoCheckin === hoy);

    if (esDiaCheckin && !yaHizoCheckinHoy) {
        container.style.display = 'block';
        document.querySelectorAll('.checkin-btn').forEach(btn => btn.style.display = 'inline-block');
        const mensaje = document.getElementById('checkinMensaje');
        if (mensaje) mensaje.style.display = 'none';
    } else {
        container.style.display = 'none';
    }
}

async function guardarCheckin(estado) {
    const hoy = new Date().toISOString();
    const semana = Math.floor((getDiaPrograma() - 1) / 7) + 1;
    const respuesta = {
        semana: semana,
        estado: estado,
        fecha: hoy,
        diaPrograma: getDiaPrograma()
    };

    let respuestas = JSON.parse(localStorage.getItem(CHECKIN_RESPUESTAS_KEY)) || [];
    respuestas.push(respuesta);
    localStorage.setItem(CHECKIN_RESPUESTAS_KEY, JSON.stringify(respuestas));
    localStorage.setItem(ULTIMO_CHECKIN_KEY, new Date().toDateString());

    try {
        await ClientRepository.saveCheckin(respuesta);
        console.log('✅ Check-in guardado en Firestore');
    } catch (error) {
        console.error('❌ Error al guardar check-in en Firestore:', error);
    }

    const mensaje = document.getElementById('checkinMensaje');
    if (mensaje) mensaje.style.display = 'block';
    document.querySelectorAll('.checkin-btn').forEach(btn => btn.style.display = 'none');

    if (respuestas.length >= 2) {
        const ultimasDos = respuestas.slice(-2);
        const ambasDificiles = ultimasDos.every(r => r.estado === 'dificil' || r.estado === 'muy-dificil');
        if (ambasDificiles) {
            console.log('⚠️ ALERTA PARA COACH: Cliente reporta dos semanas difíciles seguidas');
        }
    }

    setTimeout(() => {
        const container = document.getElementById('checkinContainer');
        if (container) container.style.display = 'none';
    }, 3000);
}

document.querySelectorAll('.checkin-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const estado = this.dataset.estado;
        guardarCheckin(estado);
    });
});

// ================== ALERTAS DEL ASISTENTE ==================
function updateAlerts() {
    const todayIndex = getDayIndexFromStart();
    const totalCompleted = completedDays.filter(d => d).length;
    let consecutivosSinCompletar = 0;
    for (let i = todayIndex; i >= 0; i--) {
        if (!completedDays[i]) consecutivosSinCompletar++;
        else break;
    }

    const assistantIcon = document.getElementById('assistantIcon');
    const assistantText = document.getElementById('assistantText');
    const banner = document.getElementById('assistantBanner');

    if (!assistantIcon || !assistantText || !banner) return;

    let icono = '🧠';
    let mensaje = '';
    let mostrarBoton = false;
    let textoBoton = '';

    if (totalCompleted === 0) {
        mensaje = 'Bienvenida, Eli. Tu sistema de transformación está listo. Marca tu primer día cuando estés lista.';
        banner.style.borderColor = 'rgba(47,106,135,0.3)';
    } else if (consecutivosSinCompletar >= 7) {
        icono = '🔴';
        mensaje = '<span class="assistant-highlight">Alerta de abandono.</span> 7 días sin actividad. ¿Conversamos para ajustar el plan?';
        mostrarBoton = true;
        textoBoton = '📞 Hablar con Joseph';
        banner.style.borderColor = '#ef4444';
    } else if (consecutivosSinCompletar >= 4) {
        icono = '⚠️';
        mensaje = 'Estás en <span class="assistant-highlight">zona de riesgo.</span> ' + consecutivosSinCompletar + ' días sin marcar. ¿Qué podemos hacer distinto?';
        mostrarBoton = true;
        textoBoton = '🛠️ Solicitar Ajuste';
        banner.style.borderColor = '#f97316';
    } else if (consecutivosSinCompletar >= 2) {
        icono = '💡';
        mensaje = 'Pequeña pausa. <span class="assistant-highlight">' + consecutivosSinCompletar + ' días sin actividad.</span> ¿Retomamos mañana?';
        mostrarBoton = true;
        textoBoton = '🛠️ Solicitar Ajuste';
        banner.style.borderColor = '#eab308';
    } else {
        icono = '🧠';
        mensaje = 'Estás al día. <span class="assistant-highlight">Buen ritmo, Eli.</span> Sigue construyendo tu racha.';
        mostrarBoton = false;
        banner.style.borderColor = 'rgba(47,106,135,0.3)';
    }

    assistantIcon.textContent = icono;
    assistantText.innerHTML = mensaje;

    let botonExistente = document.getElementById('dynamicAdjustBtn');
    if (mostrarBoton) {
        if (!botonExistente) {
            const boton = document.createElement('button');
            boton.id = 'dynamicAdjustBtn';
            boton.className = 'ajuste-btn-inline';
            boton.textContent = textoBoton;
            boton.onclick = () => {
                window.open('https://wa.me/525531178903?text=Hola%20Joseph,%20necesito%20ajustar%20mi%20plan%20por:', '_blank');
            };
            assistantText.parentElement.appendChild(boton);
        } else {
            botonExistente.textContent = textoBoton;
        }
    } else if (botonExistente) {
        botonExistente.remove();
    }
}

// ================== ACTUALIZACIÓN GENERAL ==================
function updateAdherenceScore() {
    const { score, label, color } = getAdherenceScore();
    const circle = document.getElementById('scoreCircle');
    const circleText = document.getElementById('scoreCircleText');
    const scoreLabel = document.getElementById('scoreLabel');
    const streak = getCurrentStreak();
    const streakElement = document.getElementById('streakValue');
    if (streakElement) streakElement.textContent = streak;
    if (circle && circleText) {
        circle.style.background = `conic-gradient(${color} 0deg ${score * 3.6}deg, #2a2a2a ${score * 3.6}deg 360deg)`;
        circleText.textContent = score + '%';
    }
    if (scoreLabel) {
        scoreLabel.textContent = label;
        scoreLabel.style.color = color;
    }
    const todayIndex = getDayIndexFromStart();
    const currentDayEl = document.getElementById('currentDayDisplay');
    if (currentDayEl) currentDayEl.textContent = `Día ${todayIndex + 1} de 28`;
    updateDateDisplay();
    updateAlerts();
}

function updateCalendarStates() {
    const todayIndex = getDayIndexFromStart();
    console.log(`📅 updateCalendarStates: todayIndex=${todayIndex}`);
    console.log('📊 Días completados:', completedDays.filter(Boolean).length);
    console.log('📊 Primeros 15 días:', completedDays.slice(0, 15).map(d => d ? '✅' : '⬜').join(' '));
    
    // Verificar que el contenedor existe
    const container = document.getElementById('weeksContainer');
    if (!container) {
        console.warn('⚠️ weeksContainer no encontrado, reconstruyendo calendario...');
        buildCalendar();
        return;
    }
    
    // Actualizar cada día individualmente
    for (let i = 0; i < TOTAL_DAYS; i++) {
        const dayDiv = document.getElementById('day' + i);
        if (!dayDiv) continue;
        
        const checkbox = document.getElementById('dayCheckbox' + i);
        if (!checkbox) continue;
        
        // Limpiar estados anteriores
        dayDiv.classList.remove('state-pending', 'state-completed', 'state-omitted', 'state-unavailable');
        
        if (i > todayIndex) {
            // Días futuros: bloqueados
            dayDiv.classList.add('state-unavailable');
            checkbox.disabled = true;
            checkbox.checked = false;
        } else if (completedDays[i] === true) {
            // Días completados
            dayDiv.classList.add('state-completed');
            checkbox.disabled = false;
            checkbox.checked = true;
        } else if (i === todayIndex) {
            // Día actual sin marcar
            dayDiv.classList.add('state-pending');
            checkbox.disabled = false;
            checkbox.checked = false;
        } else {
            // Días pasados sin marcar
            dayDiv.classList.add('state-omitted');
            checkbox.disabled = false;
            checkbox.checked = false;
        }
    }
}

function buildCalendar() {
    const container = document.getElementById('weeksContainer');
    if (!container) {
        console.error('❌ weeksContainer no encontrado en el DOM');
        return;
    }
    
    console.log('🏗️ Reconstruyendo calendario...');
    container.innerHTML = '';
    
    for (let w = 0; w < 4; w++) {
        const box = document.createElement('div');
        box.className = 'week-box';
        box.innerHTML = `<h3>Semana ${w + 1}</h3>`;
        const grid = document.createElement('div');
        grid.className = 'calendar';
        
        for (let d = 0; d < 7; d++) {
            const idx = w * 7 + d;
            const dayNumber = idx + 1;
            const dayDiv = document.createElement('div');
            dayDiv.className = 'day';
            dayDiv.id = 'day' + idx;
            dayDiv.innerHTML = `
                <strong>Día ${dayNumber}</strong>
                <span>${ACTIVITIES[idx]}</span>
                <input type="checkbox" id="dayCheckbox${idx}" ${completedDays[idx] ? 'checked' : ''}>
            `;
            const checkbox = dayDiv.querySelector('input');
            checkbox.addEventListener('change', async function() {
                completedDays[idx] = this.checked;
                await saveAll();
                updateAllUI();
            });
            grid.appendChild(dayDiv);
        }
        box.appendChild(grid);
        container.appendChild(box);
    }
    
    // Aplicar estados después de construir
    updateCalendarStates();
    console.log('✅ Calendario reconstruido correctamente');
}

function buildWorkoutLog(containerId, exercises, videoIds) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    exercises.forEach((ex, i) => {
        const div = document.createElement('div');
        div.className = 'exercise-log';
        const weeks = cargas[ex] || ['', '', '', ''];
        div.innerHTML = `
            <h4>${ex} <button class="video-btn" data-video="${videoIds[i]}">▶ Ver Video</button></h4>
            <div class="weeks-inputs">
                ${[1,2,3,4].map(s => `
                    <div class="week-input-group">
                        <label>Sem ${s}</label>
                        <div style="display: flex; align-items: center; gap: 2px;">
                            <input type="number" step="0.5" class="load-input" data-exercise="${ex}" data-week="${s-1}" value="${weeks[s-1]}" placeholder="0" style="width: 70px; text-align: center;">
                            <span style="font-size:0.7rem;">kg</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(div);
    });
    document.querySelectorAll('.load-input').forEach(input => {
        input.addEventListener('change', function() {
            let val = this.value.trim();
            if (val === "") {
                // vacío permitido
            } else {
                let num = parseFloat(val);
                if (isNaN(num)) {
                    const ex = this.dataset.exercise;
                    const weekIdx = parseInt(this.dataset.week);
                    this.value = cargas[ex][weekIdx] || '';
                    return;
                }
                this.value = num;
            }
            const ex = this.dataset.exercise;
            const weekIdx = parseInt(this.dataset.week);
            cargas[ex][weekIdx] = this.value;
            saveAll();
        });
    });
    document.querySelectorAll('.video-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const videoId = this.dataset.video;
            openVideo(videoId);
        });
    });
}

function openVideo(videoId) {
    const iframe = document.getElementById('youtubeFrame');
    if (iframe) iframe.src = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1`;
    const modal = document.getElementById('videoModal');
    if (modal) modal.style.display = 'flex';
}

function closeVideo() {
    const iframe = document.getElementById('youtubeFrame');
    if (iframe) iframe.src = '';
    const modal = document.getElementById('videoModal');
    if (modal) modal.style.display = 'none';
}

function updateAllUI() {
    console.log('🔄 updateAllUI: Actualizando toda la interfaz');
    updateAdherenceScore();
    updateCalendarStates();
    actualizarTodoEvaluaciones();
    actualizarIndicadorTransformacion();
    mostrarCheckinSiCorresponde();
}

// ================== SINCRONIZACIÓN ROBUSTA ==================
async function sincronizarConFirestore() {
    try {
        // Leer datos locales
        let localCompleted = [];
        try {
            localCompleted = JSON.parse(localStorage.getItem('fitnessCompletedDays')) || new Array(TOTAL_DAYS).fill(false);
        } catch (e) {
            localCompleted = new Array(TOTAL_DAYS).fill(false);
        }
        let localCargas = {};
        try {
            localCargas = JSON.parse(localStorage.getItem('fitnessCargas')) || {};
        } catch (e) {
            localCargas = {};
        }
        const localCount = localCompleted.filter(Boolean).length;
        const localLastUpdate = parseInt(localStorage.getItem('fitnessLastUpdate')) || 0;

        // Leer Firestore
        const doc = await db.collection('clients').doc('elizabeth-001').get();
        if (!doc.exists) {
            await ClientRepository.saveProgress(localCompleted, localCargas);
            console.log('📤 Datos locales subidos a Firestore (primera vez)');
            return;
        }
        const data = doc.data();
        const cloudCompleted = data.completedDays || new Array(TOTAL_DAYS).fill(false);
        const cloudCargas = data.cargas || {};
        const cloudLastUpdate = data.lastUpdate ? data.lastUpdate.toMillis() : 0;
        const cloudCount = cloudCompleted.filter(Boolean).length;
        
        // 🔥 Sincronizar startDate desde Firestore
        if (data.startDate) {
            const cloudStartDate = data.startDate;
            const localStartDate = localStorage.getItem('fitnessStartDate');
            if (!localStartDate || localStartDate !== cloudStartDate) {
                localStorage.setItem('fitnessStartDate', cloudStartDate);
                startDate = cloudStartDate;
                console.log('📅 startDate sincronizado desde Firestore:', cloudStartDate);
            }
        }

        console.log(`📊 Local: ${localCount} días, Cloud: ${cloudCount} días`);

        // REGLA: SI LA NUBE TIENE MÁS DÍAS -> DESCARGAR SIEMPRE
        if (cloudCount > localCount) {
            localStorage.setItem('fitnessCompletedDays', JSON.stringify(cloudCompleted));
            localStorage.setItem('fitnessCargas', JSON.stringify(cloudCargas));
            localStorage.setItem('fitnessLastUpdate', String(cloudLastUpdate));
            completedDays = cloudCompleted;
            cargas = cloudCargas;
            console.log('📥 Descargados datos de Firestore (nube tiene más días)');
            console.log('📊 completedDays después de descarga:', completedDays.filter(Boolean).length, 'días');
            return;
        }

        // Si local tiene más días -> subir
        if (localCount > cloudCount) {
            await ClientRepository.saveProgress(localCompleted, localCargas);
            console.log('📤 Subidos datos locales a Firestore (local tiene más días)');
            return;
        }

        // Misma cantidad: comparar por fecha
        if (cloudLastUpdate > localLastUpdate) {
            localStorage.setItem('fitnessCompletedDays', JSON.stringify(cloudCompleted));
            localStorage.setItem('fitnessCargas', JSON.stringify(cloudCargas));
            localStorage.setItem('fitnessLastUpdate', String(cloudLastUpdate));
            completedDays = cloudCompleted;
            cargas = cloudCargas;
            console.log('📥 Descargados datos de Firestore (más reciente)');
            console.log('📊 completedDays después de descarga:', completedDays.filter(Boolean).length, 'días');
        } else if (localLastUpdate > cloudLastUpdate) {
            await ClientRepository.saveProgress(localCompleted, localCargas);
            console.log('📤 Subidos datos locales a Firestore (local más reciente)');
        } else {
            console.log('✅ Datos sincronizados (iguales)');
            completedDays = localCompleted;
            cargas = localCargas;
        }
        
        // 🔥 FUERZA ACTUALIZACIÓN COMPLETA DE UI
        console.log('🔄 Forzando actualización completa de UI...');
        buildCalendar();
        buildWorkoutLog('workoutA', exercisesA, videoIdsA);
        buildWorkoutLog('workoutB', exercisesB, videoIdsB);
        updateAllUI();
        
        // 🔥 SEGUNDA ACTUALIZACIÓN (para asegurar que el DOM se renderizó)
        setTimeout(() => {
            console.log('🔄 Segunda actualización de UI (timeout)');
            updateCalendarStates();
            updateAdherenceScore();
        }, 300);
        
    } catch (error) {
        console.error('❌ Error en sincronización:', error);
    }
}

// ================== SUSCRIPCIÓN (DESACTIVADA) ==================
function suscribirClienteConProteccion() {
    console.log('⏸️ Suscripción en tiempo real desactivada.');
}

// ================== INICIALIZACIÓN ==================
async function inicializarSistema() {
    try {
        if (systemInitialized) return;
        initStartDate();

        // Mostrar mensaje de sincronización en el dashboard
        const syncMsg = document.createElement('div');
        syncMsg.id = 'syncStatus';
        syncMsg.style.cssText = 'font-size:0.7rem; color:#6eb2cc; margin-left:10px;';
        syncMsg.textContent = '🔄 Sincronizando...';
        const dashboard = document.getElementById('dashboard');
        if (dashboard) dashboard.appendChild(syncMsg);

        // Sincronizar con Firestore
        await sincronizarConFirestore();

        // Cargar datos (ya actualizados)
        completedDays = JSON.parse(localStorage.getItem('fitnessCompletedDays')) || new Array(TOTAL_DAYS).fill(false);
        cargas = JSON.parse(localStorage.getItem('fitnessCargas')) || {};
        startDate = localStorage.getItem('fitnessStartDate') || new Date().toISOString().split('T')[0];

        console.log('📊 Datos cargados en inicialización:', completedDays.filter(Boolean).length, 'días');
        console.log('📅 startDate:', startDate);
        console.log('📅 todayIndex:', getDayIndexFromStart());

        const allExercises = [...exercisesA, ...exercisesB];
        allExercises.forEach(ex => {
            if (!cargas[ex]) cargas[ex] = ['', '', '', ''];
        });

        // Construir UI
        buildCalendar();
        buildWorkoutLog('workoutA', exercisesA, videoIdsA);
        buildWorkoutLog('workoutB', exercisesB, videoIdsB);
        updateAllUI();

        // Eliminar mensaje de sincronización
        const syncEl = document.getElementById('syncStatus');
        if (syncEl) syncEl.remove();

        systemInitialized = true;
        console.log('✅ Sistema inicializado correctamente');
    } catch (error) {
        console.error('❌ Error en inicialización:', error);
        const syncEl = document.getElementById('syncStatus');
        if (syncEl) syncEl.textContent = '⚠️ Error de sincronización';
        setTimeout(() => {
            if (syncEl) syncEl.remove();
        }, 3000);
    }
}

// ================== VALIDACIÓN DE PIN ==================
async function checkPin() {
    const pinIngresado = pinInput.value.trim();
    if (!pinIngresado) {
        pinError.style.display = 'block';
        pinError.textContent = '⚠️ Ingresa un código.';
        return;
    }

    try {
        const doc = await db.collection('clients').doc('elizabeth-001').get();
        let pinCorrecto = '2929';
        if (doc.exists) {
            pinCorrecto = doc.data().pin || '2929';
        }

        if (pinIngresado === pinCorrecto) {
            localStorage.setItem('fitnessAuth', 'true');
            localStorage.setItem('fitnessPin', pinCorrecto);
            lockScreen.classList.add('hidden');
            mainContent.classList.add('visible');
            CORRECT_PIN = pinCorrecto;
            await inicializarSistema();
        } else {
            pinError.style.display = 'block';
            pinError.textContent = '❌ Código incorrecto.';
            pinInput.value = '';
            pinInput.focus();
        }
    } catch (error) {
        console.error('Error validando PIN, usando local:', error);
        const localPin = localStorage.getItem('fitnessPin') || '2929';
        if (pinIngresado === localPin) {
            localStorage.setItem('fitnessAuth', 'true');
            lockScreen.classList.add('hidden');
            mainContent.classList.add('visible');
            CORRECT_PIN = localPin;
            await inicializarSistema();
        } else {
            pinError.style.display = 'block';
            pinError.textContent = '⚠️ Error de conexión. Intenta más tarde.';
        }
    }
}

// ================== EVENT LISTENERS ==================
if (pinBtn) pinBtn.addEventListener('click', checkPin);
if (pinInput) {
    pinInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            checkPin();
        }
    });
    pinInput.addEventListener('input', function() {
        if (pinError) pinError.style.display = 'none';
    });
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('fitnessAuth');
        lockScreen.classList.remove('hidden');
        mainContent.classList.remove('visible');
        if (pinInput) pinInput.value = '';
        if (pinError) pinError.style.display = 'none';
        systemInitialized = false;
        if (unsubscribeCliente) {
            unsubscribeCliente();
            unsubscribeCliente = null;
        }
    });
}

document.querySelectorAll('.guardar-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const semana = parseInt(this.dataset.semana);
        guardarEvaluacion(semana);
    });
});

const modal = document.getElementById('videoModal');
if (modal) {
    modal.addEventListener('click', function(e) {
        if (e.target === this) closeVideo();
    });
}

const closeModalBtn = document.getElementById('closeModalBtn');
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeVideo);
}

// Comprobar sesión guardada
if (localStorage.getItem('fitnessAuth') === 'true') {
    lockScreen.classList.add('hidden');
    mainContent.classList.add('visible');
    inicializarSistema();
} else {
    lockScreen.classList.remove('hidden');
    mainContent.classList.remove('visible');
    if (pinInput) pinInput.value = '';
    if (pinError) pinError.style.display = 'none';
}
