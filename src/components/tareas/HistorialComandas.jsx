import React from "react";
import { useComandas, eliminarComanda } from "../../hooks/useComandas";
import { useProductos } from "../../hooks/useProductos";
import { FaTrash } from "react-icons/fa";

// Helper function to get product name by ID
function getProductNameById(id, productosDisponibles) {
  const p = productosDisponibles.find((prod) => prod.id === id);
  return p?.nombre || "Desconocido";
}

// Helper for currency formatting
const formatCurrency = (amount) => {
  // Ensure amount is a number, default to 0 if not
  const numericAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
};

export default function HistorialComandas({ onClose }) {
  const allComandas = useComandas();
  const productosDisponibles = useProductos();

  // Filter out only the paid comandas
  const paidComandas = allComandas.filter(comanda => comanda.estado === "pagado");

  // Calculate total for a comanda
  const calculateTotal = (task) => {
    return task.productos.reduce((acc, p) => {
      const prod = productosDisponibles.find((item) => item.id === p.productoId);
      const price = prod ? parseFloat(prod.precio) : 0;
      const quantity = typeof p.cantidad === 'number' ? p.cantidad : parseFloat(p.cantidad) || 0;
      return acc + (price * quantity);
    }, 0);
  };

  // Handle deletion of a comanda from history
  const handleDeleteFromHistory = async (comandaId) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta comanda del historial? Esta acción no se puede deshacer.")) {
      try {
        await eliminarComanda(comandaId);
        // La actualización de la lista se maneja automáticamente por el hook useComandas
      } catch (error) {
        console.error("Error al eliminar comanda del historial:", error);
        alert("Hubo un error al eliminar la comanda. Por favor, inténtalo de nuevo.");
      }
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
      backgroundColor: "rgba(0, 0, 0, 0.7)", display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: 10000,
    }}>
      <div style={{
        backgroundColor: "#fff", padding: "30px", borderRadius: "10px",
        boxShadow: "0 5px 15px rgba(0, 0, 0, 0.3)", maxWidth: "90%", maxHeight: "90vh",
        overflowY: "auto", width: "800px", display: "flex", flexDirection: "column",
        fontFamily: "Roboto, 'Helvetica Neue', Arial, sans-serif", position: "relative",
        color: "#333",
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: "20px", borderBottom: "1px solid #eee", paddingBottom: "10px",
        }}>
          <h2 style={{ margin: 0, fontSize: "24px", color: "#2c3e50" }}>Historial de Comandas Pagadas</h2>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", fontSize: "28px", cursor: "pointer",
              color: "#888", position: "absolute", top: "15px", right: "15px", padding: "0",
            }}
            aria-label="Cerrar historial"
            title="Cerrar historial"
          >
            &times;
          </button>
        </div>
        
        {paidComandas.length === 0 ? (
          <p style={{ textAlign: "center", color: "#777", fontSize: "1.1em", padding: "20px" }}>
            No hay comandas pagadas en el historial en este momento.
          </p>
        ) : (
          <ul style={{
            listStyle: "none", padding: 0, margin: 0, display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px",
          }}>
            {paidComandas.map((comanda) => {
              // --- PARSEANDO Y FORMATEANDO FECHA Y HORA ---
              let formattedDate = 'N/A';
              let formattedTime = 'N/A';

              // Intentar parsear fecha solo si existe y tiene el formato esperado (DD/MM/AAAA)
              if (comanda.fechaPago) {
                // Split the date string and reorder for YYYY-MM-DD for Date object
                const [day, month, year] = comanda.fechaPago.split('/');
                const isoDateString = `${year}-${month}-${day}`;
                const comandaDate = new Date(isoDateString);

                // Check if the date is valid before formatting
                if (!isNaN(comandaDate.getTime())) { // Check for "Invalid Date"
                  formattedDate = new Intl.DateTimeFormat('es-AR', {
                    year: 'numeric', month: 'numeric', day: 'numeric'
                  }).format(comandaDate);
                } else {
                  console.warn("Fecha de pago inválida para comanda:", comanda.id, comanda.fechaPago);
                }
              }
              
              // Hora: asumiendo que ya es una cadena formateada
              formattedTime = comanda.horaPago || 'N/A';

              // --- RECUPERANDO MÉTODO DE PAGO, COBRADO Y CAMBIO ---
              console.log("comanda");
              
              console.log(comanda);
              
              const metodoPago = comanda.metodoPago || 'No especificado'; // Default if null/undefined
              const cobradoAmount = parseFloat(comanda.cobrado || 0);
              const cambioAmount = parseFloat(comanda.cambio || 0);
              
              const totalAmount = calculateTotal(comanda);

              return (
                <li key={comanda.id} style={{
                  border: "1px solid #e0e0e0", borderRadius: "8px", padding: "15px",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column",
                  justifyContent: "space-between", backgroundColor: "#f9f9f9",
                }}>
                  <div style={{ marginBottom: "10px", borderBottom: "1px dashed #cfcfcf", paddingBottom: "10px" }}>
                    <h4 style={{ margin: "0 0 5px 0", fontSize: "19px", color: "#34495e" }}>
                      Comanda: {comanda.nombre}
                    </h4>
                    <p style={{ margin: 0, fontSize: "13px", color: "#666" }}>
                      Fecha: {formattedDate} | Hora: {formattedTime}
                    </p>
                  </div>
                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 15px 0", fontSize: "14px", color: "#555" }}>
                    {comanda.productos.map((prod, index) => (
                      <li key={index} style={{ marginBottom: "5px" }}>
                        **{prod.cantidad} x {getProductNameById(prod.productoId, productosDisponibles)}**
                        {prod.aclaracion && <span style={{ fontStyle: "italic", fontSize: "0.85em", color: "#999", marginLeft: "5px" }}>({prod.aclaracion})</span>}
                      </li>
                    ))}
                  </ul>
                  <div style={{ paddingTop: "15px", borderTop: "1px dashed #cfcfcf", marginTop: "auto" }}>
                    <p style={{ margin: "5px 0", fontSize: "15px", color: "#555" }}>
                      Método de Pago: <strong>{metodoPago}</strong> {/* Usamos la variable metodoPago */}
                    </p>
                    <p style={{ margin: "5px 0", fontSize: "16px", fontWeight: "bold", color: "#28a745" }}>
                      Total Pagado: {formatCurrency(totalAmount)}
                    </p>
                    {metodoPago === "efectivo" && ( // Mostrar solo si el método es efectivo
                      <>
                        <p style={{ margin: "5px 0", fontSize: "14px", color: "#777" }}>
                          Monto Cobrado: {formatCurrency(cobradoAmount)}
                        </p>
                        <p style={{ margin: "5px 0", fontSize: "14px", color: "#777" }}>
                          Cambio: {formatCurrency(cambioAmount)}
                        </p>
                      </>
                    )}
                    <button
                      onClick={() => handleDeleteFromHistory(comanda.id)}
                      style={{
                        backgroundColor: "#dc3545", color: "white", border: "none",
                        padding: "8px 12px", borderRadius: "5px", cursor: "pointer",
                        fontSize: "14px", display: "flex", alignItems: "center",
                        gap: "5px", marginTop: "15px", transition: "background-color 0.2s ease",
                      }}
                      title="Eliminar esta comanda del historial"
                    >
                      <FaTrash /> Eliminar
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}