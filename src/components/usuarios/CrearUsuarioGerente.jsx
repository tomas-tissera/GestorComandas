// src/components/usuarios/CrearUsuarioGerente.js
import React, { useState, useEffect } from 'react';
// IMPORTANTE: Necesitas 'auth' para crear usuarios en el cliente
import { auth, db } from '../../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth'; // Importa la función específica
import { doc, setDoc } from 'firebase/firestore'; 
import styles from '../../css/CrearUsuarioGerente.module.css';

export default function CrearUsuarioGerente({ onClose, onUserCreated }) { 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [role, setRole] = useState('mesero'); // Still set a default role for Firestore
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000); 
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const rolesDisponibles = [
    { value: 'mesero', label: 'Mesero' },
    { value: 'cajero', label: 'Cajero' },
    { value: 'cocinero', label: 'Cocinero' },
    { value: 'gerente', label: 'Gerente' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Create user in Firebase Authentication directly from the client
      // WARNING: This means anyone with access to your app's code could create users.
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Save additional user data to Firestore
      // You'll need Firestore rules to allow this specific write from the client.
      // E.g., allow write: if request.auth != null; (still very broad)
      await setDoc(doc(db, 'users', user.uid), {
        nombre,
        apellido,
        email,
        role, // The role is saved to Firestore, but not as a secure custom claim
        createdAt: new Date(),
      });

      const successMessage = `Usuario ${email} creado exitosamente con el rol ${role}!`;
      setSuccess(successMessage);
      if (onUserCreated) {
          onUserCreated('success', successMessage); 
      }
      
      setEmail('');
      setPassword('');
      setNombre('');
      setApellido('');
      setRole('mesero');

      setTimeout(() => {
        onClose(); 
      }, 2000);

    } catch (err) {
      console.error("Error creating user directly from client:", err);
      let errorMessage = "Ocurrió un error al crear el usuario. Por favor, inténtalo de nuevo.";
      
      // Handle Firebase Auth specific errors
      if (err.code) {
        switch (err.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'La dirección de correo electrónico ya está registrada.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'La dirección de correo electrónico no es válida.';
            break;
          case 'auth/weak-password':
            errorMessage = 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.';
            break;
          case 'auth/operation-not-allowed':
            errorMessage = 'La creación de cuentas de correo electrónico/contraseña no está habilitada. Habilítala en la Consola de Firebase > Authentication > Sign-in method.';
            break;
          default:
            errorMessage = `Error: ${err.message}`;
        }
      } else {
        errorMessage = err.message || errorMessage;
      }
      setError(errorMessage);
      if (onUserCreated) {
          onUserCreated('error', errorMessage); 
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Crear Nuevo Usuario</h2>
      
      {error && <p className={`${styles.alertMessage} ${styles.error}`}>{error}</p>}
      {success && <p className={`${styles.alertMessage} ${styles.success}`}>{success}</p>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.label}>Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={styles.input}
            placeholder="ejemplo@dominio.com"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="password" className={styles.label}>Contraseña:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={styles.input}
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="nombre" className={styles.label}>Nombre:</label>
          <input
            type="text"
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            className={styles.input}
            placeholder="Nombre del usuario"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="apellido" className={styles.label}>Apellido:</label>
          <input
            type="text"
            id="apellido"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            required
            className={styles.input}
            placeholder="Apellido del usuario"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="role" className={styles.label}>Rol:</label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={styles.select}
          >
            {rolesDisponibles.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.buttonGroup}>
            <button type="submit" disabled={loading} className={styles.submitButton}>
                {loading ? 'Creando...' : 'Crear Usuario'}
            </button>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
                Cancelar
            </button>
        </div>
      </form>
    </div>
  );
}