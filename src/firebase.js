// src/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

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

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app); // 👈 Asegurate de tener esta línea
const analytics = getAnalytics(app);

// 👇 Esta línea es la clave
export { database };
