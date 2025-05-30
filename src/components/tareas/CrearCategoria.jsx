// CrearCategoria.jsx
import React, { useState } from "react";
import { ref, push } from "firebase/database";
import { database } from "../../firebase";
import styles from "./CrearCategoria.module.css";

export default function CrearCategoria() {
  const [categoria, setCategoria] = useState({
    nombre: "",
    descripcion: "",
    imagen: "",
  });

  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });

  const mostrarMensaje = (texto, tipo = "exito") => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje({ tipo: "", texto: "" }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!categoria.nombre.trim()) {
      mostrarMensaje("⚠️ El nombre es obligatorio", "error");
      return;
    }

    try {
      const categoriasRef = ref(database, "categorias/");
      await push(categoriasRef, categoria);
      mostrarMensaje("✅ Categoría guardada correctamente", "exito");
      setCategoria({ nombre: "", descripcion: "", imagen: "" });
    } catch (error) {
      console.error("❌ Error al guardar categoría:", error);
      mostrarMensaje("❌ Error al guardar categoría", "error");
    }
  };

  return (
    <form className={styles.formCategoria} onSubmit={handleSubmit}>
      <h2>Crear Categoría</h2>

      {mensaje.texto && (
        <div
          className={`${styles.alerta} ${
            mensaje.tipo === "error" ? styles.error : styles.exito
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      <div className={styles.formGroup}>
        <label>Nombre:</label>
        <input
          type="text"
          value={categoria.nombre}
          onChange={(e) =>
            setCategoria({ ...categoria, nombre: e.target.value })
          }
        />
      </div>

      <button type="submit" className={styles.btnGuardar}>
        Guardar Categoría
      </button>
    </form>
  );
}
