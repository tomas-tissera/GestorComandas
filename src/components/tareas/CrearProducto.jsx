import React, { useState, useEffect } from "react";
import { ref, push, onValue } from "firebase/database";
import { database, auth } from "../../firebase"; // Import auth
import { onAuthStateChanged } from "firebase/auth"; // Import onAuthStateChanged
import Swal from 'sweetalert2'; // Import SweetAlert2
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
  const [user, setUser] = useState(null); // State to store the current user

  // Listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

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

    // Validar si el usuario está logueado
    if (!user) {
      Swal.fire({
        icon: 'error',
        title: 'Acceso denegado',
        text: 'Debes iniciar sesión para crear productos.',
      });
      return;
    }

    // Validar que todos los campos obligatorios estén completos
    if (!producto.nombre.trim() || !producto.precio || !producto.categoriaId) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor, completa todos los campos obligatorios (Nombre, Precio, Categoría).',
      });
      return;
    }

    // Formatear el producto a enviar a la base de datos
    const productoConMetaData = {
      ...producto,
      categoria: categorias.find((cat) => cat.id === producto.categoriaId)?.nombre, // Añadir nombre de la categoría al producto
      creadoPor: user.uid, // Save the user's ID
      creadoEn: new Date().toISOString(), // Timestamp of creation
    };

    try {
      const productosRef = ref(database, "productos/");
      await push(productosRef, productoConMetaData); // Guardar el producto con la categoría y el ID del creador
      Swal.fire({
        icon: 'success',
        title: '¡Producto guardado!',
        text: 'El producto ha sido guardado correctamente.',
        showConfirmButton: false,
        timer: 1500
      });

      setProducto({
        nombre: "",
        precio: "",
        elementos: "",
        imagen: "",
        categoriaId: "", // Limpiar formulario después de guardar
      });
    } catch (error) {
      console.error("❌ Error al guardar el producto:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error al guardar',
        text: 'Hubo un problema al guardar el producto. Intenta de nuevo.',
      });
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