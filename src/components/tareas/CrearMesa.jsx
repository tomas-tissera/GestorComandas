// CrearMesa.jsx
import { useState } from "react";
import { agregarMesa } from "../../hooks/useMesas";
import "./CrearMesa.css";

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
    <form className="crear-mesa-form" onSubmit={handleSubmit}>
      <input
        type="text"
        value={nombreMesa}
        onChange={(e) => setNombreMesa(e.target.value)}
        placeholder="Nombre de la mesa"
        className="crear-mesa-input"
      />
      <button type="submit" className="crear-mesa-button">
        Crear Mesa
      </button>
    </form>
  );
}
