import React, { useState, useMemo, useEffect } from "react";
import { ref, remove, push } from "firebase/database"; // Importamos remove y push
import { database } from "../firebase";
import { useMesas } from "../hooks/useMesas";
import { useComandasNoPagadas } from "../hooks/useComandas";
import { useAuth } from "../components/AuthProvider";
import CrearMesa from "../components/tareas/CrearMesa";
import { FaTrash } from "react-icons/fa";
import Swal from "sweetalert2"; // Import Swal
import "../css/MesasPage.css";

export default function MesasPage() {
  const mesas = useMesas();
  const comandas = useComandasNoPagadas();
  const { currentUser, role } = useAuth();

  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState(null);

  useEffect(() => {
    if (mesas !== null && comandas !== null) {
      setLoading(false);
    }
  }, [mesas, comandas]);

  const sortedMesas = useMemo(() => {
    if (!sortBy) return mesas || [];
    const copy = [...(mesas || [])];
    if (sortBy === "nameAsc") return copy.sort((a, b) => a.nombre.localeCompare(b.nombre));
    if (sortBy === "nameDesc") return copy.sort((a, b) => b.nombre.localeCompare(a.nombre));
    return copy;
  }, [mesas, sortBy]);

  const handleSortToggle = () => {
    if (sortBy === "nameAsc") setSortBy("nameDesc");
    else setSortBy("nameAsc");
  };

  // Nueva función para eliminar mesa
  const handleEliminarMesa = async (mesa) => {
    if (role !== "gerente") {
      Swal.fire({
        icon: "error",
        title: "Acceso denegado",
        text: "Solo los gerentes pueden eliminar mesas.",
      });
      return;
    }

    // Revisar si la mesa tiene comandas activas
    const mesasConComandas = comandas.filter((c) => c.nombre === mesa.nombre);
    if (mesasConComandas.length > 0) {
      Swal.fire({
        icon: "error",
        title: "No se puede eliminar",
        text: "La mesa tiene comandas activas asociadas.",
      });
      return;
    }

    const confirmacion = await Swal.fire({
      title: `¿Eliminar mesa "${mesa.nombre}"?`,
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!confirmacion.isConfirmed) return;

    try {
      // Guardar en historial
      const historialRef = ref(database, "historial/mesas");
      await push(historialRef, {
        ...mesa,
        eliminadoPor: {
          uid: currentUser.uid,
          email: currentUser.email,
          nombre: currentUser.displayName || "Sin nombre",
        },
        eliminadoEn: new Date().toISOString(),
      });

      // Eliminar mesa
      await remove(ref(database, `mesas/${mesa.id}`));

      Swal.fire("Eliminado", "La mesa ha sido eliminada.", "success");
    } catch (error) {
      console.error("Error al eliminar mesa:", error);
      Swal.fire("Error", "No se pudo eliminar la mesa.", "error");
    }
  };

  return (
    <div className="mesas-container">
      {role === "gerente" && (
        <div className="mesas-container-title">
          <h2>Crear Mesa:</h2>
          <CrearMesa />
        </div>
      )}

      <div className="mesas-header">
        <h2>Mesas y Comandas Activas</h2>
        <button onClick={handleSortToggle} className="sort-tables-button">
          Acomodar Mesas{" "}
          {sortBy === "nameAsc"
            ? " (A-Z)"
            : sortBy === "nameDesc"
            ? " (Z-A)"
            : " (Sin Orden)"}
        </button>
      </div>

      {loading ? (
        <div className="loaderContainer">
          <div className="loader"></div>
          <p>Cargando mesas y comandas...</p>
        </div>
      ) : (
        <div className="mesas-grid">
          {sortedMesas.length === 0 ? (
            <p>No hay mesas disponibles.</p>
          ) : (
            sortedMesas.map((mesa) => {
              const comandasMesa = comandas.filter((c) => c.nombre === mesa.nombre);

              return (
                <div key={mesa.id} className="mesa-card">
                  <div className="mesa-card-title">
                    <h3>{mesa.nombre}</h3>
                    {role === "gerente" && (
                      <div
                        className="trash-btn"
                        onClick={() => handleEliminarMesa(mesa)}
                        title="Eliminar mesa"
                        style={{ cursor: "pointer" }}
                      >
                        <FaTrash />
                      </div>
                    )}
                  </div>
                  {comandasMesa.length === 0 ? (
                    <p className="comanda-vacia">Sin comandas activas</p>
                  ) : (
                    <ul className="comandas-lista">
                      {comandasMesa.map((c) => (
                        <li key={c.id} className="comanda-item">
                          <span className="estado-comanda">Estado: {c.estado}</span>

                          {c.productos && c.productos.length > 0 && (
                            <div className="comanda-productos">
                              <strong>📦 Productos:</strong>
                              <ul className="productos-lista">
                                {c.productos.map((prod, i) => (
                                  <li key={i}>
                                    {prod.cantidad} x {prod.nombre}
                                    {prod.aclaracion && (
                                      <div className="producto-aclaracion">📝 {prod.aclaracion}</div>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
