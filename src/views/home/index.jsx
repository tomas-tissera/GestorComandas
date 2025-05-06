import React, { useState,useRef, useEffect,useCallback , useMemo} from 'react';
import TaskBoard from '../../components/tareas/TaskBoard.jsx'
const Home = () => {
    return (
      <div style={{ padding: 20 }}>
        <h2>Gestión de Pedidos</h2>
        <TaskBoard />
    </div>
)};
export default Home;