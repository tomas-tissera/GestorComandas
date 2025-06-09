// src/pages/GerenteDashboard.js
import React from 'react';
import { useAuth } from '../components/AuthProvider';
import TaskBoard from '../components/tareas/TaskBoard';
import Styles from '../css/dash.module.css';
const GerenteDashboard = () => {
  const { currentUser, role } = useAuth();
  return (
    <div style={{ padding: '20px' }}>
      <div className={Styles.dashTitle}>
      
        <h2>Dashboard de Gerente</h2>
        <p>Bienvenido, {currentUser?.email}!</p>
        <p>Tu rol es: {role}</p>
      </div>
    </div>
  );
};

export default GerenteDashboard;