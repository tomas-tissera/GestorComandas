// useComandas.js
import { ref, push, onValue, remove ,update } from "firebase/database";
import { database } from "../firebase";
import React, { useState, useEffect } from 'react';

// Leer las comandas desde Firebase
export function useComandas() {
  const [comandas, setComandas] = useState([]);

  useEffect(() => {
    const comandasRef = ref(database, "comandas/");
    const unsubscribe = onValue(comandasRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsed = Object.entries(data).map(([id, value]) => ({
          id,
          nombre: value.nombre,
          fechaPago: value.fechaPago,
          horaPago: value.horaPago,
          metodoPago: value.metodoPago,
          cambio: value.cambio,
          cobrado: value.cobrado,
          
          productos: value.productos || [],
          estado: value.estado || "Sala", // Asegúrate de mantener el estado
        }));
        setComandas(parsed);
      } else {
        setComandas([]);
      }
    });

    return () => unsubscribe();
  }, []);

  return comandas;
}

export async function guardarComanda(comanda) {
    const comandasRef = ref(database, "comandas/");
    // Usamos `push` para crear una nueva comanda única
    const newComandaRef = await push(comandasRef, comanda);
    console.log("Comanda guardada con ID:", newComandaRef.key);
    return newComandaRef.key; // Este es el id real generado por Firebase
  }
  
// Actualizar una comanda específica
export async function actualizarComanda(id, updatedComanda) {
  const comandaRef = ref(database, `comandas/${id}`);
  
  // Si la comanda ha sido pagada, se añaden las fechas y la hora de pago
  if (updatedComanda.estadoPago === "pagado") {
    updatedComanda.fechaPago = updatedComanda.fechaPago || new Date().toLocaleDateString();
    updatedComanda.horaPago = updatedComanda.horaPago || new Date().toLocaleTimeString();
  }

  try {
    await update(comandaRef, updatedComanda);
    console.log("✅ Comanda actualizada correctamente");
  } catch (error) {
    console.error("❌ Error al actualizar la comanda en Firebase:", error);
  }
}
export const eliminarComanda = async (id) => {
  try {
    const comandaRef = ref(database, `comandas/${id}`);
    await remove(comandaRef);
    console.log("✅ Comanda eliminada correctamente");
  } catch (error) {
    console.error("❌ Error al eliminar la comanda de Firebase:", error);
  }
};
