// src/components/CrearMesa.jsx
import React, { useState } from "react";
import { ref, push } from "firebase/database";
import { database } from "../firebase";

export default function CrearMesa() {
  const [nombreMesa, setNombreMesa] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombreMesa.trim()) return;

    const mesasRef = ref(database, "mesas");
    push(mesasRef, { nombre: nombreMesa.trim() })
      .then(() => {
        setNombreMesa("");
        alert("Mesa creada correctamente");
      })
      .catch((error) => {
        console.error("Error al crear mesa:", error);
        alert("Hubo un error al crear la mesa");
      });
  };

  return (
    <div style={cardStyle}>
      <h3>Crear Mesa</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={nombreMesa}
          onChange={(e) => setNombreMesa(e.target.value)}
          placeholder="Nombre de la mesa"
          required
          style={inputStyle}
        />
        <button type="submit" style={buttonStyle}>
          Crear
        </button>
      </form>
    </div>
  );
}

// Estilos simples
const cardStyle = {
  border: "1px solid #ccc",
  borderRadius: "8px",
  padding: "20px",
  width: "300px",
  margin: "20px auto",
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginBottom: "10px",
};

const buttonStyle = {
  width: "100%",
  padding: "10px",
  backgroundColor: "#007bff",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
};
