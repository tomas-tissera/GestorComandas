import React from 'react';
import CrearCategoria from '../tareas/CrearCategoria';
import { useProductos } from '../../hooks/useProductos';
import { useCategorias } from '../../hooks/useCategorias';
import styles from '../../css/Categorias.module.css'; // Importar los estilos

const Categorias = () => {
  const productos = useProductos();
  const categorias = useCategorias();

  const productosPorCategoria = categorias.map((categoria) => {
    const productosDeEstaCategoria = productos.filter(
      (prod) => prod.categoriaId === categoria.id
    );
    return {
      ...categoria,
      productos: productosDeEstaCategoria,
    };
  });

  return (
    <div className={styles.contenedor}>
      <CrearCategoria />
      <h2>Categorías y Productos</h2>

      <div className={styles.gridCategorias}>
        {productosPorCategoria.length === 0 ? (
          <p>No hay categorías cargadas.</p>
        ) : (
          productosPorCategoria.map((categoria) => (
            <div key={categoria.id} className={styles.categoriaCard}>
              <h3>{categoria.nombre}</h3>
              {categoria.productos.length > 0 ? (
                <ul>
                  {categoria.productos.map((producto) => (
                    <li key={producto.id}>{producto.nombre}</li>
                  ))}
                </ul>
              ) : (
                <p>No hay productos en esta categoría.</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Categorias;
