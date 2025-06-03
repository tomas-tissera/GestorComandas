import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // Import useLocation
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from './AuthProvider';
import styles from '../css/Navbar.module.css'; // Import the CSS module

const Navbar = () => {
  const { currentUser, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // Get current location to highlight active link

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  // Helper function to check if a link is active
  const isLinkActive = (path) => location.pathname === path;

  return (
    <nav className={styles.navbar}> {/* Use module class */}
      <div className={styles.navbarLinks}> {/* Use module class */}
        <Link to="/" className={isLinkActive('/') ? styles.active : ''}>Inicio</Link>

        {/* Mostrar solo si está logueado */}
        {currentUser && (
          <>
            <Link to="/dashboard" className={isLinkActive('/dashboard') ? styles.active : ''}>Dashboard</Link>

            {/* Accesos según el rol */}
            {role === 'gerente' && (
              <>
                <Link to="/mesas" className={isLinkActive('/mesas') ? styles.active : ''}>Mesas</Link>
                <Link to="/categorias" className={isLinkActive('/categorias') ? styles.active : ''}>Categorias</Link>
                <Link to="/reportes" className={isLinkActive('/reportes') ? styles.active : ''}>Productos</Link>
                <Link to="/gestion-empleados" className={isLinkActive('/gestion-empleados') ? styles.active : ''}>Empleados</Link>
                <Link to="/reportes" className={isLinkActive('/reportes') ? styles.active : ''}>Reportes</Link>
              </>
            )}

            {role === 'cocinero' && (
              <>
                <Link to="/cocina" className={isLinkActive('/cocina') ? styles.active : ''}>Cocina</Link>
              </>
            )}

            {role === 'mesero' && (
              <>
                <Link to="/mesas" className={isLinkActive('/mesas') ? styles.active : ''}>Mesas</Link>
                <Link to="/pedidos" className={isLinkActive('/pedidos') ? styles.active : ''}>Comandas</Link>
              </>
            )}
          </>
        )}
      </div>

      <div className={styles.navbarUserInfo}> {/* Use module class */}
        {currentUser ? (
          <>
            <span>Hola, {currentUser.email} ({role})</span>
            <button onClick={handleLogout} className={`${styles.btn} ${styles.btnDanger}`}> {/* Use module classes */}
              Cerrar Sesión
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className={`${styles.btn} ${styles.btnPrimary}`}>Iniciar Sesión</Link> {/* Use module classes */}
            <Link to="/register" className={`${styles.btn} ${styles.btnPrimary}`}>Registrarse</Link> {/* Use module classes */}
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;