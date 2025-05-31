// src/pages/MesasPage.jsx
import React from "react";
import { useMesas } from "../hooks/useMesas";
import { useComandasNoPagadas } from "../hooks/useComandas";
import "../css/MesasPage.css";

export default function MesasPage() {
    const mesas = useMesas();
    const comandas = useComandasNoPagadas();
  
    return (
      <div className="mesas-container">
        <h2>Mesas y Comandas Activas</h2>
        <div className="mesas-grid">
          {mesas.map((mesa) => {
            // Filtramos por nombre de la mesa
            const comandasMesa = comandas.filter(
              (c) => c.nombre === mesa.nombre
            );
  
            return (
              <div key={mesa.id} className="mesa-card">
                <h3>{mesa.nombre}</h3>
  
                {comandasMesa.length === 0 ? (
                  <p className="comanda-vacia">Sin comandas activas</p>
                ) : (
                    <ul className="comandas-lista">
                    {comandasMesa.map((c) => (
                      <li key={c.id} className="comanda-item">
                        {/* <strong>🧾 Detalle:</strong> {c.detalle || "(sin detalle)"}<br /> */}
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