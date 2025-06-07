// src/components/DashboardGerentePerformance.js
import React, { useEffect, useState, useMemo } from "react";
import { db } from '../firebase';
import { collection, getDocs, query } from 'firebase/firestore';

import VentasUsuariosGerente from "./usuarios/VentasUsuariosGerente";
import CrearUsuarioGerente from "./usuarios/CrearUsuarioGerente";
import EstadisticasGeneralesGerente from "./gerente/EstadisticasGeneralesGerente";
import styles from '../css/DashboardGerentePerformance.module.css';
// Importa el archivo global de estilos si tus clases de spinner y skeleton están allí
// import '../App.css'; // Asegúrate de que esta línea esté presente si usas clases globales de App.css

export default function DashboardGerentePerformance() {
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [alert, setAlert] = useState({ message: '', type: '' });
  
  const [totalUsers, setTotalUsers] = useState(0);
  const [usersByRole, setUsersByRole] = useState({});
  const [loadingUserStats, setLoadingUserStats] = useState(true);
  const [userStatsError, setUserStatsError] = useState(null);

  const fetchUserStats = async () => {
    setLoadingUserStats(true);
    setUserStatsError(null);
    try {
      const usersCollectionRef = collection(db, 'users');
      const q = query(usersCollectionRef);
      const querySnapshot = await getDocs(q);

      let count = 0;
      const rolesCount = {};

      querySnapshot.forEach((doc) => {
        count++;
        const userData = doc.data();
        const role = userData.role || 'desconocido';
        rolesCount[role] = (rolesCount[role] || 0) + 1;
      });

      setTotalUsers(count);
      setUsersByRole(rolesCount);

    } catch (error) {
      console.error("Error al obtener estadísticas de usuarios:", error);
      setUserStatsError("Error al cargar las estadísticas de usuarios.");
    } finally {
      setLoadingUserStats(false);
    }
  };

  useEffect(() => {
    fetchUserStats();
  }, []);

  const handleOpenCreateUserModal = () => {
    setShowCreateUserModal(true);
  };

  const handleCloseCreateUserModal = () => {
    setShowCreateUserModal(false);
    setAlert({ message: '', type: '' }); 
    fetchUserStats(); // Refresh stats when modal closes (important after user creation)
  };

  const handleUserCreatedAlert = (type, message) => {
    setAlert({ message, type });
  };

  useEffect(() => {
    if (alert.message) {
      const timer = setTimeout(() => {
        setAlert({ message: '', type: '' });
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [alert.message]);

  return (
    <div className={styles.dashboardContainer}>
      {alert.message && (
        <div className={`${styles.alert} ${styles[alert.type]}`}>
          {alert.message}
        </div>
      )}

      <div className={styles.topBar}>
        <div className={styles.userStatsSection}> {/* Nuevo contenedor para organizar las stats */}
          {loadingUserStats ? (
            // ** ANIMACIÓN DE ESQUELETO AQUI **
            // Aplicamos las clases globales para el esqueleto
            <>
              <div className={`${styles.statCard} loading-skeleton`}>
                <div className="skeleton-line" style={{ width: '70%' }}></div>
                <div className="skeleton-line" style={{ width: '40%', height: '2em' }}></div>
              </div>
              <div className={`${styles.statCard} loading-skeleton`}>
                <div className="skeleton-line" style={{ width: '80%' }}></div>
                <div className="skeleton-line" style={{ width: '60%' }}></div>
                <div className="skeleton-line" style={{ width: '50%' }}></div>
              </div>
            </>
          ) : userStatsError ? (
            <p className={styles.errorText}>{userStatsError}</p>
          ) : (
            <>
              <div className={styles.statCard}>
                <h3 className={styles.statTitle}>Usuarios Registrados</h3>
                <p className={styles.statNumber}>{totalUsers}</p>
              </div>
              <div className={styles.statCard}>
                <h3 className={styles.statTitle}>Roles del Personal</h3>
                <ul className={styles.rolesList}>
                  {Object.entries(usersByRole).map(([role, count]) => (
                    <li key={role} className={styles.roleItem}>
                      <span className={styles.roleName}>{role.charAt(0).toUpperCase() + role.slice(1)}:</span> 
                      <span className={styles.roleCount}>{count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>

        <button 
          className={styles.createButton} 
          onClick={handleOpenCreateUserModal}
        >
          <svg className={styles.createButtonIcon} xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#FFFFFF"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          Crear Nuevo Usuario
        </button>
      </div>
      
      {/* Contenido principal del dashboard */}
      {/* Puedes añadir una sección para tus otros componentes si quieres separarlos visualmente */}
      <div className={styles.mainContentArea}>
        <EstadisticasGeneralesGerente />
        <VentasUsuariosGerente />
      </div>
      
      {/* Modal para CrearUsuarioGerente */}
      {showCreateUserModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <CrearUsuarioGerente 
              onClose={handleCloseCreateUserModal} 
              onUserCreated={handleUserCreatedAlert} 
            />
          </div>
        </div>
      )}
    </div>
  );
}