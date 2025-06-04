import React, { useState } from "react";
import { ref, push } from "firebase/database";
import { database } from "../../firebase";
import Swal from "sweetalert2";
import styles from "./CrearCategoria.module.css";

export default function CrearCategoria() {
  const [categoria, setCategoria] = useState({
    nombre: "",
    descripcion: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nombreSinEspacios = categoria.nombre.trim();

    if (!nombreSinEspacios) {
      Swal.fire({
        icon: "warning",
        title: "Campo obligatorio",
        text: "El nombre de la categoría es requerido.",
      });
      return;
    }

    // Formatear el nombre con primera letra en mayúscula y el resto en minúscula
    const nombreFormateado =
      nombreSinEspacios.charAt(0).toUpperCase() +
      nombreSinEspacios.slice(1).toLowerCase();

    try {
      const categoriasRef = ref(database, "categorias/");
      await push(categoriasRef, {
        ...categoria,
        nombre: nombreFormateado,
      });

      Swal.fire({
        icon: "success",
        title: "Categoría guardada",
        text: "La categoría fue agregada correctamente.",
        timer: 2000,
        showConfirmButton: false,
      });

      setCategoria({ nombre: "", descripcion: ""});
    } catch (error) {
      console.error("Error al guardar categoría:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ocurrió un error al guardar la categoría.",
      });
    }
  };

  return (
    <form className={styles.formCategoria} onSubmit={handleSubmit}>
      <h2>Crear Categoría</h2>

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

      <div className={styles.formGroup}>
        <label>Descripción:</label>
        <textarea
          value={categoria.descripcion}
          onChange={(e) =>
            setCategoria({ ...categoria, descripcion: e.target.value })
          }
          className={styles.formDesc}
        />
      </div>

      

      <button type="submit" className={styles.btnGuardar}>
        Guardar Categoría
      </button>
    </form>
  );
}
