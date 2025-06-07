import React, { useEffect, useState, useMemo } from "react";
import { useComandas } from "../../hooks/useComandas";
import { useProductos } from "../../hooks/useProductos";
import { useUsers } from "../../hooks/useUsers";
import '../../App.css'; // Importa App.css para las clases globales de spinner y skeleton

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
  const fetchedComandas = useComandas();
  const fetchedProductos = useProductos();
  const fetchedUsers = useUsers();

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
      // Si está cargando o faltan datos, retorna un objeto vacío o la lógica de carga para evitar cálculos prematuros.
      // Cuando isLoading es true, el componente ya mostrará el spinner o los esqueletos.
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

  const isLoadingScreen = isLoading;

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
        {/* Usamos la clase global .spinner */}
        <div className="spinner"></div> 
        <p style={{ color: '#555', fontSize: '18px' }}>Cargando datos de desempeño de meseros...</p>
        
        {/* Aquí agregamos los esqueletos de las tarjetas de meseros */}
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '25px',
            width: '100%', // Para que los esqueletos llenen el contenedor
            padding: '20px'
        }}>
            {[...Array(3)].map((_, index) => ( // Muestra 3 tarjetas de esqueleto
                <div key={index} className="loading-skeleton" style={{
                    backgroundColor: '#f8f8f8',
                    padding: '25px',
                    borderRadius: '12px',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
                    borderTop: '6px solid #9c27b0', // Simula el color del borde de las tarjetas
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '200px' // Altura para las tarjetas de esqueleto
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

  const meserosWithPerformance = Object.values(meserosPerformanceData);

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
        Desempeño General de Meseros
      </h3>

      {meserosWithPerformance.length === 0 && meseros.length > 0 && !isLoadingScreen ? (
        <p style={{ textAlign: 'center', color: '#777', fontSize: '16px', padding: '20px' }}>
          No hay datos de rendimiento disponibles para los meseros encontrados.
        </p>
      ) : meseros.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '40px', color: '#777', fontSize: '18px' }}>
          No se encontraron meseros en el sistema.
        </p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '25px',
          padding: '20px'
        }}>
          {meseros.map(mesero => {
            const performance = meserosPerformanceData[mesero.id];
            
            const meseroNombreCompleto = `${mesero.nombre || ''} ${mesero.apellido || ''}`.trim();
            const displayMeseroName = meseroNombreCompleto || mesero.email || `UID: ${mesero.id}`;

            // Si el mesero no tiene comandas registradas, muestra su tarjeta con ceros
            if (!performance) {
              return (
                <div key={mesero.id} style={{
                  backgroundColor: '#f8f8f8',
                  padding: '25px',
                  borderRadius: '12px',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
                  borderTop: '6px solid #9c27b0',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <h4 style={{ margin: '0 0 5px 0', color: '#333', fontSize: '22px' }}>{displayMeseroName}</h4>
                  <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#888' }}>UID: {mesero.id}</p>
                  <p style={{ margin: '5px 0', fontSize: '18px', color: '#555' }}>Total Comandas: <strong style={{ color: '#9c27b0' }}>0</strong></p>
                  <p style={{ margin: '5px 0', fontSize: '18px', color: '#555' }}>Ventas Totales: <strong style={{ color: '#9c27b0' }}>{formatCurrency(0)}</strong></p>
                  <p style={{ margin: '5px 0', fontSize: '18px', color: '#555' }}>Productos Más Vendidos: <span style={{ color: '#9c27b0' }}>Ninguno</span></p>
                </div>
              );
            }

            return (
              <div key={performance.id} style={{
                backgroundColor: '#fff',
                padding: '25px',
                borderRadius: '12px',
                boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
                borderTop: '6px solid #9c27b0',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <h4 style={{ margin: '0 0 5px 0', color: '#333', fontSize: '22px' }}>{performance.nombre}</h4>
                <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#888' }}>UID: {performance.id}</p>
                <p style={{ margin: '5px 0', fontSize: '18px', color: '#555' }}>Total Comandas: <strong style={{ color: '#9c27b0' }}>{performance.totalComandas}</strong></p>
                <p style={{ margin: '5px 0', fontSize: '18px', color: '#555' }}>Ventas Totales: <strong style={{ color: '#9c27b0' }}>{formatCurrency(performance.totalVentas)}</strong></p>
                <div style={{ marginTop: '15px' }}>
                  <h5 style={{ margin: '0 0 10px 0', color: '#666', fontSize: '16px' }}>Top Productos:</h5>
                  {performance.topProductos && performance.topProductos.length > 0 ? (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '16px', color: '#777' }}>
                      {performance.topProductos.map((prod, idx) => (
                        <li key={idx} style={{ marginBottom: '3px' }}>
                          {prod.nombre} (<strong style={{ color: '#9c27b0' }}>{prod.cantidad}</strong> unid.)
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ fontSize: '16px', color: '#999' }}>Sin ventas de productos.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}