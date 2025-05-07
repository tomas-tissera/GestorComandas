import React, { useState, useEffect } from "react";

export default function ModalAddTask({ onClose, onAdd, onEdit, taskToEdit }) {
  const availableProducts = [
    { id: "1", name: "Pizza", category: "Comidas" },
    { id: "2", name: "Hamburguesa", category: "Comidas" },
    { id: "3", name: "Coca-Cola", category: "Bebidas" },
    { id: "4", name: "Fanta", category: "Bebidas" },
    { id: "5", name: "Agua Mineral", category: "Bebidas" },
    { id: "6", name: "Ensalada", category: "Comidas" },
  ];

  const condicionesEspeciales = [
    { id: "celiaco", label: "Celíaco", icon: "🥖🚫" },
    { id: "vegetariano", label: "Vegetariano", icon: "🥦" },
    { id: "sinSal", label: "Sin Sal", icon: "🧂🚫" },
    { id: "sinAzucar", label: "Sin Azúcar", icon: "🍬🚫" },
  ];

  const isEditing = !!taskToEdit;

  const [taskDetails, setTaskDetails] = useState({
    nombre: "",
    productos: [],
    condiciones: [],  // Añadimos las condiciones especiales a las comanda
  });

  useEffect(() => {
    if (isEditing) {
      setTaskDetails({
        nombre: taskToEdit.nombre || "",
        productos: taskToEdit.productos || [],
        condiciones: taskToEdit.condiciones || [],
      });
    }
  }, [taskToEdit]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTaskDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddProduct = (productId) => {
    setTaskDetails((prev) => {
      const existingIndex = prev.productos.findIndex(
        (p) => p.productoId === productId
      );

      const updatedProductos = [...prev.productos];

      if (existingIndex !== -1) {
        updatedProductos[existingIndex] = {
          ...updatedProductos[existingIndex],
          cantidad: updatedProductos[existingIndex].cantidad + 1,
        };
      } else {
        updatedProductos.push({
          productoId: productId,
          cantidad: 1,
          aclaracion: "",
        });
      }

      return { ...prev, productos: updatedProductos };
    });
  };

  const handleProductChange = (index, e) => {
    const { name, value } = e.target;
    const newProductos = [...taskDetails.productos];
    newProductos[index][name] = parseInt(value);
    setTaskDetails({ ...taskDetails, productos: newProductos });
  };

  const handleAclaracionChange = (index, e) => {
    const { value } = e.target;
    const newProductos = [...taskDetails.productos];
    newProductos[index].aclaracion = value;
    setTaskDetails({ ...taskDetails, productos: newProductos });
  };

  const handleToggleCondicion = (condicionId) => {
    setTaskDetails((prev) => {
      const newCondiciones = prev.condiciones.includes(condicionId)
        ? prev.condiciones.filter((id) => id !== condicionId)
        : [...prev.condiciones, condicionId];

      return { ...prev, condiciones: newCondiciones };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!taskDetails.nombre || !taskDetails.productos.length) return;

    const payload = {
      ...taskDetails,
      id: isEditing ? taskToEdit.id : undefined,
    };

    if (isEditing && onEdit) {
      onEdit(payload);
    } else {
      onAdd(payload);
    }

    onClose();
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h3>{isEditing ? "Editar Comanda" : "Agregar Comanda"}</h3>

        <form onSubmit={handleSubmit}>
          <div>
            <label>Nombre de la Comanda</label>
            <input
              type="text"
              name="nombre"
              value={taskDetails.nombre}
              onChange={handleInputChange}
              placeholder="Nombre de la comanda"
              required
              style={{ width: "100%", padding: "8px", marginBottom: "15px" }}
            />
          </div>

          <div style={{ display: "flex", gap: "20px" }}>
            {/* Productos disponibles */}
            <div style={{ flex: 1 }}>
              <h4>Productos disponibles</h4>
              {["Comidas", "Bebidas"].map((category) => (
                <div key={category} style={{ marginBottom: "20px" }}>
                  <h5 style={{ borderBottom: "1px solid #ddd", paddingBottom: "5px" }}>{category}</h5>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "10px" }}>
                    {availableProducts
                      .filter((product) => product.category === category)
                      .map((product) => (
                        <div
                          key={product.id}
                          onClick={() => handleAddProduct(product.id)}
                          style={{
                            width: "100px",
                            border: "1px solid #ccc",
                            borderRadius: "8px",
                            padding: "10px",
                            textAlign: "center",
                            cursor: "pointer",
                            backgroundColor: "#f9f9f9",
                          }}
                        >
                          {product.name}
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Comanda actual */}
            <div style={{ flex: 1 }}>
              <h4>Comanda actual</h4>
              {taskDetails.productos.length === 0 ? (
                <p>No hay productos en la comanda.</p>
              ) : (
                taskDetails.productos.map((producto, index) => {
                  const product = availableProducts.find((p) => p.id === producto.productoId);
                  return (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        marginBottom: "10px",
                        borderBottom: "1px solid #ddd",
                        paddingBottom: "5px",
                      }}
                    >
                      <div style={{ fontWeight: "bold" }}>{product?.name}</div>
                      <input
                        type="number"
                        name="cantidad"
                        value={producto.cantidad}
                        onChange={(e) => handleProductChange(index, e)}
                        min="1"
                        style={{ width: "60px", padding: "5px" }}
                      />
                      <input
                        type="text"
                        name="aclaracion"
                        value={producto.aclaracion || ""}
                        onChange={(e) => handleAclaracionChange(index, e)}
                        placeholder="Escribe una aclaración (opcional)"
                        style={{ padding: "5px", marginTop: "5px" }}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Condiciones Especiales */}
          <div>
            <h4>Condiciones Especiales</h4>
            <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
              {condicionesEspeciales.map((condicion) => (
                <div
                  key={condicion.id}
                  onClick={() => handleToggleCondicion(condicion.id)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    backgroundColor: taskDetails.condiciones.includes(condicion.id) ? "#007bff" : "#f1f1f1",
                    color: taskDetails.condiciones.includes(condicion.id) ? "#fff" : "#000",
                    display: "flex",
                    alignItems: "center",
                    fontSize: "14px",
                  }}
                >
                  <span>{condicion.icon}</span> {condicion.label}
                </div>
              ))}
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
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
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
  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
};

const submitButtonStyle = {
  backgroundColor: "#007bff",
  color: "#fff",
  padding: "10px 16px",
  borderRadius: "4px",
  border: "none",
  cursor: "pointer",
  width: "100%",
  marginTop: "20px",
};

const cancelButtonStyle = {
  backgroundColor: "#dc3545",
  color: "#fff",
  padding: "10px 16px",
  marginTop: "10px",
  borderRadius: "4px",
  border: "none",
  cursor: "pointer",
  width: "100%",
};
