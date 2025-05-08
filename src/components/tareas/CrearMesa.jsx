// CrearMesa.jsx
import { useState } from "react";
import { agregarMesa } from "../../hooks/useMesas";

export default function CrearMesa() {
  const [nombreMesa, setNombreMesa] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombreMesa.trim()) return;

    try {
      await agregarMesa(nombreMesa.trim());
      setNombreMesa("");
      alert("Mesa creada con éxito");
    } catch (error) {
      console.error("Error al crear mesa:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <input
        type="text"
        value={nombreMesa}
        onChange={(e) => setNombreMesa(e.target.value)}
        placeholder="Nombre de la mesa"
        style={inputStyle}
      />
      <button type="submit" style={buttonStyle}>
        Crear Mesa
      </button>
    </form>
  );
}

const formStyle = {
  display: "flex",
  gap: "10px",
  marginBottom: "20px",
};

const inputStyle = {
  flex: 1,
  padding: "8px",
};

const buttonStyle = {
  padding: "8px 16px",
  backgroundColor: "#28a745",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};
