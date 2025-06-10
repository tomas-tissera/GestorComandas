import React, { useState, useEffect } from 'react';
import { db } from '../../firebase'; // Asegúrate de que esta ruta sea correcta
import { doc, updateDoc } from 'firebase/firestore';

const EditarUsuarioModal = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    rol: '', // 'mesero' o 'gerente'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    // Carga los datos del usuario en el formulario cuando el modal se abre o el usuario cambia
    if (user) {
      setFormData({
        nombre: user.nombre || '',
        apellido: user.apellido || '',
        email: user.email || '',
        rol: user.rol || 'mesero', // Valor por defecto si no tiene rol
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
    setError(null); // Limpiar errores al cambiar los datos
    setSuccess(null); // Limpiar éxito al cambiar los datos
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!user || !user.id) {
        throw new Error("No se pudo obtener el ID del usuario para actualizar.");
      }

      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, formData);

      setSuccess("Usuario actualizado con éxito!");
      setLoading(false);
      onSave(formData); // Llama a la función onSave para actualizar el estado en el componente padre
      setTimeout(() => onClose(), 1500); // Cierra el modal después de un breve tiempo
    } catch (err) {
      console.error("Error al actualizar usuario:", err);
      setError(`Error al actualizar: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '10px',
        textAlign: 'center',
        boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
        maxWidth: '500px',
        width: '90%',
        position: 'relative',
      }}>
        <h4 style={{ color: '#333', marginBottom: '20px' }}>Editar Usuario: {user?.nombre || user?.email}</h4>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label htmlFor="nombre" style={{ display: 'block', textAlign: 'left', marginBottom: '5px', color: '#555' }}>Nombre:</label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              style={{
                width: 'calc(100% - 20px)',
                padding: '10px',
                borderRadius: '5px',
                border: '1px solid #ddd',
              }}
            />
          </div>
          <div>
            <label htmlFor="apellido" style={{ display: 'block', textAlign: 'left', marginBottom: '5px', color: '#555' }}>Apellido:</label>
            <input
              type="text"
              id="apellido"
              name="apellido"
              value={formData.apellido}
              onChange={handleChange}
              style={{
                width: 'calc(100% - 20px)',
                padding: '10px',
                borderRadius: '5px',
                border: '1px solid #ddd',
              }}
            />
          </div>
          <div>
            <label htmlFor="email" style={{ display: 'block', textAlign: 'left', marginBottom: '5px', color: '#555' }}>Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled // El email no debería ser editable para evitar inconsistencias con Firebase Auth
              style={{
                width: 'calc(100% - 20px)',
                padding: '10px',
                borderRadius: '5px',
                border: '1px solid #ddd',
                backgroundColor: '#f0f0f0', // Para indicar que está deshabilitado
                cursor: 'not-allowed'
              }}
            />
          </div>
          <div>
            <label htmlFor="rol" style={{ display: 'block', textAlign: 'left', marginBottom: '5px', color: '#555' }}>Rol:</label>
            <select
              id="rol"
              name="rol"
              value={formData.rol}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '5px',
                border: '1px solid #ddd',
              }}
            >
              <option value="mesero">Mesero</option>
              <option value="gerente">Gerente</option>
            </select>
          </div>

          {loading && <p style={{ color: '#007bff', marginTop: '10px' }}>Guardando cambios...</p>}
          {error && <p style={{ color: '#dc3545', marginTop: '10px' }}>{error}</p>}
          {success && <p style={{ color: '#28a745', marginTop: '10px' }}>{success}</p>}

          <div style={{ display: 'flex', justifyContent: 'space-around', gap: '15px', marginTop: '20px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: '#28aa45',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                padding: '10px 20px',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease',
                flex: 1,
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#218838'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#28a745'}
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                padding: '10px 20px',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease',
                flex: 1,
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#5a6268'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6c757d'}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditarUsuarioModal;