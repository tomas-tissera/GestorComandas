// src/pages/MeseroDashboard.js
import React from 'react';
import { useAuth } from '../components/AuthProvider';

const MeseroDashboard = () => {
  const { currentUser, role } = useAuth();
  return (
    <div style={{ padding: '20px' }}>
      <h2>Dashboard de Mesero</h2>
      <p>Bienvenido, {currentUser?.email}!</p>
      <p>Tu rol es: {role}</p>
      {/* Aquí el contenido específico para el mesero */}
      <h3>Órdenes Pendientes</h3>
      <ul>
        <li>Mesa 5: Orden de Bebidas</li>
        <li>Mesa 2: Pedido Principal</li>
      </ul>
    </div>
  );
};

export default MeseroDashboard;