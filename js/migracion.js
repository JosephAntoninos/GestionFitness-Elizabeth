// ================== MIGRACIÓN DE LOCALSTORAGE A FIRESTORE ==================
async function migrarDatosAFirestore() {
    const clientId = 'elizabeth-001'; // Cambia por el ID real del cliente
    
    // Leer datos de localStorage
    const completedDays = JSON.parse(localStorage.getItem('fitnessCompletedDays')) || [];
    const cargas = JSON.parse(localStorage.getItem('fitnessCargas')) || {};
    const startDate = localStorage.getItem('fitnessStartDate') || new Date().toISOString().split('T')[0];
    const evaluaciones = {
        week1: JSON.parse(localStorage.getItem('evaluacion_semana1')) || null,
        week2: JSON.parse(localStorage.getItem('evaluacion_semana2')) || null,
        week4: JSON.parse(localStorage.getItem('evaluacion_semana4')) || null
    };
    const checkins = JSON.parse(localStorage.getItem('checkinRespuestas')) || [];
    
    // Construir el objeto a guardar en Firestore
    const clienteData = {
        name: "Elizabeth",
        pin: "2929",
        program: "Fuerza y Composición 28 días",
        startDate: startDate,
        initialWeight: 95.8,
        initialMuscle: 29.3,
        initialFat: 42.6,
        diagnosis: "Reducir grasa corporal preservando masa muscular.",
        completedDays: completedDays,
        cargas: cargas,
        evaluations: evaluaciones,
        checkins: checkins,
        lastAccess: new Date().toISOString()
    };
    
    try {
        await db.collection('clients').doc(clientId).set(clienteData);
        console.log('✅ Datos migrados a Firestore correctamente');
        alert('✅ Migración completada. Ahora los datos están en la nube.');
    } catch (error) {
        console.error('❌ Error al migrar:', error);
        alert('❌ Error al migrar. Revisa la consola.');
    }
}

// Ejecutar la migración (solo una vez)
// Puedes llamar a esta función desde la consola cuando quieras:
// migrarDatosAFirestore();