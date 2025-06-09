// src/pages/GerenteDashboard.js
import React from 'react';
import { useAuth } from '../components/AuthProvider';
import TaskBoard from '../components/tareas/TaskBoard';
import Styles from '../css/dash.module.css';
import ResumenDiario from '../components/comandas/ResumenDiario';
import EstadisticasGeneralesGerente from '../components/gerente/EstadisticasGeneralesGerente';
const GerenteDashboard = () => {
  const { currentUser, role } = useAuth();
  return (
    <div style={{ padding: '20px' }} className={Styles.dashCuerpo}> 
      <div className={Styles.dashTitle}>
      
        <h2>Dashboard de Gerente</h2>
        <p>Bienvenido, {currentUser?.email}!</p>
        <p>Tu rol es: {role}</p>
      </div>
      <ResumenDiario/>
      <EstadisticasGeneralesGerente/>
    </div>
  );
};

export default GerenteDashboard;