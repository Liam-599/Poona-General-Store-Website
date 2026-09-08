// firebase-config.js
// Paste your own Firebase project config here (see setup instructions).
// You get these values from: Firebase Console > Project Settings > Your apps > Web app config.

const firebaseConfig = {
  apiKey: "AIzaSyBoHwG8GSSK_UwBfTFX8fbmMuuRWpzSpvg",
  authDomain: "poonageneralstore-9ad66.firebaseapp.com",
  projectId: "poonageneralstore-9ad66",
  storageBucket: "poonageneralstore-9ad66.firebasestorage.app",
  messagingSenderId: "1020129420066",
  appId: "1:1020129420066:web:7fb65ddb4cf93f0978bb7b"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
