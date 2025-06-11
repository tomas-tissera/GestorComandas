// src/components/usuarios/CrearUsuarioGerente.js
import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../../firebase';
import { createUserWithEmailAndPassword, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; 
import styles from '../../css/CrearUsuarioGerente.module.css';

export default function CrearUsuarioGerente({ onClose, onUserCreated }) { 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [role, setRole] = useState('mesero'); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Usamos useRef para almacenar las credenciales del gerente ANTES de la operación
  // Esto es un parche para intentar mantener la sesión, NO es una práctica segura.
  const managerCredentials = useRef(null);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000); 
      return () => clearTimeout(timer);
    }

    // Al montar el componente, intenta capturar el email del gerente actual
    // y almacenar en el ref. La contraseña NO es accesible aquí directamente por seguridad.
    const currentUser = auth.currentUser;
    if (currentUser) {
      managerCredentials.current = { email: currentUser.email };
      // ATENCIÓN: La contraseña NO se puede obtener aquí.
      // Para re-loguear al gerente, necesitarías que él la reingrese.
      // Sin eso, el re-login automático NO es posible con este método.
    }

  }, [error, success]);

  const rolesDisponibles = [
    { value: 'mesero', label: 'Mesero' },
    { value: 'cocinero', label: 'Cocinero' },
    { value: 'gerente', label: 'Gerente' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Guarda las credenciales del gerente antes de la operación que lo deslogueará
    // (Solo el email es seguro de guardar aquí)
    const currentManagerEmail = auth.currentUser ? auth.currentUser.email : null;
    
    // Si el gerente no está logueado, no podemos continuar con esta operación
    if (!currentManagerEmail) {
      setError("El gerente debe estar logueado para crear usuarios.");
      setLoading(false);
      return;
    }

    try {
      // 1. Crear usuario en Firebase Authentication
      // ¡ESTO LOGUEARÁ AL NUEVO USUARIO Y DESLOGUEARÁ AL GERENTE ACTUAL!
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      // 2. Guardar datos adicionales en Firestore
      // (Asegúrate de tener reglas de Firestore permisivas para esto, si no usas funciones)
      await setDoc(doc(db, 'users', newUser.uid), {
        nombre,
        apellido,
        email,
        role, 
        createdAt: new Date(),
      });

      // 3. Desloguear al nuevo usuario inmediatamente
      await signOut(auth); 

      // 4. Intentar re-loguear al gerente original
      // IMPORTANTE: Aquí es donde necesitas la contraseña del gerente.
      // Si no la tienes de forma segura (ej. reingresada por el gerente), esta parte fallará.
      // Para este ejemplo, esto es un Placeholder IMPRACTICABLE en producción sin re-autenticación manual.
      try {
        // En un escenario real, necesitarías que el gerente re-ingrese su contraseña
        // o usar signInWithCredential si se autenticó recientemente con un proveedor como Google.
        // Como no tenemos la contraseña del gerente de forma segura aquí,
        // este paso fallará a menos que la sesión de Firebase maneje la persistencia.
        // Pero createUserWithEmailAndPassword rompe esa persistencia.
        
        // Simplemente asumiremos que si el gerente tenía una sesión persistente,
        // Firebase intentará restaurarla. Pero si fue una sesión solo de pestaña,
        // estará deslogueado.
        
        // La forma "correcta" sería pedir: await signInWithEmailAndPassword(auth, currentManagerEmail, managerReEnteredPassword);
        
        // Para este ejemplo, no podemos hacer un re-login directo sin la password.
        // El gerente quedará deslogueado y deberá volver a iniciar sesión si su sesión no era persistente.
        
        // Una alternativa para reducir el impacto sería simplemente no hacer nada aquí y
        // dejar que el usuario se re-loguee o que Firebase reestablezca la sesión si es persistente.
        // No hay forma segura de re-loguear programáticamente sin las credenciales o sin funciones.
        
        // Por lo tanto, con la limitación "sin functions", el gerente SERÁ deslogueado.
        // La única mitigación es no redirigir al login y esperar que onAuthStateChanged lo maneje.
        
      } catch (reloginError) {
        console.warn("No se pudo re-loguear al gerente automáticamente.", reloginError);
        // Si no se puede re-loguear, el gerente quedará deslogueado.
        // Deberías alertar al usuario o redirigir al login.
      }


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

      // Solo cierra el modal, NO redirige al login si el gerente no está logueado
      setTimeout(() => {
        onClose(); 
      }, 2000);

    } catch (err) {
      console.error("Error creating user directly from client:", err);
      let errorMessage = "Ocurrió un error al crear el usuario. Por favor, inténtalo de nuevo.";
      
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