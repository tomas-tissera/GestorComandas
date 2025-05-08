// ModalAddTask.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useMesas, agregarMesa } from "../../hooks/useMesas" // al principio del archivo
import { guardarComanda } from "../../hooks/useComandas";

const AVAILABLE_PRODUCTS_MODAL = [
  { id: "1", name: "Pizza", category: "Comidas" },
  { id: "2", name: "Hamburguesa", category: "Comidas" },
  { id: "3", name: "Coca-Cola", category: "Bebidas" },
  { id: "4", name: "Fanta", category: "Bebidas" },
  { id: "5", name: "Agua Mineral", category: "Bebidas" },
  { id: "6", name: "Ensalada", category: "Comidas" },
];


export default function ModalAddTask({ onClose, onAdd, onEdit, taskToEdit }) {
  const mesas = useMesas();
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

  const handleAddProduct = useCallback((productId) => {
    setTaskDetails((prev) => {
      const updatedProductos = [...prev.productos];
      const index = updatedProductos.findIndex((p) => p.productoId === productId);

      if (index !== -1) {
        updatedProductos[index].cantidad += 1;
      } else {
        updatedProductos.push({ productoId: productId, cantidad: 1, aclaracion: "", condiciones: [] });
      }

      return { ...prev, productos: updatedProductos };
    });
  }, []);

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

  const handleToggleCondicion = useCallback((productIndex, condicionId) => {
    setTaskDetails((prev) => {
      const productos = [...prev.productos];
      const condiciones = productos[productIndex].condiciones || [];
      const hasCondicion = condiciones.includes(condicionId);
      productos[productIndex].condiciones = hasCondicion
        ? condiciones.filter((c) => c !== condicionId)
        : [...condiciones, condicionId];
      return { ...prev, productos };
    });
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!taskDetails.nombre || !taskDetails.productos.length) return;

    const payload = {
      ...taskDetails,
      ...(isEditing && { id: taskToEdit.id }), // solo agrega 'id' si estás editando
    };

    if (isEditing) {
      onEdit?.(payload); // Esto depende si querés implementar edición en Firebase también
    } else {
      guardarComanda(payload);
      onAdd?.(payload); // Podés dejar esto si usás estado local
    }
    onClose();
  }, [isEditing, taskToEdit, taskDetails, onEdit, onAdd, onClose]);

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
              {["Comidas", "Bebidas"].map((cat) => (
                <div key={cat}>
                  <h5>{cat}</h5>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {AVAILABLE_PRODUCTS_MODAL
                      .filter((p) => p.category === cat)
                      .map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handleAddProduct(p.id)}
                          style={productCardStyle}
                        >
                          {p.name}
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
                  const prod = AVAILABLE_PRODUCTS_MODAL.find((p) => p.id === producto.productoId);
                  return (
                    <div key={index} style={commandItemStyle}>
                      <strong>{prod?.name}</strong>
                      <input
                        type="number"
                        name="cantidad"
                        min="1"
                        value={producto.cantidad}
                        onChange={(e) => handleProductChange(index, e)}
                        style={{ width: "60px", margin: "5px 0" }}
                      />
                      <input
                        type="text"
                        placeholder="Aclaración"
                        value={producto.aclaracion}
                        onChange={(e) => handleAclaracionChange(index, e)}
                        style={{ width: "100%", padding: "5px" }}
                      />
                    </div>
                  );
                })
              )}
            </div>
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
