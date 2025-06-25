const firebaseConfig = {
    apiKey: "AIzaSyB_2cdT2iDLN81N-XfhqZ3wp4W8mYH9HAM",
    authDomain: "sistemapontoeletronico.firebaseapp.com",
    projectId: "sistemapontoeletronico",
    storageBucket: "sistemapontoeletronico.firebasestorage.app",
    messagingSenderId: "646291419473",
    appId: "1:646291419473:web:b6c9cc66aba24cc55f2370"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Exportar para uso global
window.firebaseApp = app;
window.firebaseAuth = auth;
window.firebaseDb = db;

console.log("Firebase inicializado com sucesso!");

