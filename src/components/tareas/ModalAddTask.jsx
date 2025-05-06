import React, { useState } from "react";

export default function ModalAddTask({ onClose, onAdd }) {
  // Productos predefinidos
  const availableProducts = [
    { id: "1", name: "Pizza" },
    { id: "2", name: "Hamburguesa" },
    { id: "3", name: "Coca-Cola" },
    { id: "4", name: "Fanta" },
    { id: "5", name: "Agua Mineral" },
    { id: "6", name: "Ensalada" },
  ];

  const [taskDetails, setTaskDetails] = useState({
    id: "",
    nombre: "",
    productos: [{ productoId: "", cantidad: 1 }],
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTaskDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProductChange = (index, e) => {
    const { name, value } = e.target;
    const newProductos = [...taskDetails.productos];
    newProductos[index][name] = value;
    setTaskDetails({ ...taskDetails, productos: newProductos });
  };

  const handleAddProduct = () => {
    setTaskDetails((prev) => ({
      ...prev,
      productos: [...prev.productos, { productoId: "", cantidad: 1 }],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!taskDetails.nombre || !taskDetails.productos.length) return;
    onAdd(taskDetails);
    onClose();
  };

  // Obtener el nombre del producto a partir del productoId
  const getProductNameById = (id) => {
    const product = availableProducts.find((prod) => prod.id === id);
    return product ? product.name : "";
  };

  return (
    <div
      style={{
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
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          padding: "20px",
          borderRadius: "10px",
          width: "300px",
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
        }}
      >
        <h3>Agregar Comanda</h3>
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
              style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
            />
          </div>

          {taskDetails.productos.map((producto, index) => (
            <div key={index} style={{ marginBottom: "10px" }}>
              <label>Producto #{index + 1}</label>
              <select
                name="productoId"
                value={producto.productoId}
                onChange={(e) => handleProductChange(index, e)}
                required
                style={{ width: "100%", padding: "8px", marginBottom: "5px" }}
              >
                <option value="">Selecciona un producto</option>
                {availableProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>

              {/* Mostrar el nombre del producto seleccionado */}
              {producto.productoId && (
                <div>
                  <strong>Producto Seleccionado:</strong> {getProductNameById(producto.productoId)}
                </div>
              )}

              <label>Cantidad</label>
              <input
                type="number"
                name="cantidad"
                value={producto.cantidad}
                onChange={(e) => handleProductChange(index, e)}
                min="1"
                required
                style={{ width: "100%", padding: "8px" }}
              />
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddProduct}
            style={{
              backgroundColor: "#28a745",
              color: "#fff",
              padding: "8px 12px",
              marginBottom: "10px",
              borderRadius: "4px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Agregar Producto
          </button>
          <br />
          <button
            type="submit"
            style={{
              backgroundColor: "#007bff",
              color: "#fff",
              padding: "8px 12px",
              borderRadius: "4px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Crear Comanda
          </button>
        </form>

        <button
          onClick={onClose}
          style={{
            backgroundColor: "#dc3545",
            color: "#fff",
            padding: "8px 12px",
            marginTop: "10px",
            borderRadius: "4px",
            border: "none",
            cursor: "pointer",
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
