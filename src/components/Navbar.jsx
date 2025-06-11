import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from './AuthProvider';
import styles from '../css/Navbar.module.css';

const Navbar = () => {
  const { currentUser, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
      setMenuOpen(false); // cerrar menú al salir
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const isLinkActive = (path) => location.pathname === path;

  if (!currentUser) {
    return null;
  }

  // Cierra menú cuando se clickea cualquier link
  const handleLinkClick = () => {
    setMenuOpen(false);
  };

  return (
    <nav className={styles.navbar}>
      {/* Botón toggle a la derecha */}
      <button
        className={styles.menuButton}
        aria-label="Toggle menu"
        onClick={() => setMenuOpen(prev => !prev)}
      >
        {menuOpen ? '✕' : '☰'}
      </button>

      {/* Menú lateral (links + user info) */}
      <div className={`${styles.menuContainer} ${menuOpen ? styles.open : ''}`}>
        <div className={styles.navbarLinks}>
          <Link to="/" onClick={handleLinkClick} className={isLinkActive('/') ? styles.active : ''}>Inicio</Link>
          <Link to="/comandas" onClick={handleLinkClick} className={isLinkActive('/comandas') ? styles.active : ''}>Comandas</Link>

          {role === 'gerente' && (
            <>
              <Link to="/mesas" onClick={handleLinkClick} className={isLinkActive('/mesas') ? styles.active : ''}>Mesas</Link>
              <Link to="/categorias" onClick={handleLinkClick} className={isLinkActive('/categorias') ? styles.active : ''}>Categorias</Link>
              <Link to="/productos" onClick={handleLinkClick} className={isLinkActive('/productos') ? styles.active : ''}>Productos</Link>
              <Link to="/gestion-empleados" onClick={handleLinkClick} className={isLinkActive('/gestion-empleados') ? styles.active : ''}>Empleados</Link>
              <Link to="/reportes" onClick={handleLinkClick} className={isLinkActive('/reportes') ? styles.active : ''}>Reportes</Link>
            </>
          )}

          {role === 'mesero' && (
            <>
              <Link to="/mesas" onClick={handleLinkClick} className={isLinkActive('/mesas') ? styles.active : ''}>Mesas</Link>
              <Link to="/pedidos" onClick={handleLinkClick} className={isLinkActive('/pedidos') ? styles.active : ''}>Comandas</Link>
            </>
          )}
        </div>

        {/* Usuario y logout dentro del menú */}
        <div className={styles.navbarUserInfo}>
          <span>{currentUser.email} ({role})</span>
          <button onClick={handleLogout} className={`${styles.btn} ${styles.btnDanger}`}>
            Cerrar Sesión
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
