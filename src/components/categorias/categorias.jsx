import React, { useEffect, useState } from 'react';
import CrearCategoria from '../tareas/CrearCategoria';
import { useProductos } from '../../hooks/useProductos';
import { useCategorias } from '../../hooks/useCategorias';
import { useAuth } from '../../hooks/useAuth';
import { FaTrash } from 'react-icons/fa';
import styles from '../../css/Categorias.module.css';

import Swal from 'sweetalert2';
import { database } from '../../firebase';
import { ref, remove, push } from 'firebase/database';

const Categorias = () => {
  const productos = useProductos();
  const categorias = useCategorias();
  const usuario = useAuth();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (Array.isArray(productos) && Array.isArray(categorias)) {
      setLoading(false);
    }
  }, [productos, categorias]);

  const handleEliminarCategoria = async (categoria) => {
    if (!usuario) {
      Swal.fire({
        icon: 'error',
        title: 'Acceso denegado',
        text: 'Debes iniciar sesión para eliminar categorías.',
      });
      return;
    }

    const productosAsociados = productos.filter(
      (prod) => prod.categoriaId === categoria.id
    );

    if (productosAsociados.length > 0) {
      Swal.fire({
        icon: 'error',
        title: 'No se puede eliminar',
        text: 'La categoría tiene productos asociados.',
      });
      return;
    }

    const confirmacion = await Swal.fire({
      title: `¿Eliminar categoría "${categoria.nombre}"?`,
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const historialRef = ref(database, 'historial/categorias');
      await push(historialRef, {
        ...categoria,
        eliminadoPor: {
          uid: usuario.uid,
          email: usuario.email,
          nombre: usuario.displayName || 'Sin nombre'
        },
        eliminadoEn: new Date().toISOString(),
      });

      await remove(ref(database, `categorias/${categoria.id}`));

      Swal.fire('Eliminado', 'La categoría ha sido eliminada.', 'success');
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      Swal.fire('Error', 'No se pudo eliminar la categoría.', 'error');
    }
  };

  // Si productos es null (cargando) mostramos loader dentro de cada categoría
  const productosCargando = productos === null;

  return (
    <div className={styles.contenedor}>
      <CrearCategoria />
      <h2>Categorías y Productos</h2>

      {loading ? (
        <div className={styles.loaderContainer}>
          <div className={styles.loader}></div>
          <p>Cargando Categorías y Productos...</p>
        </div>
      ) : (
        <div className={styles.gridCategorias}>
          {categorias.length === 0 ? (
            <p>No hay categorías cargadas.</p>
          ) : (
            categorias.map((categoria) => {
              const productosDeCategoria = productosCargando
                ? []
                : productos.filter((prod) => prod.categoriaId === categoria.id);

              return (
                <div key={categoria.id} className={styles.categoriaCard}>
                  <div className={styles.categoriaTitle}>
                    <h3>{categoria.nombre}</h3>
                    <FaTrash
                      className={styles.categoriaTrash}
                      onClick={() => handleEliminarCategoria(categoria)}
                      title="Eliminar categoría"
                    />
                  </div>

                  {productosCargando ? (
                    <div className={styles.loaderPequeno}></div> // loader pequeño para productos
                  ) : productosDeCategoria.length > 0 ? (
                    <ul>
                      {productosDeCategoria.map((producto) => (
                        <li key={producto.id}>{producto.nombre}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>No hay productos en esta categoría.</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default Categorias;
