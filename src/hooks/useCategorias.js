import { ref, onValue } from "firebase/database";
import { database } from "../firebase";
import { useState, useEffect } from "react";

export function useCategorias() {
  const [categorias, setCategorias] = useState(null); // null indica cargando

  useEffect(() => {
    const categoriasRef = ref(database, "categorias/");
    const unsubscribe = onValue(categoriasRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsed = Object.entries(data).map(([id, value]) => ({
          id,
          ...value,
        }));
        setCategorias(parsed);
      } else {
        setCategorias([]);
      }
    });

    return () => unsubscribe();
  }, []);

  return categorias;
}
