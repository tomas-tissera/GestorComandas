import React, { useState } from "react";

export default function AgregarElemento({ onChange }) {
  const [elemento, setElemento] = useState("");
  const [elementos, setElementos] = useState([]);

  const handleAdd = () => {
    if (elemento.trim() === "") return;
    const nuevos = [...elementos, elemento.trim()];
    setElementos(nuevos);
    setElemento("");
    onChange && onChange(nuevos); // Opcional: notificar al componente padre
  };

  const handleRemove = (index) => {
    const nuevos = elementos.filter((_, i) => i !== index);
    setElementos(nuevos);
    onChange && onChange(nuevos);
  };

  return (
    <div>
      <label>Elementos:</label>
      <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
        <input
          type="text"
          value={elemento}
          onChange={(e) => setElemento(e.target.value)}
          placeholder="Ej: Queso, Tomate..."
        />
        <button type="button" onClick={handleAdd}>
          Agregar
        </button>
      </div>
      <ul>
        {elementos.map((el, i) => (
          <li key={i}>
            {el}
            <button type="button" onClick={() => handleRemove(i)} style={{ marginLeft: 10 }}>
              ❌
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
