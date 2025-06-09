import React, { useMemo } from 'react';
import { useComandas } from '../../hooks/useComandas';
import styles from '../../css/ResumenDiario.module.css';

const Loading = () => (
    <div className={styles.loadingContainer}>
      <div className={styles.spinner}></div>
      Cargando datos...
    </div>
  );

const formatCurrency = (amount) => {
  const numericAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
};

const ResumenDiario = () => {
  const comandas = useComandas();
  const hoy = new Date();

  // CALCULOS Y HOOKS ANTES DEL RETURN
  const comandasPagadasHoy = useMemo(() => {
    return comandas.filter((c) => {
      if (c.estado === 'pagado' && c.fechaPago) {
        const fecha = new Date(c.fechaPago);
        return (
          fecha.getDate() === hoy.getDate() &&
          fecha.getMonth() === hoy.getMonth() &&
          fecha.getFullYear() === hoy.getFullYear()
        );
      }
      return false;
    });
  }, [comandas, hoy]);

  const totalGanado = comandasPagadasHoy.reduce((acc, c) => {
    const productos = Array.isArray(c.productos) ? c.productos : [];
    const totalComanda = productos.reduce((sum, p) => {
      const precio = parseFloat(p.precio) || 0;
      const cantidad = parseInt(p.cantidad) || 0;
      return sum + precio * cantidad;
    }, 0);
    return acc + totalComanda;
  }, 0);

  const metodoPagoStats = useMemo(() => {
    const stats = {};
    comandasPagadasHoy.forEach((c) => {
      const metodo = c.metodoPago || 'sin especificar';
      const productos = Array.isArray(c.productos) ? c.productos : [];
      const totalComanda = productos.reduce((sum, p) => {
        const precio = parseFloat(p.precio) || 0;
        const cantidad = parseInt(p.cantidad) || 0;
        return sum + precio * cantidad;
      }, 0);
      if (!stats[metodo]) stats[metodo] = 0;
      stats[metodo] += totalComanda;
    });
    return stats;
  }, [comandasPagadasHoy]);

  const topProductos = useMemo(() => {
    const productoVentas = {};

    comandasPagadasHoy.forEach((c) => {
      const productos = Array.isArray(c.productos) ? c.productos : [];
      productos.forEach((p) => {
        const nombre = p.nombre || 'Producto sin nombre';
        const cantidad = parseInt(p.cantidad) || 0;

        if (!productoVentas[nombre]) {
          productoVentas[nombre] = 0;
        }
        productoVentas[nombre] += cantidad;
      });
    });

    return Object.entries(productoVentas)
      .sort(([, aCantidad], [, bCantidad]) => bCantidad - aCantidad)
      .slice(0, 3);
  }, [comandasPagadasHoy]);

  // AHORA SÍ EL RETURN CONDICIONAL
  if (!comandas || comandas.length === 0) {
    return <Loading />;
  }

  return (
    <section className={styles.container}>
      <h3 className={styles.title}>Resumen Diario</h3>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h4 className={styles.cardTitle}>Comandas Pagadas Hoy</h4>
          <p className={styles.cardValue}>{comandasPagadasHoy.length}</p>
        </div>

        <div className={styles.statCard}>
          <h4 className={styles.cardTitle}>Total Ganado</h4>
          <p className={styles.cardValue}>{formatCurrency(totalGanado)}</p>
        </div>

        {Object.entries(metodoPagoStats).map(([metodo, monto]) => (
          <div key={metodo} className={styles.statCard}>
            <h4 className={styles.cardTitle}>Pago con {metodo}</h4>
            <p className={styles.cardValue}>{formatCurrency(monto)}</p>
          </div>
        ))}

        <div className={styles.statCard} style={{ gridColumn: 'span 3' }}>
          <h4 className={styles.cardTitle}>Top 3 Productos Más Vendidos</h4>
          <ul className={styles.cardValue}>
            {topProductos.map(([nombre, cantidad]) => (
              <li key={nombre}>
                {nombre}: {cantidad} vendidos
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default ResumenDiario;
