// firebase-config.js
// 🔥 Reemplaza con los datos de tu proyecto Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDZKOrTNnOyCsTC-UKNFxEg7EMuRjic1Vc",
    authDomain: "client-os-1cd1a.firebaseapp.com",
    projectId: "client-os-1cd1a",
    storageBucket: "client-os-1cd1a.firebasestorage.app",
    messagingSenderId: "47705613899",
    appId: "1:47705613899:web:9e784c7347cb1cc8ad8fce"
  };

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Obtener instancias
const auth = firebase.auth();
const db = firebase.firestore();

// Habilitar persistencia offline (ya lo tienes, pero si no, agrégalo)
db.enablePersistence()
    .catch(err => console.warn('⚠️ Persistencia offline no disponible:', err));

// Exportar para usar en otros scripts
window.db = db;        // Para acceder desde cualquier script
window.auth = auth;    // Para autenticación (más adelante)