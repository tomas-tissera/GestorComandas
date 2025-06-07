import React, { useEffect, useState, useMemo } from "react";
import { useComandas } from "../hooks/useComandas";
import { useProductos } from "../hooks/useProductos";
import { getAuth } from "firebase/auth";
import styles from "../css/DashboardMesero.module.css";
import DashboardMeseroComandas from "../components/mesero/DashboardMeseroComandas";
export default function DashboardMesero() {
  const comandas = useComandas();
  const productos = useProductos();
  const auth = getAuth();
  const idMeseroLogueado = auth.currentUser?.uid;

  const [comandasMesero, setComandasMesero] = useState([]);

  useEffect(() => {
    if (idMeseroLogueado && comandas.length > 0) {
      const filtradas = comandas.filter(
        (comanda) => comanda.meseroId === idMeseroLogueado
      );
      setComandasMesero(filtradas);
    }
  }, [idMeseroLogueado, comandas]);

  const calcularTotalComanda = (comanda) => {
    return comanda.productos.reduce((total, prod) => {
      const productoInfo = productos.find((p) => p.id === prod.productoId);
      if (!productoInfo) return total;
      return total + productoInfo.precio * prod.cantidad;
    }, 0);
  };

  const totalComandas = comandasMesero.length;

  const totalProductosVendidos = useMemo(() => {
    return comandasMesero.reduce((acc, comanda) => {
      return (
        acc +
        comanda.productos.reduce((subAcc, prod) => subAcc + prod.cantidad, 0)
      );
    }, 0);
  }, [comandasMesero]);

  const ingresoTotal = useMemo(() => {
    return comandasMesero.reduce((acc, comanda) => {
      return acc + calcularTotalComanda(comanda);
    }, 0);
  }, [comandasMesero, productos]);

  const promedioProductosPorComanda =
    totalComandas === 0 ? 0 : totalProductosVendidos / totalComandas;

  const comandaMayorMonto = useMemo(() => {
    if (comandasMesero.length === 0) return null;
    return comandasMesero.reduce((maxComanda, currentComanda) => {
      return calcularTotalComanda(currentComanda) >
        calcularTotalComanda(maxComanda)
        ? currentComanda
        : maxComanda;
    }, comandasMesero[0]);
  }, [comandasMesero, productos]);

  if (!idMeseroLogueado) {
    return <div>Cargando sesión...</div>;
  }

  return (
    <div className={styles.container}>
        <DashboardMeseroComandas/>

      <section className={styles.metricsSection}>
        <h3>Estadísticas generales</h3>
        <ul className={styles.metricsList}>
          <li><strong>Total de comandas atendidas:</strong> {totalComandas}</li>
          <li><strong>Total de productos vendidos:</strong> {totalProductosVendidos}</li>
          <li><strong>Ingreso total generado:</strong> ${ingresoTotal.toFixed(2)}</li>
          <li><strong>Promedio de productos por comanda:</strong> {promedioProductosPorComanda.toFixed(2)}</li>
          {comandaMayorMonto && (
            <li>
              <strong>Comanda con mayor monto:</strong> Mesa {comandaMayorMonto.nombre} - $
              {calcularTotalComanda(comandaMayorMonto).toFixed(2)}
            </li>
          )}
        </ul>
      </section>

      <section>
        <h3>Comandas del Mesero Logueado</h3>
        {comandasMesero.length === 0 ? (
          <p className={styles.noComandas}>No hay comandas para este mesero.</p>
        ) : (
          comandasMesero.map((comanda) => (
            <div key={comanda.id} className={styles.comandaCard}>
                <div className={styles.comandaCardTitle}>
                    <p><strong>Mesa:</strong> {comanda.nombre}</p>
                    <p><strong>Fecha:</strong> {comanda.fechaPago}</p>
                </div>
              <p><strong>Estado:</strong> {comanda.estado}</p>
              <p><strong>Productos:</strong></p>
              <ul className={styles.productosList}>
                {comanda.productos.map((prod, i) => {
                  const productoInfo = productos.find((p) => p.id === prod.productoId);
                  return (
                    <li key={i}>
                      {productoInfo ? productoInfo.nombre : "Producto desconocido"} x {prod.cantidad}
                    </li>
                  );
                })}
              </ul>
              <hr></hr>
              <p><strong>Total: </strong>${calcularTotalComanda(comanda).toFixed(2)}</p>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
