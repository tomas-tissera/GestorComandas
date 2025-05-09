// components/ModalPago.js
import React, { useState } from "react";

export default function ModalPago({ task, productosDisponibles, onClose, onPagar }) {
  const [metodo, setMetodo] = useState("efectivo");
  const [cobrado, setCobrado] = useState(0);

  const getPrecio = (id) => {
    const prod = productosDisponibles.find((p) => p.id === id);
    return prod ? parseFloat(prod.precio) : 0;
  };

  const total = task.productos.reduce((acc, p) => {
    const precio = getPrecio(p.productoId);
    return acc + precio * p.cantidad;
  }, 0);

  const cambio = metodo === "efectivo" ? (cobrado - total).toFixed(2) : 0;

  const handlePagar = () => {
    if (metodo === "efectivo" && cobrado < total) {
      alert("El monto cobrado es menor que el total.");
      return;
    }

    onPagar({
      ...task,
      cobrado,
      metodoPago: metodo,
      cambio,
      estadoPago: "pagado"
    });
    onClose();
  };

  return (
    <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999
      }}>
        <div style={{
          backgroundColor: "#fff",
          padding: "24px",
          width: "340px",
          borderRadius: "10px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          fontFamily: "Arial, sans-serif"
        }}>
          <h3 style={{ marginBottom: "16px", fontSize: "20px" }}>Pago - {task.nombre}</h3>
          <p style={{ fontSize: "16px", marginBottom: "12px" }}>
            Total: <strong>${total.toFixed(2)}</strong>
          </p>
      
          <div style={{ marginBottom: "12px" }}>
            <label style={{ fontWeight: "bold" }}>Método de pago</label><br />
            <select
              value={metodo}
              onChange={(e) => setMetodo(e.target.value)}
              style={{
                width: "100%",
                padding: "6px",
                fontSize: "14px",
                marginTop: "4px"
              }}
            >
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
            </select>
          </div>
      
          {metodo === "efectivo" && (
            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontWeight: "bold" }}>Monto cobrado</label><br />
              <input
                type="number"
                value={cobrado}
                onChange={(e) => setCobrado(parseFloat(e.target.value))}
                style={{
                  width: "100%",
                  padding: "6px",
                  fontSize: "14px",
                  marginTop: "4px",
                  marginBottom: "6px"
                }}
              />
              <p style={{ fontSize: "14px", margin: 0 }}>
                Cambio: <strong>${cambio}</strong>
              </p>
            </div>
          )}
      
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
            <button
              onClick={handlePagar}
              style={{
                backgroundColor: "#4CAF50",
                color: "#fff",
                border: "none",
                padding: "10px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              Confirmar Pago
            </button>
            <button
              onClick={onClose}
              style={{
                backgroundColor: "#f44336",
                color: "#fff",
                border: "none",
                padding: "10px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
      
  );
}
