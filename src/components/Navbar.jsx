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
    <nav className="navbar">
      <div className="navbar-links">
        <Link to="/">Inicio</Link>

        {/* Mostrar solo si está logueado */}
        {currentUser && (
          <>
            <Link to="/dashboard">Dashboard</Link>

            {/* Accesos según el rol */}
            {role === 'gerente' && (
              <>
                <Link to="/gestion-empleados">Empleados</Link>
                <Link to="/reportes">Reportes</Link>
              </>
            )}

            {role === 'cocinero' && (
              <>
                <Link to="/cocina">Cocina</Link>
              </>
            )}

            {role === 'mesero' && (
              <>
                <Link to="/mesas">Mesas</Link>
                <Link to="/pedidos">Comandas</Link>
              </>
            )}
          </>
        )}
      </div>

      <div className="navbar-user-info">
        {currentUser ? (
          <>
            <span>Hola, {currentUser.email} ({role})</span>
            <button onClick={handleLogout} className="btn btn-danger">
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
