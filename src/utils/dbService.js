// src/utils/dbService.js (Example for Firebase Firestore)
import { db } from '../firebase'; // Assuming you have your Firebase config initialized
import { doc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import { collection } from 'firebase/firestore';

const mesasCollection = collection(db, 'mesas');
const historialMesasCollection = collection(db, 'mesas_historial');

export const deleteMesa = async (mesaId) => {
  try {
    await deleteDoc(doc(mesasCollection, mesaId));
    console.log(`Mesa con ID ${mesaId} eliminada correctamente.`);
  } catch (error) {
    console.error("Error al eliminar la mesa:", error);
    throw error;
  }
};

export const moveMesaToHistory = async (mesaId, mesaData) => {
  try {
    // Get the current mesa data to ensure we have all fields before moving
    const mesaDoc = await getDoc(doc(mesasCollection, mesaId));
    if (mesaDoc.exists()) {
      const dataToMove = { ...mesaDoc.data(), ...mesaData, movedAt: new Date() }; // Add a timestamp for when it was moved
      await setDoc(doc(historialMesasCollection, mesaId), dataToMove);
      console.log(`Mesa con ID ${mesaId} movida al historial.`);
    } else {
      console.warn(`Mesa con ID ${mesaId} no encontrada para mover al historial.`);
    }
  } catch (error) {
    console.error("Error al mover la mesa al historial:", error);
    throw error;
  }
};