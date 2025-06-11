import React, { useState, useMemo, useEffect } from 'react';
import CrearProducto from '../tareas/CrearProducto';
import { useProductos } from '../../hooks/useProductos';
import { useCategorias } from '../../hooks/useCategorias';
import { useComandas } from '../../hooks/useComandas';
import styles from '../../css/Productos.module.css';
import { FaEdit, FaTrash } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { db, database, auth } from '../../firebase';
import { ref, remove, push, update } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';

const Productos = () => {
  const productos = useProductos() || [];
  const categorias = useCategorias() || [];
  const comandas = useComandas() || [];

  const [busqueda, setBusqueda] = useState('');
  const [precioMaximo, setPrecioMaximo] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [productoEditando, setProductoEditando] = useState(null);
  const [formData, setFormData] = useState({});
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const productosConVentas = useMemo(() => {
    const conteo = {};

    comandas.forEach(comanda => {
      comanda.productos.forEach(({ productoId, cantidad }) => {
        if (!conteo[productoId]) conteo[productoId] = 0;
        conteo[productoId] += cantidad;
      });
    });

    return productos.map(producto => ({
      ...producto,
      vecesVendidas: conteo[producto.id] || 0,
    }));
  }, [productos, comandas]);

  const productosFiltrados = useMemo(() => {
    return productosConVentas.filter(producto => {
      const cumpleBusqueda = producto.nombre.toLowerCase().includes(busqueda.toLowerCase());
      const cumpleCategoria = filtroCategoria ? producto.categoriaId === filtroCategoria : true;
      const cumplePrecio = precioMaximo ? parseFloat(producto.precio) <= parseFloat(precioMaximo) : true;
      return cumpleBusqueda && cumpleCategoria && cumplePrecio;
    });
  }, [productosConVentas, busqueda, filtroCategoria, precioMaximo]);

  const abrirModalEdicion = (producto) => {
    setProductoEditando(producto);
    setFormData(producto);
  };

  const cerrarModal = () => {
    setProductoEditando(null);
    setFormData({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const guardarCambios = async () => {
    if (!user) {
      Swal.fire({
        icon: 'error',
        title: 'Acceso denegado',
        text: 'Debes iniciar sesión para editar productos.',
      });
      return;
    }

    try {
      const productoRef = ref(database, `productos/${formData.id}`);
      await update(productoRef, {
        nombre: formData.nombre,
        precio: parseFloat(formData.precio),
        imagen: formData.imagen,
        categoriaId: formData.categoriaId,
        elementos: formData.elementos || '',
      });

      Swal.fire('Guardado', 'El producto se actualizó correctamente.', 'success');
      cerrarModal();
    } catch (error) {
      console.error('Error al guardar producto:', error);
      Swal.fire('Error', 'No se pudo actualizar el producto.', 'error');
    }
  };

  const eliminarProducto = async (producto) => {
    if (!user) {
      Swal.fire({
        icon: 'error',
        title: 'Acceso denegado',
        text: 'Debes iniciar sesión para eliminar productos.',
      });
      return;
    }

    const result = await Swal.fire({
      title: `¿Estás seguro de eliminar "${producto.nombre}"?`,
      text: "Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      const historialRef = ref(database, 'historial/productos');
      await push(historialRef, {
        ...producto,
        eliminadoPor: user.uid,
        eliminadoEn: new Date().toISOString(),
      });

      await remove(ref(database, `productos/${producto.id}`));
      Swal.fire('Eliminado!', 'El producto ha sido eliminado.', 'success');
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      Swal.fire('Error!', 'Hubo un error al eliminar el producto.', 'error');
    }
  };

  const nombreCategoria = (categoriaId) => {
    const categoria = categorias.find(c => c.id === categoriaId);
    return categoria ? categoria.nombre : 'Sin categoría';
  };

  const resetearFiltros = () => {
    setBusqueda('');
    setFiltroCategoria('');
    setPrecioMaximo('');
  };

  return (
    <div className={styles.contenedor}>
      <CrearProducto />
      <h2>Productos</h2>

      <div className={styles.filtros}>
        <input
          type="text"
          placeholder="Buscar producto por nombre..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className={styles.buscador}
        />

        <select
          value={filtroCategoria}
          onChange={e => setFiltroCategoria(e.target.value)}
          className={styles.selectCategoria}
        >
          <option value="">Todas las categorías</option>
          {categorias.map(categoria => (
            <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>
          ))}
        </select>

        <input
          type="number"
          min="0"
          placeholder="Precio máximo"
          value={precioMaximo}
          onChange={e => setPrecioMaximo(e.target.value)}
          className={styles.inputPrecio}
        />

        <button onClick={resetearFiltros} className={styles.botonReset}>
          Eliminar filtros <FaTrash />
        </button>
      </div>

      {productosFiltrados.length === 0 ? (
        <p>No se encontraron productos con esos filtros.</p>
      ) : (
        <ul className={styles.productosList}>
          {productosFiltrados.map(producto => (
            
            <li key={producto.id} className={styles.productoItem}>
              <div className={styles.botonesAcciones}>
                    <button
                      className={styles.editButton}
                      onClick={() => abrirModalEdicion(producto)}
                      title="Editar producto"
                    >
                      <FaEdit />
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={() => eliminarProducto(producto)}
                      title="Eliminar producto"
                    >
                      <FaTrash />
                    </button>
                  </div>
              <img
                src={producto.imagen}
                alt={producto.nombre}
                className={styles.productoImagen}
              />
              <div className={styles.productoInfo}>
                <div>

                  <h4>{producto.nombre}</h4>

                  
                </div>

                <p>💵 Precio: ${parseFloat(producto.precio).toFixed(2)}</p>
                <p>📂 Categoría: {nombreCategoria(producto.categoriaId)}</p>
                <p>📈 Vendido: {producto.vecesVendidas} veces</p>
                {producto.elementos && (
                  <p>🧾 Elementos: {producto.elementos}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {productoEditando && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Editar Producto</h3>
            <label>
              Nombre:
              <input
                type="text"
                name="nombre"
                value={formData.nombre || ''}
                onChange={handleChange}
              />
            </label>
            <label>
              Precio:
              <input
                type="number"
                name="precio"
                value={formData.precio || ''}
                onChange={handleChange}
              />
            </label>
            <label>
              Imagen URL:
              <input
                type="text"
                name="imagen"
                value={formData.imagen || ''}
                onChange={handleChange}
              />
            </label>
            <label>
              Categoría:
              <select
                name="categoriaId"
                value={formData.categoriaId || ''}
                onChange={handleChange}
                className={styles.selectCategoria}
              >
                <option value="">Selecciona una categoría</option>
                {categorias.map(categoria => (
                  <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>
                ))}
              </select>
            </label>
            <label>
              Elementos:
              <textarea
                name="elementos"
                value={formData.elementos || ''}
                onChange={handleChange}
              />
            </label>

            <div className={styles.modalActions}>
              <button onClick={guardarCambios} className={styles.botonGuardar}>Guardar</button>
              <button onClick={cerrarModal} className={styles.botonCancelar}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Productos;
