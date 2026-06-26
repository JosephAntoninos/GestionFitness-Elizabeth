// ================== REPOSITORIO DE DATOS ==================
const CLIENT_ID = 'elizabeth-001';

const ClientRepository = {
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

    async saveProgress(completedDays, cargas) {
        try {
            await db.collection('clients').doc(CLIENT_ID).update({
                completedDays: completedDays,
                cargas: cargas,
                lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ Progreso guardado en Firestore con timestamp');
        } catch (error) {
            console.error('❌ Error al guardar progreso:', error);
            throw error;
        }
    },

    async saveEvaluation(weekKey, evaluationData) {
        try {
            await db.collection('clients').doc(CLIENT_ID).update({
                [`evaluations.${weekKey}`]: evaluationData,
                lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log(`✅ Evaluación ${weekKey} guardada en Firestore`);
        } catch (error) {
            console.error('❌ Error al guardar evaluación:', error);
            throw error;
        }
    },

    async saveCheckin(checkinData) {
        try {
            await db.collection('clients').doc(CLIENT_ID).update({
                checkins: firebase.firestore.FieldValue.arrayUnion(checkinData),
                lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ Check-in guardado en Firestore');
        } catch (error) {
            console.error('❌ Error al guardar check-in:', error);
            throw error;
        }
    },

    async updateProfile(profileData) {
        try {
            await db.collection('clients').doc(CLIENT_ID).update(profileData);
            console.log('✅ Perfil actualizado en Firestore');
        } catch (error) {
            console.error('❌ Error al actualizar perfil:', error);
            throw error;
        }
    },

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

window.ClientRepository = ClientRepository;
