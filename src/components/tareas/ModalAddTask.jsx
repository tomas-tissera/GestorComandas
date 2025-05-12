import React, { useState, useEffect, useCallback } from "react";
import { useMesas } from "../../hooks/useMesas"; // Hook para obtener mesas
import { guardarComanda } from "../../hooks/useComandas";
import { useProductos } from "../../hooks/useProductos"; // Hook para obtener productos de Firebase

export default function ModalAddTask({ onClose, onAdd, onEdit, taskToEdit }) {
  const mesas = useMesas();
  const productosDisponibles = useProductos(); // Hook para obtener productos de Firebase
  const [nuevaMesa, setNuevaMesa] = useState("");
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

  // Agregar producto con una unidad más, asegurando que no se agregue duplicado
  const handleAddProduct = useCallback((productId) => {
    setTaskDetails((prev) => {
      const existingIndex = prev.productos.findIndex(p => p.productoId === productId);
  
      if (existingIndex !== -1) {
        // Producto ya existe: actualizar su cantidad de forma inmutable
        const updatedProductos = prev.productos.map((producto, index) =>
          index === existingIndex
            ? { ...producto, cantidad: producto.cantidad + 1 }
            : producto
        );
  
        return { ...prev, productos: updatedProductos };
      } else {
        // Nuevo producto: buscarlo y agregarlo
        const product = productosDisponibles.find(p => p.id === productId);
        if (!product) return prev; // protección contra errores
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
  

  const handleProductChange = useCallback((index, e) => {
    const { name, value } = e.target;
    const updatedProductos = [...taskDetails.productos];
    updatedProductos[index][name] = parseInt(value, 10);
    setTaskDetails({ ...taskDetails, productos: updatedProductos });
  }, [taskDetails.productos]);

  const handleAclaracionChange = useCallback((index, e) => {
    const updatedProductos = [...taskDetails.productos];
    updatedProductos[index].aclaracion = e.target.value;
    setTaskDetails({ ...taskDetails, productos: updatedProductos });
  }, [taskDetails.productos]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!taskDetails.nombre || !taskDetails.productos.length) {
      alert("Debes seleccionar una mesa y al menos un producto.");
      return;
    } 

    const payload = {
      ...taskDetails,
      ...(isEditing && { id: taskToEdit.id }), // solo agrega 'id' si estás editando
    };

    if (isEditing) {
      onEdit?.(payload); // Esto depende si querés implementar edición en Firebase también
    } else {
      guardarComanda(payload);
    }
    onClose();
  }, [isEditing, taskToEdit, taskDetails, onEdit, onAdd, onClose]);

  // Calcular el total de la comanda
  const calculateTotal = () => {
    return taskDetails.productos.reduce((total, producto) => {
      return total + producto.precio * producto.cantidad; // Sumar el precio por cantidad
    }, 0);
  };

  // Agrupamos los productos por categoría
  const productosPorCategoria = productosDisponibles.reduce((acc, producto) => {
    if (!acc[producto.categoria]) {
      acc[producto.categoria] = [];
    }
    acc[producto.categoria].push(producto);
    return acc;
  }, {});

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h3>{isEditing ? "Editar Comanda" : "Agregar Comanda"}</h3>

        <form onSubmit={handleSubmit}>
          <div>
            <label>Mesa</label>
            <select
              name="nombre"
              value={taskDetails.nombre}
              onChange={handleInputChange}
              required
              style={{ width: "100%", padding: "8px", marginBottom: "15px" }}
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
                        style={productCardStyle}
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
                    <div key={index} style={commandItemStyle}>
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

          <button type="submit" style={submitButtonStyle}>
            {isEditing ? "Guardar Cambios" : "Crear Comanda"}
          </button>
        </form>

        <button onClick={onClose} style={cancelButtonStyle}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

// Styles
const overlayStyle = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalStyle = {
  backgroundColor: "#fff",
  padding: "20px",
  borderRadius: "10px",
  width: "800px",
  maxHeight: "90vh",
  overflowY: "auto",
};

const productCardStyle = {
  width: "100px",
  border: "1px solid #ccc",
  borderRadius: "6px",
  padding: "10px",
  textAlign: "center",
  backgroundColor: "#f9f9f9",
  cursor: "pointer",
};

const commandItemStyle = {
  borderBottom: "1px solid #ddd",
  paddingBottom: "10px",
  marginBottom: "10px",
};

const submitButtonStyle = {
  width: "100%",
  marginTop: "20px",
  backgroundColor: "#007bff",
  color: "#fff",
  padding: "10px",
  borderRadius: "4px",
  border: "none",
};

const cancelButtonStyle = {
  width: "100%",
  marginTop: "10px",
  backgroundColor: "#dc3545",
  color: "#fff",
  padding: "10px",
  borderRadius: "4px",
  border: "none",
};
