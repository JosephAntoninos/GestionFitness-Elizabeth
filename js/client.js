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

// ================== AUTOEVALUACIÓN (sin cambios) ==================
// ... (mantén todas las funciones de evaluación sin modificar)
// Para ahorrar espacio, asumo que las tienes. Si necesitas el código completo, puedo agregarlo.

// ================== INDICADOR DE TRANSFORMACIÓN (sin cambios) ==================
// ...

// ================== CHECK-IN (sin cambios) ==================
// ...

// ================== ALERTAS DEL ASISTENTE (sin cambios) ==================
// ...

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
    for (let i = 0; i < TOTAL_DAYS; i++) {
        const dayDiv = document.getElementById('day' + i);
        if (!dayDiv) continue;
        const checkbox = document.getElementById('dayCheckbox' + i);
        if (!checkbox) continue;
        dayDiv.classList.remove('state-pending', 'state-completed', 'state-omitted', 'state-unavailable');
        if (i > todayIndex) {
            dayDiv.classList.add('state-unavailable');
            checkbox.disabled = true;
            checkbox.checked = false;
        } else if (completedDays[i]) {
            dayDiv.classList.add('state-completed');
            checkbox.disabled = false;
            checkbox.checked = true;
        } else if (i === todayIndex) {
            dayDiv.classList.add('state-pending');
            checkbox.disabled = false;
            checkbox.checked = false;
        } else {
            dayDiv.classList.add('state-omitted');
            checkbox.disabled = false;
            checkbox.checked = false;
        }
    }
}

function buildCalendar() {
    const container = document.getElementById('weeksContainer');
    if (!container) return;
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
    updateCalendarStates();
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
    updateAdherenceScore();
    updateCalendarStates();
    actualizarTodoEvaluaciones();
    actualizarIndicadorTransformacion();
    mostrarCheckinSiCorresponde();
}

// ================== SINCRONIZACIÓN AUTOMÁTICA (MEJORADA) ==================
async function sincronizarConFirestore() {
    try {
        // Leer datos locales (con valores por defecto)
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
            // Primera vez: subir locales
            await ClientRepository.saveProgress(localCompleted, localCargas);
            console.log('📤 Datos locales subidos a Firestore (primera vez)');
            return;
        }
        const data = doc.data();
        const cloudCompleted = data.completedDays || new Array(TOTAL_DAYS).fill(false);
        const cloudCargas = data.cargas || {};
        const cloudLastUpdate = data.lastUpdate ? data.lastUpdate.toMillis() : 0;
        const cloudCount = cloudCompleted.filter(Boolean).length;

        console.log(`📊 Local: ${localCount} días, Cloud: ${cloudCount} días`);

        // DECISIÓN: SI LA NUBE TIENE MÁS DÍAS, DESCARGAR SIEMPRE
        if (cloudCount > localCount) {
            localStorage.setItem('fitnessCompletedDays', JSON.stringify(cloudCompleted));
            localStorage.setItem('fitnessCargas', JSON.stringify(cloudCargas));
            localStorage.setItem('fitnessLastUpdate', String(cloudLastUpdate));
            completedDays = cloudCompleted;
            cargas = cloudCargas;
            console.log('📥 Descargados datos de Firestore (nube tiene más días)');
            return; // Importante: salir para que la UI se reconstruya con los nuevos datos
        }

        // Si local tiene más días, subir
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
        } else if (localLastUpdate > cloudLastUpdate) {
            await ClientRepository.saveProgress(localCompleted, localCargas);
            console.log('📤 Subidos datos locales a Firestore (local más reciente)');
        } else {
            console.log('✅ Datos sincronizados (iguales)');
        }
    } catch (error) {
        console.error('❌ Error en sincronización:', error);
        // Si falla, mantener datos locales y mostrar un aviso en consola (no molestar al usuario)
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

        // Mostrar mensaje de sincronización en el dashboard (solo texto)
        const syncMsg = document.createElement('div');
        syncMsg.id = 'syncStatus';
        syncMsg.style.cssText = 'font-size:0.7rem; color:#6eb2cc; margin-left:10px;';
        syncMsg.textContent = '🔄 Sincronizando...';
        const dashboard = document.getElementById('dashboard');
        if (dashboard) dashboard.appendChild(syncMsg);

        // 1. Sincronizar con Firestore
        await sincronizarConFirestore();

        // 2. Cargar datos (ya actualizados por sincronización)
        completedDays = JSON.parse(localStorage.getItem('fitnessCompletedDays')) || new Array(TOTAL_DAYS).fill(false);
        cargas = JSON.parse(localStorage.getItem('fitnessCargas')) || {};
        startDate = localStorage.getItem('fitnessStartDate') || new Date().toISOString().split('T')[0];

        const allExercises = [...exercisesA, ...exercisesB];
        allExercises.forEach(ex => {
            if (!cargas[ex]) cargas[ex] = ['', '', '', ''];
        });

        // 3. Construir UI
        buildCalendar();
        buildWorkoutLog('workoutA', exercisesA, videoIdsA);
        buildWorkoutLog('workoutB', exercisesB, videoIdsB);
        updateAllUI();

        // 4. Eliminar mensaje de sincronización
        const syncEl = document.getElementById('syncStatus');
        if (syncEl) syncEl.remove();

        systemInitialized = true;
        console.log('✅ Sistema inicializado correctamente');
    } catch (error) {
        console.error('❌ Error en inicialización:', error);
        // Si falla, al menos mostrar algo
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
