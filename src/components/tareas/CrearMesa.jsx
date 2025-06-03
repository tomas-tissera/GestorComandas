// CrearMesa.jsx
import { useState } from "react";
import { agregarMesa, useMesas } from "../../hooks/useMesas"; // Import useMesas
import Swal from 'sweetalert2';

import "./CrearMesa.css";
export default function CrearMesa() {
  const [nombreMesa, setNombreMesa] = useState("");
  const existingMesas = useMesas(); // Get all existing mesas

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nombreMesa.trim()) {
      Swal.fire({
        icon: 'warning',
        title: '¡Atención!',
        text: 'El nombre de la mesa no puede estar vacío.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#007bff',
      });
      return;
    }

    const formattedNombreMesa = nombreMesa.trim().charAt(0).toUpperCase() + nombreMesa.trim().slice(1).toLowerCase();

    // --- NEW CHECK FOR DUPLICATE NAME ---
    const isDuplicate = existingMesas.some(mesa => mesa.nombre === formattedNombreMesa);

    if (isDuplicate) {
      Swal.fire({
        icon: 'info', // Changed to info icon for "already exists"
        title: 'Mesa Existente',
        text: `La mesa "${formattedNombreMesa}" ya está creada.`,
        confirmButtonText: 'Ok',
        confirmButtonColor: '#007bff',
      });
      setNombreMesa(""); // Clear the input field
      return; // Stop the function execution
    }
    // --- END NEW CHECK ---

    try {
      await agregarMesa(formattedNombreMesa);
      setNombreMesa("");
      Swal.fire({
        icon: 'success',
        title: '¡Mesa Creada!',
        text: `La mesa "${formattedNombreMesa}" ha sido creada con éxito.`,
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        confirmButtonColor: '#007bff',
      });
    } catch (error) {
      console.error("Error al crear mesa:", error);
      Swal.fire({
        icon: 'error',
        title: '¡Error!',
        text: 'Hubo un error al crear la mesa. Por favor, inténtalo de nuevo.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#dc3545',
      });
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