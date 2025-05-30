// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

// **Importante:** Usa variables de entorno para producción
const firebaseConfig = {
    apiKey: "AIzaSyAzyeb5i4QUDXjPKUxW4wHlbfxsYVwqYTI",
    authDomain: "gestion-comandas-36c3f.firebaseapp.com",
    databaseURL: "https://gestion-comandas-36c3f-default-rtdb.firebaseio.com",
    projectId: "gestion-comandas-36c3f",
    storageBucket: "gestion-comandas-36c3f.appspot.com",
    messagingSenderId: "884678876861",
    appId: "1:884678876861:web:4a2ff182e4100d2d0ea1d4",
    measurementId: "G-D3YME5HB01",
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const database = getDatabase(app); // 👈 Asegurate de tener esta línea

export { auth, db ,database};