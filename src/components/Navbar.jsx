// src/components/Navbar.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from './AuthProvider';

const Navbar = () => {
  const { currentUser, role } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <nav className="navbar"> {/* Aplicar clase */}
      <div className="navbar-links"> {/* Aplicar clase */}
        <Link to="/">Inicio</Link>
        {currentUser && <Link to="/dashboard">Dashboard</Link>}
      </div>
      <div className="navbar-user-info"> {/* Aplicar clase */}
        {currentUser ? (
          <>
            <span>Hola, {currentUser.email} ({role})</span>
            <button onClick={handleLogout} className="btn btn-danger"> {/* Aplicar clase */}
              Cerrar Sesión
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Iniciar Sesión</Link>
            <Link to="/register">Registrarse</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;