// src/components/usuarios/CrearUsuarioGerente.js
import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase'; // Make sure this path is correct
// CORRECTED IMPORT: Import getFunctions and httpsCallable from 'firebase/functions'
import { getFunctions, httpsCallable } from 'firebase/functions'; 
import { doc, setDoc } from 'firebase/firestore'; // Still need setDoc if you save extra data
import styles from '../../css/CrearUsuarioGerente.module.css';

export default function CrearUsuarioGerente({ onClose, onUserCreated }) { // Ensure onUserCreated is received
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('mesero');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Initialize Firebase Functions
  // IMPORTANT: If your Cloud Functions are in a different region than default 'us-central1',
  // you might need to specify it here:
  // const functions = getFunctions(undefined, 'your-region'); // e.g., 'southamerica-east1'
  const functions = getFunctions(); 
  const createRestaurantUser = httpsCallable(functions, 'createRestaurantUser'); // Name of your Cloud Function

  useEffect(() => {
    // useEffect to clear success/error messages after a delay
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000); // Messages will disappear after 5 seconds

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
      // Call the Cloud Function to create the user
      const result = await createRestaurantUser({
        email,
        password,
        firstName,
        lastName,
        role,
      });

      // The Cloud Function will return success and a message if everything went well
      const successMessage = result.data.message;
      setSuccess(successMessage);
      if (onUserCreated) {
          onUserCreated('success', successMessage); // Call the parent's alert function
      }
      
      // Clear the form after success
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setRole('mesero');

      // Close the modal (the manager remains logged in)
      setTimeout(() => {
        onClose(); 
      }, 2000);

    } catch (err) {
      console.error("Error creating user via Cloud Function:", err);
      // HttpsCallable errors have a specific structure
      let errorMessage = "An error occurred while creating the user. Please try again.";
      if (err.code) {
        switch (err.code) {
          case 'unauthenticated':
            errorMessage = 'You are not authenticated. Please log in.';
            break;
          case 'permission-denied':
            errorMessage = 'You do not have permission to create users.';
            break;
          case 'invalid-argument':
            errorMessage = `Validation error: ${err.message}`; // Use err.message directly from HttpsError
            break;
          case 'already-exists': // Custom error code from your Cloud Function
            errorMessage = 'The email address is already registered.';
            break;
          case 'internal': // General internal error from Cloud Function
            errorMessage = `Internal server error: ${err.message}`;
            break;
          default:
            errorMessage = `Error: ${err.message || 'An unexpected error occurred.'}`;
        }
      } else {
        errorMessage = err.message || errorMessage; // Fallback for generic JS errors
      }
      setError(errorMessage);
      if (onUserCreated) {
          onUserCreated('error', errorMessage); // Call the parent's alert function
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Crear Nuevo Usuario</h2>
      
      {/* Alert Messages */}
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
          <label htmlFor="firstName" className={styles.label}>Nombre:</label>
          <input
            type="text"
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className={styles.input}
            placeholder="Nombre del usuario"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="lastName" className={styles.label}>Apellido:</label>
          <input
            type="text"
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
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