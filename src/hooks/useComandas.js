// useComandas.js
import { ref, push, onValue, remove, update } from "firebase/database";
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
          // Mantén los campos existentes
          nombre: value.nombre, // Podría ser el nombre de la mesa o un identificador
          fechaPago: value.fechaPago,
          horaPago: value.horaPago,
          metodoPago: value.metodoPago,
          cambio: value.cambio,
          cobrado: value.cobrado,
          meseroId: value.meseroId,
          
          // Asegúrate de que `productos` sea un array, y si tiene `notas`, que también exista.
          productos: value.productos || [], 
          
          // Campos clave para el cocinero:
          estado: value.estado || "Sala", // Estado de la comanda (Sala, Cocina, Listo, Entregado, Cancelado, Pagado)
          tableNumber: value.tableNumber || value.nombre, // Asume un campo `tableNumber` o usa `nombre`
          notasComanda: value.notasComanda || '', // Notas generales para la comanda
          receivedAt: value.receivedAt || new Date().toISOString(), // Timestamp de creación de la comanda
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
    // Añade el timestamp de creación cuando se guarda
    const comandaConTimestamp = { ...comanda, receivedAt: new Date().toISOString() };
    const newComandaRef = await push(comandasRef, comandaConTimestamp);
    console.log("Comanda guardada con ID:", newComandaRef.key);
    return newComandaRef.key; // Este es el id real generado por Firebase
}
 
// Actualizar una comanda específica
export async function actualizarComanda(id, updatedComanda) {
  const comandaRef = ref(database, `comandas/${id}`);
  
  // Si la comanda ha sido pagada, se añaden las fechas y la hora de pago
  if (updatedComanda.estadoPago === "pagado" || updatedComanda.estado === "pagado") { // Agregué el check de estado para ser más robusto
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

// Esta función sigue siendo útil para otras vistas que requieran comandas no pagadas
export function useComandasNoPagadas() {
  const [comandas, setComandas] = useState([]);

  useEffect(() => {
    const comandasRef = ref(database, "comandas/");
    const unsubscribe = onValue(comandasRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const filtered = Object.entries(data)
          .map(([id, value]) => ({ id, ...value }))
          .filter((comanda) => comanda.estado !== "pagado");
        setComandas(filtered);
      } else {
        setComandas([]);
      }
    });

    return () => unsubscribe();
  }, []);

  return comandas;
}