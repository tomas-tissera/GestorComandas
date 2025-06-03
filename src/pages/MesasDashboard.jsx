// src/pages/MesasPage.jsx
import React, { useState, useMemo } from "react"; // Import useState and useMemo
import { useMesas } from "../hooks/useMesas";
import { useComandasNoPagadas } from "../hooks/useComandas";
import { useAuth } from "../components/AuthProvider";
import "../css/MesasPage.css"; // Ensure this CSS file exists and contains relevant styles
import CrearMesa from "../components/tareas/CrearMesa";
import { FaTrash } from "react-icons/fa";
export default function MesasPage() {
  const mesas = useMesas();
  const comandas = useComandasNoPagadas();
  const { currentUser, role } = useAuth();

  // State to control sorting
  const [sortBy, setSortBy] = useState(null); // 'nameAsc' for ascending name, 'nameDesc' for descending

  // Memoized sorted mesas to avoid re-sorting on every render
  const sortedMesas = useMemo(() => {
    if (!sortBy) {
      return mesas; // No sorting applied
    }

    // Create a shallow copy to avoid mutating the original array
    const sortableMesas = [...mesas];

    if (sortBy === 'nameAsc') {
      return sortableMesas.sort((a, b) => a.nombre.localeCompare(b.nombre));
    } else if (sortBy === 'nameDesc') {
      return sortableMesas.sort((a, b) => b.nombre.localeCompare(a.nombre));
    }
    return mesas; // Fallback
  }, [mesas, sortBy]);

  const handleSortToggle = () => {
    if (sortBy === 'nameAsc') {
      setSortBy('nameDesc');
    } else {
      setSortBy('nameAsc');
    }
  };

  return (
    <div className="mesas-container">
      {role === 'gerente' && (
        <div>
          <h2>Crear Mesa:</h2>
          <CrearMesa />
          <hr />
        </div>
      )}
      <div className="mesas-header"> {/* New div for header elements */}
        <h2>Mesas y Comandas Activas</h2>
        <button onClick={handleSortToggle} className="sort-tables-button">
          Acomodar Mesas {sortBy === 'nameAsc' ? ' (A-Z)' : sortBy === 'nameDesc' ? ' (Z-A)' : ' (Sin Orden)'}
        </button>
      </div>

      <div className="mesas-grid">
        {sortedMesas.map((mesa) => { // Use sortedMesas here
          const comandasMesa = comandas.filter(
            (c) => c.nombre === mesa.nombre
          );

          return (
            <div key={mesa.id} className="mesa-card">
              <div className="mesa-card-title">
                <h3>{mesa.nombre}</h3>
                {role === 'gerente' && (
                        <div className="trash-btn">
                          <FaTrash></FaTrash>
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
                                  <div className="producto-aclaracion">
                                    📝 {prod.aclaracion}
                                  </div>
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
        })}
      </div>
    </div>
  );
}