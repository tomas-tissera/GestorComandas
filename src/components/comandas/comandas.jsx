// src/pages/Dashboard.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthProvider';
import LoadingSpinner from '../LoadingSpinner';
import TaskBoard from '../tareas/TaskBoard';
import ResumenDiario from './ResumenDiario';
const Comandas = () => {

  return (
    <div>
      <ResumenDiario/>
      <TaskBoard/>
    </div>
  );
};

export default Comandas;