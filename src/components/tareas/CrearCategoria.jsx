import React, { useState } from "react";
import { ref, push } from "firebase/database";
import { database } from "../../firebase";
// import "./CrearCategoria.css";

export default function CrearCategoria() {
  const [categoria, setCategoria] = useState({
    nombre: "",
    descripcion: "",
    imagen: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!categoria.nombre.trim()) {
      alert("El nombre es obligatorio");
      return;
    }

    try {
      const categoriasRef = ref(database, "categorias/");
      await push(categoriasRef, categoria);
      alert("✅ Categoría guardada correctamente");

      setCategoria({ nombre: "", descripcion: "", imagen: "" });
    } catch (error) {
      console.error("❌ Error al guardar categoría:", error);
    }
  };

  return (
    <form className="form-categoria" onSubmit={handleSubmit}>
      <h2>Crear Categoría</h2>

      <div className="form-group">
        <label>Nombre:</label>
        <input
          type="text"
          value={categoria.nombre}
          onChange={(e) => setCategoria({ ...categoria, nombre: e.target.value })}
        />
      </div>

      <button type="submit" className="btn-guardar">Guardar Categoría</button>
    </form>
  );
}
