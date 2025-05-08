// src/hooks/useComandas.js
// src/hooks/useComandas.js

// Importación correcta
import { ref, push, onValue } from "firebase/database";
import { database } from "../firebase"; // Asegúrate de que esta importación es correcta
import React, { useState, useEffect } from 'react';

// Aquí ya no necesitas volver a importar 'database' o cualquier otro módulo más de una vez.


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
          productos: value.productos || [], // Asume que cada comanda tiene productos
        }));
        setComandas(parsed);
      } else {
        setComandas([]);
      }
    });

    return () => unsubscribe(); // Limpiar el listener cuando el componente se desmonte
  }, []);

  return comandas; // Devuelve las comandas leídas
}

export function guardarComanda(comanda) {
  const comandasRef = ref(database, "comandas/");
  return push(comandasRef, comanda);
}
