const firebaseConfig = {
    apiKey: "AIzaSyDZKOrTNnOyCsTC-UKNFxEg7EMuRjic1Vc",
    authDomain: "client-os-1cd1a.firebaseapp.com",
    projectId: "client-os-1cd1a",
    storageBucket: "client-os-1cd1a.firebasestorage.app",
    messagingSenderId: "47705613899",
    appId: "1:47705613899:web:9e784c7347cb1cc8ad8fce"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

db.enablePersistence()
    .catch(err => console.warn('⚠️ Persistencia offline no disponible:', err));

window.db = db;
window.auth = auth;
