import React, { useState, useEffect, useCallback } from "react";
import { useMesas } from "../../hooks/useMesas";
import { guardarComanda } from "../../hooks/useComandas";
import { useProductos } from "../../hooks/useProductos";
import { auth } from "../../firebase";
import styles from "../../css/ModalAddTask.module.css";

export default function ModalAddTask({ onClose, onAdd, onEdit, taskToEdit }) {
  const mesas = useMesas();
  const productosDisponibles = useProductos();
  const isEditing = !!taskToEdit;
  const [taskDetails, setTaskDetails] = useState({
    nombre: "",
    productos: [],
  });

  useEffect(() => {
    if (isEditing && taskToEdit) {
      setTaskDetails({
        nombre: taskToEdit.nombre || "",
        productos: taskToEdit.productos ? taskToEdit.productos.map(p => ({ ...p })) : [],
      });
    } else {
      setTaskDetails({ nombre: "", productos: [] });
    }
  }, [isEditing, taskToEdit]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setTaskDetails((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleAddProduct = useCallback((productId) => {
    setTaskDetails((prev) => {
      const existingIndex = prev.productos.findIndex(p => p.productoId === productId);
  
      if (existingIndex !== -1) {
        const updatedProductos = prev.productos.map((producto, index) =>
          index === existingIndex
            ? { ...producto, cantidad: producto.cantidad + 1 }
            : producto
        );
  
        return { ...prev, productos: updatedProductos };
      } else {
        const product = productosDisponibles.find(p => p.id === productId);
        if (!product) return prev;
        const newProducto = {
          productoId: productId,
          cantidad: 1,
          aclaracion: "",
          nombre: product.nombre,
          precio: product.precio
        };
  
        return { ...prev, productos: [...prev.productos, newProducto] };
      }
    });
  }, [productosDisponibles]);

  const handleRemoveProduct = useCallback((index) => {
    setTaskDetails((prev) => {
      const newProductos = [...prev.productos];
      newProductos.splice(index, 1);
      return { ...prev, productos: newProductos };
    });
  }, []);

  const handleProductChange = useCallback((index, e) => {
    const { name, value } = e.target;
    setTaskDetails((prev) => {
      const updatedProductos = [...prev.productos];
      updatedProductos[index][name] = parseInt(value, 10);
      return { ...prev, productos: updatedProductos };
    });
  }, []);

  const handleAclaracionChange = useCallback((index, e) => {
    setTaskDetails((prev) => {
      const updatedProductos = [...prev.productos];
      updatedProductos[index].aclaracion = e.target.value;
      return { ...prev, productos: updatedProductos };
    });
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!taskDetails.nombre || !taskDetails.productos.length) {
      alert("Debes seleccionar una mesa y al menos un producto.");
      return;
    } 
    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert("Error: no hay usuario autenticado.");
      return;
    }
    const payload = {
      ...taskDetails,
      meseroId: currentUser.uid, 
      ...(isEditing && { id: taskToEdit.id }),
    };

    if (isEditing) {
      onEdit?.(payload);
    } else {
      guardarComanda(payload);
    }
    onClose();
  }, [isEditing, taskToEdit, taskDetails, onEdit, onAdd, onClose]);

  const calculateTotal = () => {
    return taskDetails.productos.reduce((total, producto) => {
      return total + producto.precio * producto.cantidad;
    }, 0);
  };

  const productosPorCategoria = productosDisponibles.reduce((acc, producto) => {
    if (!acc[producto.categoria]) {
      acc[producto.categoria] = [];
    }
    acc[producto.categoria].push(producto);
    return acc;
  }, {});

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3>{isEditing ? "Editar Comanda" : "Agregar Comanda"}</h3>

        <form onSubmit={handleSubmit}>
          <div className={styles.opcionMesaDiv}>
            <label>Mesa</label>
            <select
              name="nombre"
              value={taskDetails.nombre}
              onChange={handleInputChange}
              required
              className={styles.opcionMesa}
            >
              <option value="">Seleccionar mesa</option>
              {mesas.map((mesa) => (
                <option key={mesa.id} value={mesa.nombre}>
                  {mesa.nombre}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: "20px" }}>
            <div style={{ flex: 1 }}>
              <h4>Productos disponibles</h4>
              {Object.keys(productosPorCategoria).map((categoria) => (
                <div key={categoria}>
                  <h5>{categoria}</h5>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {productosPorCategoria[categoria].map((producto) => (
                      <div
                        key={producto.id}
                        onClick={() => handleAddProduct(producto.id)}
                        className={styles.productCard}
                        style={{
                          backgroundImage: producto.imagen ? `url(${producto.imagen})` : undefined,
                          color: producto.imagen ? 'white' : 'black',
                          textShadow: producto.imagen ? '0 0 5px rgba(0,0,0,0.7)' : 'none',
                        }}
                        title={`${producto.nombre} - $${producto.precio}`}
                      >
                        {producto.nombre} - ${producto.precio}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ flex: 1 }}>
              <h4>Comanda actual</h4>
              {taskDetails.productos.length === 0 ? (
                <p>No hay productos agregados.</p>
              ) : (
                taskDetails.productos.map((producto, index) => {
                  const prod = productosDisponibles.find((p) => p.id === producto.productoId);
                  return (
                    <div key={index} className={styles.commandItem}>
                      <strong>{prod?.nombre}</strong>
                      <div>
                        <input
                          type="number"
                          name="cantidad"
                          min="1"
                          value={producto.cantidad}
                          onChange={(e) => handleProductChange(index, e)}
                          style={{ width: "60px", margin: "5px 0" }}
                        />
                        <span> x ${producto.precio}</span>
                        <span> = ${producto.precio * producto.cantidad}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(index)}
                          className={styles.deleteButton}
                          title="Eliminar producto"
                        >
                          &times;
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Aclaración"
                        value={producto.aclaracion}
                        onChange={(e) => handleAclaracionChange(index, e)}
                        style={{ width: "100%", padding: "5px", marginTop: "5px" }}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div style={{ marginTop: "20px", fontWeight: "bold" }}>
            <h4>Total: ${calculateTotal()}</h4>
          </div>

          <button type="submit" className={styles.submitButton}>
            {isEditing ? "Guardar Cambios" : "Crear Comanda"}
          </button>
        </form>

        <button onClick={onClose} className={styles.cancelButton}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
