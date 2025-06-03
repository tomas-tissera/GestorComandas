// src/pages/GerenteDashboard.js
import React from 'react';
import { useAuth } from '../components/AuthProvider';
import TaskBoard from '../components/tareas/TaskBoard'
import CrearCategoria from '../components/tareas/CrearCategoria';
import CrearProducto from '../components/tareas/CrearProducto';
import CrearMesa from '../components/tareas/CrearMesa';
const GerenteDashboard = () => {
  const { currentUser, role } = useAuth();
  return (
    <div style={{ padding: '20px' }}>
      <h2>Dashboard de Gerente</h2>
      <p>Bienvenido, {currentUser?.email}!</p>
      <p>Tu rol es: {role}</p>
      <CrearCategoria />
      <CrearProducto />
      <TaskBoard></TaskBoard>
    </div>
  );
};

export default GerenteDashboard;