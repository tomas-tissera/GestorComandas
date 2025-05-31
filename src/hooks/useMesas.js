// useMesas.js
import { useEffect, useState } from "react";
import { ref, onValue, push } from "firebase/database";
import { database } from "../firebase";

// Leer las mesas
export function useMesas() {
  const [mesas, setMesas] = useState([]);

  useEffect(() => {
    const mesasRef = ref(database, "mesas/");
    const unsubscribe = onValue(mesasRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsed = Object.entries(data).map(([id, value]) => ({
          id,
          nombre: value.nombre,
        }));
        setMesas(parsed);
      } else {
        setMesas([]);
      }
    });

    return () => unsubscribe();
  }, []);

  return mesas;
}

// Agregar una nueva mesa
export function agregarMesa(nombre) {
  const mesasRef = ref(database, "mesas/");
  return push(mesasRef, { nombre });
}
