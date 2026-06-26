// ================== MIGRACIÓN DE LOCALSTORAGE A FIRESTORE ==================
async function migrarDatosAFirestore() {
    const clientId = 'elizabeth-001';
    
    const completedDays = JSON.parse(localStorage.getItem('fitnessCompletedDays')) || [];
    const cargas = JSON.parse(localStorage.getItem('fitnessCargas')) || {};
    const startDate = localStorage.getItem('fitnessStartDate') || new Date().toISOString().split('T')[0];
    const evaluaciones = {
        week1: JSON.parse(localStorage.getItem('evaluacion_semana1')) || null,
        week2: JSON.parse(localStorage.getItem('evaluacion_semana2')) || null,
        week4: JSON.parse(localStorage.getItem('evaluacion_semana4')) || null
    };
    const checkins = JSON.parse(localStorage.getItem('checkinRespuestas')) || [];
    
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
        lastAccess: new Date().toISOString(),
        lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
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

// Función para agregar lastUpdate a documentos existentes (ejecutar una vez)
async function migrarLastUpdate() {
    try {
        const snapshot = await db.collection('clients').get();
        snapshot.forEach(doc => {
            db.collection('clients').doc(doc.id).update({
                lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
        console.log('✅ Campo lastUpdate agregado a todos los clientes.');
    } catch (error) {
        console.error('❌ Error al migrar lastUpdate:', error);
    }
}

// Ejecutar desde consola: migrarDatosAFirestore() o migrarLastUpdate()
