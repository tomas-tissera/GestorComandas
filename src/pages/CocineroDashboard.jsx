// src/pages/CocineroDashboard.js
import React from 'react';
import { useAuth } from '../components/AuthProvider';

const CocineroDashboard = () => {
  const { currentUser, role } = useAuth();
  return (
    <div style={{ padding: '20px' }}>
      <h2>Dashboard de Cocinero</h2>
      <p>Bienvenido, {currentUser?.email}!</p>
      <p>Tu rol es: {role}</p>
      {/* Aquí el contenido específico para el cocinero */}
      <h3>Pedidos para Cocinar</h3>
      <ul>
        <li>Plato: Hamburguesa Clásica (Mesa 2)</li>
        <li>Plato: Ensalada César (Mesa 7)</li>
      </ul>
    </div>
  );
};

export default CocineroDashboard;