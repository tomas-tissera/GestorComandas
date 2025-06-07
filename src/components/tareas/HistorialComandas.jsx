import React, { useState, useMemo } from "react";
import { useComandas, eliminarComanda } from "../../hooks/useComandas";
import { useProductos } from "../../hooks/useProductos";
import { FaTrash } from "react-icons/fa";
import DashboardMeseroComandas from "../mesero/DashboardMeseroComandas";
// Helper function to get product name by ID
function getProductNameById(id, productosDisponibles) {
  const p = productosDisponibles.find((prod) => prod.id === id);
  return p?.nombre || "Desconocido";
}

// Helper for currency formatting
const formatCurrency = (amount) => {
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

  const [filterDate, setFilterDate] = useState("");
  const [filterMesa, setFilterMesa] = useState("");

  // Helper to parse and normalize a date string (DD/MM/AAAA or ISO) to a UTC midnight Date object
  const parseDateToUTC = (dateString) => {
    if (!dateString) return null;

    // Try parsing as ISO 8601 first (e.g., "2023-11-20T10:30:00.000Z" or "2023-11-20")
    const isoDate = new Date(dateString);
    if (!isNaN(isoDate.getTime())) {
      // If valid ISO format, convert to UTC midnight for consistent comparison
      return new Date(Date.UTC(isoDate.getFullYear(), isoDate.getMonth(), isoDate.getDate()));
    }

    // If not ISO, try parsing as DD/MM/AAAA (common in some systems)
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const year = parseInt(parts[2], 10);
      const month = parseInt(parts[1], 10) - 1; // Months are 0-11 in JavaScript Date
      const day = parseInt(parts[0], 10);
      return new Date(Date.UTC(year, month, day));
    }
    return null; // Return null for unparseable dates
  };

  // Calculates the total for a comanda
  const calculateTotal = (comanda) => {
    if (!comanda || !Array.isArray(comanda.productos)) {
      return 0;
    }

    return comanda.productos.reduce((acc, p) => {
      const prod = productosDisponibles.find((item) => item.id === p.productoId);
      const price = prod ? parseFloat(prod.precio) : 0;
      const quantity = typeof p.cantidad === 'number' ? p.cantidad : parseFloat(p.cantidad) || 0;
      return acc + (price * quantity);
    }, 0);
  };

  // Memoized filtering and sorting logic
  const filteredComandas = useMemo(() => {
    let currentFiltered = allComandas.filter(comanda => comanda.estado === "pagado");

    if (filterDate) {
      // `filterDate` comes from input type="date", so it's already YYYY-MM-DD
      // Convert filter date to UTC midnight for comparison
      const filterDateObj = new Date(filterDate + 'T00:00:00Z'); // Ensure it's UTC midnight for the given date

      currentFiltered = currentFiltered.filter(comanda => {
        if (!comanda.fechaPago) return false;

        // Parse comanda's date to UTC midnight using the helper
        const comandaDateObj = parseDateToUTC(comanda.fechaPago);

        if (!comandaDateObj || isNaN(comandaDateObj.getTime())) {
          console.warn("Fecha de pago inválida para comanda (durante filtro):", comanda.id, comanda.fechaPago);
          return false;
        }

        // Compare the ISO string (date part only) to ensure a date-only match
        return comandaDateObj.toISOString().slice(0, 10) === filterDateObj.toISOString().slice(0, 10);
      });
    }

    if (filterMesa) {
      const lowerCaseFilterMesa = filterMesa.toLowerCase();
      currentFiltered = currentFiltered.filter(comanda =>
        comanda.nombre && comanda.nombre.toLowerCase().includes(lowerCaseFilterMesa)
      );
    }

    // Sort comandas by date and time in descending order (most recent first)
    return currentFiltered.sort((a, b) => {
      let dateA, dateB;

      // Prioritize combining fechaPago and horaPago for precise sorting, if available
      // Assumes fechaPago is ISO 8601 (e.g., "YYYY-MM-DD")
      if (a.fechaPago && a.horaPago) {
        dateA = new Date(`${a.fechaPago.split('T')[0]}T${a.horaPago}`);
      } else if (a.fechaPago) {
        dateA = new Date(a.fechaPago); // Fallback to just fechaPago if horaPago is missing
      } else {
        dateA = new Date(0); // Epoch start if no date
      }

      if (b.fechaPago && b.horaPago) {
        dateB = new Date(`${b.fechaPago.split('T')[0]}T${b.horaPago}`);
      } else if (b.fechaPago) {
        dateB = new Date(b.fechaPago);
      } else {
        dateB = new Date(0);
      }

      const timeA = isNaN(dateA.getTime()) ? 0 : dateA.getTime();
      const timeB = isNaN(dateB.getTime()) ? 0 : dateB.getTime();

      return timeB - timeA; // Descending order
    });
  }, [allComandas, filterDate, filterMesa, productosDisponibles]); // Re-run memo if these dependencies change

  // Memoized list of unique mesa names for the filter dropdown
  const uniqueMesaNames = useMemo(() => {
    const names = new Set();
    allComandas.forEach(comanda => {
      if (comanda.nombre) {
        names.add(comanda.nombre);
      }
    });
    return ["", ...Array.from(names).sort()]; // Add an empty option and sort alphabetically
  }, [allComandas]);

  // Handle deletion of a comanda from history
  const handleDeleteFromHistory = async (comandaId) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta comanda del historial? Esta acción no se puede deshacer.")) {
      try {
        await eliminarComanda(comandaId);
        // The useComandas hook should automatically re-fetch/update, triggering a re-render
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
        overflowY: "auto", width: "1000px", display: "flex", flexDirection: "column",
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

        {/* CONTROLES DE FILTRO */}
        <div style={{ marginBottom: "20px", padding: "10px", border: "1px solid #eee", borderRadius: "8px", display: "flex", gap: "15px", alignItems: "center" }}>
          <label style={{ fontSize: "15px", color: "#555" }}>
            Filtrar por Fecha:
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              style={{ marginLeft: "8px", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
            />
          </label>

          <label style={{ fontSize: "15px", color: "#555" }}>
            Filtrar por Mesa:
            <select
              value={filterMesa}
              onChange={(e) => setFilterMesa(e.target.value)}
              style={{ marginLeft: "8px", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
            >
              <option value="">Todas las Mesas</option>
              {uniqueMesaNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>

          <button
            onClick={() => {
              setFilterDate("");
              setFilterMesa("");
            }}
            style={{
              padding: "8px 15px", backgroundColor: "#007bff", color: "white",
              border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "14px",
              transition: "background-color 0.2s ease"
            }}
          >
            Limpiar Filtros
          </button>
        </div>

        {filteredComandas.length === 0 ? (
          <p style={{ textAlign: "center", color: "#777", fontSize: "1.1em", padding: "20px" }}>
            No hay comandas pagadas en el historial que coincidan con los filtros.
          </p>
        ) : (
          <ul style={{
            listStyle: "none", padding: 0, margin: 0, display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px",
          }}>
            {filteredComandas.map((comanda) => {
              let formattedDate = 'N/A';
              let formattedTime = 'N/A';

              if (comanda.fechaPago) {
                // Try to create a Date object directly from the ISO string
                const comandaDate = new Date(comanda.fechaPago);

                if (!isNaN(comandaDate.getTime())) {
                  // Format date for display
                  formattedDate = new Intl.DateTimeFormat('es-AR', {
                    year: 'numeric', month: 'numeric', day: 'numeric'
                  }).format(comandaDate);

                  // If horaPago exists, use it; otherwise, extract time from the ISO date
                  formattedTime = comanda.horaPago || comandaDate.toLocaleTimeString('es-AR', {
                    hour: '2-digit', minute: '2-digit'
                  });
                } else {
                  console.warn("Fecha de pago inválida para comanda (para mostrar):", comanda.id, comanda.fechaPago);
                }
              }

              // Retrieve payment details
              const metodoPago = comanda.metodoPago || 'No especificado';
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
                      Comanda: **{comanda.nombre}**
                    </h4>
                    <p style={{ margin: 0, fontSize: "13px", color: "#666" }}>
                      Fecha: **{formattedDate}** | Hora: **{formattedTime}**
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
                      Método de Pago: **{metodoPago}**
                    </p>
                    <p style={{ margin: "5px 0", fontSize: "16px", fontWeight: "bold", color: "#28a745" }}>
                      Total Pagado: {formatCurrency(totalAmount)}
                    </p>
                    {metodoPago === "efectivo" && (
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