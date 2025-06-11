// src/pages/CocineroDashboard.js
import React from 'react';
import { useAuth } from '../components/AuthProvider';
import CocinaComandasView from '../components/cocinero/CocinaComandasView';
const CocineroDashboard = () => {
  const { currentUser, role } = useAuth();
  return (
    <div style={{ padding: '20px' }}>
      {/* <h2>Dashboard de Cocinero</h2>
      <p>Bienvenido, {currentUser?.email}!</p>
      <p>Tu rol es: {role}</p> */}
      {/* Aquí el contenido específico para el cocinero */}
      <div>
        <CocinaComandasView/>
      </div>
    </div>
  );
};

export default CocineroDashboard;