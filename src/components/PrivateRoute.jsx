// src/components/PrivateRoute.js
import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { currentUser, role, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />; // Esperar a que la autenticación cargue
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Podrías redirigir a una página de "Acceso Denegado"
    return <Navigate to="/dashboard" replace />; // O al dashboard por defecto
  }

  return children;
};

export default PrivateRoute;