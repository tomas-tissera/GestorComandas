// src/components/usuarios/VentasUsuariosGerente.js

import React, { useEffect, useState, useMemo } from "react";
import { useComandas } from "../../hooks/useComandas";
import { useProductos } from "../../hooks/useProductos";
import { useUsers } from "../../hooks/useUsers";
import '../../App.css'; // Importa App.css para las clases globales de spinner y skeleton

// Importa las funciones de Firebase para llamar a Cloud Functions
import { getFunctions, httpsCallable } from 'firebase/functions';

const formatCurrency = (amount) => {
  const numericAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
};

export default function VentasUsuariosGerente() {
  // --- TODAS LAS LLAMADAS A HOOKS DEBEN IR AQUÍ, AL PRINCIPIO ---

  // Hooks de datos personalizados
  const fetchedComandas = useComandas();
  const fetchedProductos = useProductos();
  const fetchedUsers = useUsers();

  // Estados locales (useState)
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState({ loading: false, error: null, success: null });

  // Inicialización de Firebase Functions (esto es un hook o depende de un hook, se declara aquí)
  // IMPORTANTE: Si tus Cloud Functions no están en 'us-central1', especifica la región aquí:
  // const functions = getFunctions(undefined, 'your-region'); // e.g., 'southamerica-east1'
  const functions = getFunctions(); 
  const deleteAndArchiveUser = httpsCallable(functions, 'deleteAndArchiveUser'); // Nombre de la nueva Cloud Function

  // Derivación de estados o datos para optimización (useMemo)
  const allComandas = fetchedComandas || [];
  const allProductos = fetchedProductos || [];
  const allUsers = fetchedUsers || [];

  const loadingComandas = fetchedComandas === null;
  const loadingProductos = fetchedProductos === null;
  const loadingUsers = fetchedUsers === null;

  const isLoading = loadingComandas || loadingProductos || loadingUsers;

  const meseros = useMemo(() => {
    return allUsers.filter(user => user.rol === 'mesero' || !user.rol);
  }, [allUsers]);

  // Funciones que usan datos o dependencias declaradas como hooks
  const calcularTotalComanda = (comanda) => {
    if (!comanda || !Array.isArray(comanda.productos) || allProductos.length === 0) return 0;

    return comanda.productos.reduce((total, prod) => {
      const productoInfo = allProductos.find((p) => p.id === prod.productoId);
      if (!productoInfo) {
        console.warn(`Producto con ID ${prod.productoId} no encontrado.`);
        return total;
      }
      const precio = parseFloat(productoInfo.precio) || 0;
      const cantidad = parseFloat(prod.cantidad) || 0;
      return total + (precio * cantidad);
    }, 0);
  };

  const meserosPerformanceData = useMemo(() => {
    if (isLoading || allComandas.length === 0 || allProductos.length === 0 || meseros.length === 0) {
      return {};
    }

    const performanceByMesero = {};

    meseros.forEach(mesero => {
      const nombreCompleto = `${mesero.nombre || ''} ${mesero.apellido || ''}`.trim();
      const displayMeseroName = nombreCompleto || mesero.email || `UID: ${mesero.id}`;

      if (!nombreCompleto) {
          console.warn(`Mesero con ID ${mesero.id} no tiene nombre o apellido definido. Mostrando: ${displayMeseroName}.`);
      }

      performanceByMesero[mesero.id] = {
        id: mesero.id,
        nombre: displayMeseroName,
        totalComandas: 0,
        totalVentas: 0,
        productosVendidosCount: {},
      };
    });

    allComandas.forEach(comanda => {
      const meseroId = comanda.meseroId;
      const mesero = meseros.find(m => m.id === meseroId);

      if (!mesero) {
        return;
      }

      performanceByMesero[meseroId].totalComandas++;
      const comandaTotal = calcularTotalComanda(comanda);
      performanceByMesero[meseroId].totalVentas += comandaTotal;

      if (comanda.productos && allProductos.length > 0) {
        comanda.productos.forEach(prod => {
          const productoInfo = allProductos.find(p => p.id === prod.productoId);
          if (productoInfo) {
            const cantidad = parseFloat(prod.cantidad) || 0;
            const currentCount = performanceByMesero[meseroId].productosVendidosCount[productoInfo.nombre] || 0;
            performanceByMesero[meseroId].productosVendidosCount[productoInfo.nombre] = currentCount + cantidad;
          }
        });
      }
    });

    Object.keys(performanceByMesero).forEach(meseroId => {
      const currentMesero = performanceByMesero[meseroId];
      currentMesero.topProductos = Object.entries(currentMesero.productosVendidosCount)
        .map(([nombre, cantidad]) => ({ nombre, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 3);
      delete currentMesero.productosVendidosCount;
    });

    return performanceByMesero;
  }, [isLoading, allComandas, allProductos, meseros, calcularTotalComanda]);

  const isLoadingScreen = isLoading; // Puedes mantener esta variable si quieres

  // Funciones de manejo de eventos
  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowConfirmModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    setDeleteStatus({ loading: true, error: null, success: null });
    setShowConfirmModal(false); // Cierra el modal de confirmación

    try {
      const result = await deleteAndArchiveUser({ userId: userToDelete.id });
      setDeleteStatus({ loading: false, success: result.data.message, error: null });
      setTimeout(() => setDeleteStatus({ loading: false, error: null, success: null }), 5000); // Limpiar mensaje
    } catch (err) {
      console.error("Error al eliminar usuario:", err);
      let errorMessage = "Ocurrió un error al intentar eliminar el usuario.";
      if (err.code) {
        switch (err.code) {
          case 'unauthenticated':
            errorMessage = 'No estás autenticado para realizar esta acción.';
            break;
          case 'permission-denied':
            errorMessage = 'No tienes permisos para eliminar usuarios.';
            break;
          case 'not-found':
            errorMessage = 'El usuario a eliminar no fue encontrado.';
            break;
          case 'internal':
            errorMessage = `Error interno del servidor: ${err.message}`;
            break;
          default:
            errorMessage = `Error inesperado: ${err.message || 'Ocurrió un error desconocido.'}`;
        }
      } else {
        errorMessage = err.message || errorMessage;
      }
      setDeleteStatus({ loading: false, error: errorMessage, success: null });
      setTimeout(() => setDeleteStatus({ loading: false, error: null, success: null }), 5000); // Limpiar mensaje
    } finally {
      setUserToDelete(null); // Limpiar el usuario a eliminar
    }
  };

  const cancelDelete = () => {
    setShowConfirmModal(false);
    setUserToDelete(null);
  };
  
  // --- A PARTIR DE AQUÍ, YA PUEDES TENER TUS RETURNS CONDICIONALES O EL JSX NORMAL ---

  // Esto se declara aquí porque `allUsers` se necesita para el `useMemo` de `meseros` y
  // para `allUsersCategorized` antes del renderizado condicional principal.
  const allUsersCategorized = useMemo(() => {
    return allUsers; 
  }, [allUsers]);

  if (isLoadingScreen) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '200px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        margin: '20px auto',
        maxWidth: '1200px',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div className="spinner"></div> 
        <p style={{ color: '#555', fontSize: '18px' }}>Cargando datos de desempeño de meseros...</p>
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '25px',
            width: '100%',
            padding: '20px'
        }}>
            {[...Array(3)].map((_, index) => (
                <div key={index} className="loading-skeleton" style={{
                    backgroundColor: '#f8f8f8',
                    padding: '25px',
                    borderRadius: '12px',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
                    borderTop: '6px solid #9c27b0',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '200px'
                }}>
                    <div className="skeleton-line" style={{ width: '80%', height: '1.5em', margin: '0 auto 10px auto' }}></div>
                    <div className="skeleton-line" style={{ width: '60%', height: '1em', margin: '0 auto 15px auto' }}></div>
                    <div className="skeleton-line" style={{ width: '70%', height: '1.2em', margin: '5px auto' }}></div>
                    <div className="skeleton-line" style={{ width: '50%', height: '1.2em', margin: '5px auto' }}></div>
                    <div className="skeleton-line" style={{ width: '40%', height: '1.2em', margin: '15px auto 5px auto' }}></div>
                    <div className="skeleton-line" style={{ width: '30%', height: '1em', margin: '3px auto' }}></div>
                    <div className="skeleton-line" style={{ width: '35%', height: '1em', margin: '3px auto' }}></div>
                </div>
            ))}
        </div>
      </div>
    );
  }

  return (
    <section style={{
      padding: '20px',
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    }}>
      <h3 style={{
        textAlign: 'center',
        color: '#333',
        marginBottom: '30px',
        fontSize: '28px',
        borderBottom: '2px solid #f0f0f0',
        paddingBottom: '15px'
      }}>
        Gestión de Usuarios
      </h3>

      {/* Mensajes de estado de la eliminación */}
      {deleteStatus.loading && <p style={{ textAlign: 'center', color: '#007bff', fontSize: '16px', marginBottom: '15px' }}>Eliminando usuario...</p>}
      {deleteStatus.error && <p style={{ textAlign: 'center', color: '#dc3545', fontSize: '16px', marginBottom: '15px' }}>Error: {deleteStatus.error}</p>}
      {deleteStatus.success && <p style={{ textAlign: 'center', color: '#28a745', fontSize: '16px', marginBottom: '15px' }}>{deleteStatus.success}</p>}

      {allUsersCategorized.length === 0 && !isLoadingScreen ? (
        <p style={{ textAlign: 'center', padding: '40px', color: '#777', fontSize: '18px' }}>
          No se encontraron usuarios en el sistema.
        </p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '25px',
          padding: '20px'
        }}>
          {allUsersCategorized.map(user => { // Itera sobre todos los usuarios para la gestión
            const performance = meserosPerformanceData[user.id]; // Si es mesero, tendrá datos de rendimiento
            
            const userNombreCompleto = `${user.nombre || ''} ${user.apellido || ''}`.trim();
            const displayUserName = userNombreCompleto || user.email || `UID: ${user.id}`;

            return (
              <div key={user.id} style={{
                backgroundColor: '#fff',
                padding: '25px',
                borderRadius: '12px',
                boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
                borderTop: `6px solid ${user.rol === 'gerente' ? '#ffc107' : user.rol === 'mesero' ? '#007bff' : '#6c757d'}`, // Colores por rol
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative' // Para posicionar el botón de eliminar
              }}>
                <h4 style={{ margin: '0 0 5px 0', color: '#333', fontSize: '22px' }}>{displayUserName}</h4>
                <p style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#555' }}>Rol: <strong style={{ textTransform: 'capitalize' }}>{user.role || 'N/A'}</strong></p>
                <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#888' }}>UID: {user.id}</p>
                {/* Mostrar performance solo si es mesero y hay datos */}
                {user.rol === 'mesero' && performance ? (
                  <>
                    <p style={{ margin: '5px 0', fontSize: '18px', color: '#555' }}>Total Comandas: <strong style={{ color: '#007bff' }}>{performance.totalComandas}</strong></p>
                    <p style={{ margin: '5px 0', fontSize: '18px', color: '#555' }}>Ventas Totales: <strong style={{ color: '#007bff' }}>{formatCurrency(performance.totalVentas)}</strong></p>
                    <div style={{ marginTop: '15px' }}>
                      <h5 style={{ margin: '0 0 10px 0', color: '#666', fontSize: '16px' }}>Top Productos:</h5>
                      {performance.topProductos && performance.topProductos.length > 0 ? (
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '16px', color: '#777' }}>
                          {performance.topProductos.map((prod, idx) => (
                            <li key={idx} style={{ marginBottom: '3px' }}>
                              {prod.nombre} (<strong style={{ color: '#007bff' }}>{prod.cantidad}</strong> unid.)
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p style={{ fontSize: '16px', color: '#999' }}>Sin ventas de productos.</p>
                      )}
                    </div>
                  </>
                ) : user.rol === 'mesero' && !performance ? (
                    <p style={{ margin: '5px 0', fontSize: '18px', color: '#555' }}>Sin datos de rendimiento aún.</p>
                ) : (
                    <p style={{ margin: '5px 0', fontSize: '16px', color: '#666' }}>No aplica rendimiento para este rol.</p>
                )}

                {/* Botón de Eliminar Usuario */}
                {/* Puedes añadir una lógica para que un gerente no se pueda eliminar a sí mismo, o no pueda eliminar a otro gerente. */}
                <button
                  onClick={() => handleDeleteClick(user)}
                  style={{
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 15px',
                    fontSize: '1em',
                    cursor: 'pointer',
                    marginTop: '20px',
                    transition: 'background-color 0.3s ease',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c82333'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc3545'}
                  disabled={deleteStatus.loading} // Deshabilita si ya está eliminando
                >
                  {deleteStatus.loading && userToDelete?.id === user.id ? 'Eliminando...' : 'Eliminar Usuario'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Confirmación para Eliminar Usuario */}
      {showConfirmModal && userToDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000 // Asegura que esté por encima de todo
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '10px',
            textAlign: 'center',
            boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h4 style={{ color: '#333', marginBottom: '20px' }}>Confirmar Eliminación</h4>
            <p style={{ marginBottom: '25px', color: '#555' }}>
              ¿Estás seguro de que quieres eliminar a <strong style={{ color: '#dc3545' }}>{userToDelete.nombre} {userToDelete.apellido}</strong> (Rol: {userToDelete.rol})?
              Esta acción es irreversible y el usuario será movido al historial.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-around', gap: '15px' }}>
              <button
                onClick={confirmDeleteUser}
                style={{
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  padding: '10px 20px',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s ease',
                  flex: 1
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c82333'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc3545'}
              >
                Sí, Eliminar
              </button>
              <button
                onClick={cancelDelete}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  padding: '10px 20px',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s ease',
                  flex: 1
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#5a6268'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6c757d'}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}