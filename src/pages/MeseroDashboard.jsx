// src/pages/MeseroDashboard.js
import React from 'react';
import { useAuth } from '../components/AuthProvider';
import TaskBoard from '../components/tareas/TaskBoard';
import Styles from '../css/MeseroDashboard.module.css';
const MeseroDashboard = () => {
  const { currentUser, role } = useAuth();
  return (
    <div style={{ padding: '20px' }}>
      <div className={Styles.dashGeneral}>
        <h2>Dashboard de Mesero</h2>
        <p>Bienvenido, {currentUser?.email}!</p>
        <p>Tu rol es: {role}</p>
      </div>
        <TaskBoard/>
    </div>
  );
};

export default MeseroDashboard;