// ================== REPOSITORIO DE DATOS ==================
// Centraliza todas las operaciones de Firestore para Client OS

// ID del cliente (hardcodeado temporalmente)
const CLIENT_ID = 'elizabeth-001';

const ClientRepository = {
    /**
     * Carga todos los datos del cliente desde Firestore
     */
    async loadClient() {
        try {
            const doc = await db.collection('clients').doc(CLIENT_ID).get();
            if (doc.exists) {
                console.log('✅ Datos cargados desde Firestore');
                return doc.data();
            } else {
                console.warn('⚠️ Documento no encontrado en Firestore');
                return null;
            }
        } catch (error) {
            console.error('❌ Error al cargar cliente:', error);
            return null;
        }
    },

    /**
     * Guarda el progreso (días completados y cargas)
     */
    async saveProgress(completedDays, cargas) {
        try {
            await db.collection('clients').doc(CLIENT_ID).update({
                completedDays: completedDays,
                cargas: cargas,
                lastAccess: new Date().toISOString()
            });
            console.log('✅ Progreso guardado en Firestore');
        } catch (error) {
            console.error('❌ Error al guardar progreso:', error);
            throw error;
        }
    },

    /**
     * Guarda una evaluación (week1, week2, week4)
     */
    async saveEvaluation(weekKey, evaluationData) {
        try {
            await db.collection('clients').doc(CLIENT_ID).update({
                [`evaluations.${weekKey}`]: evaluationData
            });
            console.log(`✅ Evaluación ${weekKey} guardada en Firestore`);
        } catch (error) {
            console.error('❌ Error al guardar evaluación:', error);
            throw error;
        }
    },

    /**
     * Guarda un check-in semanal
     */
    async saveCheckin(checkinData) {
        try {
            await db.collection('clients').doc(CLIENT_ID).update({
                checkins: firebase.firestore.FieldValue.arrayUnion(checkinData)
            });
            console.log('✅ Check-in guardado en Firestore');
        } catch (error) {
            console.error('❌ Error al guardar check-in:', error);
            throw error;
        }
    },

    /**
     * Actualiza la configuración del cliente (usado por el coach)
     */
    async updateProfile(profileData) {
        try {
            await db.collection('clients').doc(CLIENT_ID).update(profileData);
            console.log('✅ Perfil actualizado en Firestore');
        } catch (error) {
            console.error('❌ Error al actualizar perfil:', error);
            throw error;
        }
    },

    /**
     * Suscripción en tiempo real a cambios del cliente
     */
    subscribeToClient(callback) {
        return db.collection('clients').doc(CLIENT_ID)
            .onSnapshot((doc) => {
                if (doc.exists) {
                    callback(doc.data());
                }
            }, (error) => {
                console.error('❌ Error en suscripción:', error);
            });
    }
};

// Exponer globalmente
window.ClientRepository = ClientRepository;