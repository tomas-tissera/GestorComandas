import { ref, push, onValue, remove } from "firebase/database";
import { database } from "../firebase";
import { useState, useEffect } from "react";

export function useProductos() {
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    const productosRef = ref(database, "productos/");
    const unsubscribe = onValue(productosRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsed = Object.entries(data).map(([id, value]) => ({
          id,
          ...value,
        }));
        setProductos(parsed);
      } else {
        setProductos([]);
      }
    });

    return () => unsubscribe();
  }, []);

  return productos;
}

export async function guardarProducto(producto) {
  const productosRef = ref(database, "productos/");
  const newRef = await push(productosRef, producto);
  return newRef.key;
}
