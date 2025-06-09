import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // Import useLocation
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from './AuthProvider';
import styles from '../css/Navbar.module.css'; // Import the CSS module

const Navbar = () => {
  const { currentUser, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const isLinkActive = (path) => location.pathname === path;

  // 👉 No mostrar el navbar si no hay usuario
  if (!currentUser) {
    return null;
  }

  return (
    <nav className={styles.navbar}>
      <div className={styles.navbarLinks}>
        <Link to="/" className={isLinkActive('/gerente-dashboard') ? styles.active : ''}>Inicio</Link>

        <Link to="/comandas" className={isLinkActive('/comandas') ? styles.active : ''}>Comandas</Link>

        {role === 'gerente' && (
          <>
            <Link to="/mesas" className={isLinkActive('/mesas') ? styles.active : ''}>Mesas</Link>
            <Link to="/categorias" className={isLinkActive('/categorias') ? styles.active : ''}>Categorias</Link>
            <Link to="/productos" className={isLinkActive('/productos') ? styles.active : ''}>Productos</Link>
            <Link to="/gestion-empleados" className={isLinkActive('/gestion-empleados') ? styles.active : ''}>Empleados</Link>
            <Link to="/reportes" className={isLinkActive('/reportes') ? styles.active : ''}>Reportes</Link>
          </>
        )}

        {role === 'cocinero' && (
          <Link to="/cocina" className={isLinkActive('/cocina') ? styles.active : ''}>Cocina</Link>
        )}

        {role === 'mesero' && (
          <>
            <Link to="/mesas" className={isLinkActive('/mesas') ? styles.active : ''}>Mesas</Link>
            <Link to="/pedidos" className={isLinkActive('/pedidos') ? styles.active : ''}>Comandas</Link>
          </>
        )}
      </div>

      <div className={styles.navbarUserInfo}>
        <span>Hola, {currentUser.email} ({role})</span>
        <button onClick={handleLogout} className={`${styles.btn} ${styles.btnDanger}`}>
          Cerrar Sesión
        </button>
      </div>
    </nav>
  );
};

export default Navbar;