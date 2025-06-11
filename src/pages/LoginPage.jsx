// src/pages/LoginPage.js
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import styles from '../css/LoginPage.module.css'; // Importa el módulo CSS

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.formContainer}> {/* Aplica la clase del módulo */}
      <h2>Iniciar Sesión</h2>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}> {/* Aplica la clase del módulo */}
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}> {/* Aplica la clase del módulo */}
          <label htmlFor="password">Contraseña:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className={styles.errorMessage}>{error}</p>} {/* Aplica la clase del módulo */}
        <button type="submit" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnBlock}`}> {/* Combina clases del módulo */}
          Iniciar Sesión
        </button>
      </form>
    </div>
  );
};

export default LoginPage;