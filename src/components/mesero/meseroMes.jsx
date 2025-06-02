import React, { useEffect, useState, useMemo } from "react";
import { useComandas } from "../../hooks/useComandas";
import { useProductos } from "../../hooks/useProductos";
import { getAuth } from "firebase/auth";

import styles from "../../css/DashboardMesero.module.css";

// Importar componentes de Recharts
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function DashboardMeseroMes() {
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

  // Agrupar ingresos por mes (formato 'YYYY-MM')
  const ingresosPorMes = useMemo(() => {
    const meses = {};

    comandasMesero.forEach((comanda) => {
      if (!comanda.fechaPago) return; // ignorar si no tiene fecha

      // Esperamos fechaPago en formato 'dd/mm/yyyy' o similar
      // Mejor parsear con Date:
      const partes = comanda.fechaPago.split("/");
      if (partes.length !== 3) return;
      const [dia, mes, anio] = partes;
      const fecha = new Date(`${anio}-${mes}-${dia}`);
      if (isNaN(fecha)) return;

      const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;

      const total = calcularTotalComanda(comanda);

      meses[key] = (meses[key] || 0) + total;
    });

    // Convertir objeto a arreglo para gráfico [{mes: "2023-05", ingreso: 1234}, ...]
    return Object.entries(meses)
      .map(([mes, ingreso]) => ({ mes, ingreso }))
      // Ordenar por mes ascendente
      .sort((a, b) => a.mes.localeCompare(b.mes));
  }, [comandasMesero, productos]);

  if (!idMeseroLogueado) {
    return <div>Cargando sesión...</div>;
  }

  return (
    <section className={styles.metricsSection}>
        <h3>Ingresos totales por mes</h3>
        {ingresosPorMes.length === 0 ? (
          <p>No hay datos para mostrar.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ingresosPorMes}>
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Bar dataKey="ingreso" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>
  );
}
