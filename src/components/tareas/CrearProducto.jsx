import React, { useState, useEffect } from "react";
import { ref, push, onValue } from "firebase/database";
import { database } from "../../firebase";
import "./CrearProducto.css";

export default function CrearProducto() {
  const [producto, setProducto] = useState({
    nombre: "",
    precio: "",
    elementos: "",
    imagen: "",
    categoriaId: "", // Este es el id de la categoría seleccionada
  });

  const [categorias, setCategorias] = useState([]);

  // Cargar categorías desde Firebase
  useEffect(() => {
    const categoriasRef = ref(database, "categorias/");
    onValue(categoriasRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsed = Object.entries(data).map(([id, value]) => ({
          id,
          ...value, // Incluye tanto el ID como los demás datos de la categoría
        }));
        setCategorias(parsed);
      } else {
        setCategorias([]);
      }
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar que todos los campos estén completos
    if (!producto.nombre.trim() || !producto.precio || !producto.categoriaId) {
      alert("Por favor completa todos los campos obligatorios.");
      return;
    }

    // Formatear el producto a enviar a la base de datos
    const productoConCategoria = {
      ...producto,
      categoria: categorias.find((cat) => cat.id === producto.categoriaId)?.nombre, // Añadir nombre de la categoría al producto
    };

    try {
      const productosRef = ref(database, "productos/");
      await push(productosRef, productoConCategoria); // Guardar el producto con la categoría
      alert("✅ Producto guardado correctamente");

      setProducto({
        nombre: "",
        precio: "",
        elementos: "",
        imagen: "",
        categoriaId: "", // Limpiar formulario después de guardar
      });
    } catch (error) {
      console.error("❌ Error al guardar el producto:", error);
    }
  };

  return (
    <form className="form-producto" onSubmit={handleSubmit}>
      <h2>Crear Producto</h2>

      <div className="form-group">
        <label>Nombre:</label>
        <input
          type="text"
          value={producto.nombre}
          onChange={(e) => setProducto({ ...producto, nombre: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label>Precio:</label>
        <input
          type="number"
          value={producto.precio}
          onChange={(e) => setProducto({ ...producto, precio: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label>Elementos:</label>
        <textarea
          value={producto.elementos}
          onChange={(e) => setProducto({ ...producto, elementos: e.target.value })}
          placeholder="Ej: Queso, Tomate, Lechuga..."
        />
      </div>

      <div className="form-group">
        <label>Imagen (URL):</label>
        <input
          type="text"
          value={producto.imagen}
          onChange={(e) => setProducto({ ...producto, imagen: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label>Categoría:</label>
        <select
          value={producto.categoriaId}
          onChange={(e) => setProducto({ ...producto, categoriaId: e.target.value })}
        >
          <option value="">Selecciona una categoría</option>
          {categorias.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.nombre}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" className="btn-guardar">Guardar Producto</button>
    </form>
  );
}
