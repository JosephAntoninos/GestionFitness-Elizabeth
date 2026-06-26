// ================== FUNCIONES COMPARTIDAS ==================
function getDayIndexFromStart() {
if (!startDate) return 0;
const start = new Date(startDate + 'T00:00:00');
const today = new Date();
today.setHours(0,0,0,0);
const diffTime = today - start;
const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
return Math.min(Math.max(diffDays, 0), TOTAL_DAYS - 1);
}

function getDiaPrograma() {
return getDayIndexFromStart() + 1;
}

function getCurrentStreak() {
let streak = 0;
const todayIndex = getDayIndexFromStart();
for (let i = todayIndex; i >= 0; i--) {
if (completedDays[i]) streak++;
else break;
}
return streak;
}

function getAvailableDaysCount() {
return getDayIndexFromStart() + 1;
}

function getAdherenceScore() {
const available = getAvailableDaysCount();
const completed = completedDays.slice(0, available).filter(d => d).length;
const pct = available === 0 ? 0 : Math.round((completed / available) * 100);
let label, color;
if (pct >= 90) { label = '🏆 Excelente 🏆'; color = '#22c55e'; }
else if (pct >= 75) { label = '🥳 Bueno 🥳'; color = '#eab308'; }
else if (pct >= 50) { label = '⚠️ Riesgo ⚠️'; color = '#f97316'; }
else { label = '🚨 Crítico 🚨'; color = '#ef4444'; }
return { score: pct, label, color };
}

async function saveAll() {
    try {
        await ClientRepository.saveProgress(completedDays, cargas);
        localStorage.setItem('fitnessCompletedDays', JSON.stringify(completedDays));
        localStorage.setItem('fitnessCargas', JSON.stringify(cargas));
    } catch (error) {
        console.error('❌ Error al guardar en Firestore, guardando solo en localStorage:', error);
        localStorage.setItem('fitnessCompletedDays', JSON.stringify(completedDays));
        localStorage.setItem('fitnessCargas', JSON.stringify(cargas));
        alert('⚠️ No se pudo sincronizar con la nube. Los datos se guardaron localmente.');
    }
}