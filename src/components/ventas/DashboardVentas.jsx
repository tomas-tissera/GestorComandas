import React, { useMemo } from 'react';

// Importa tus custom hooks
import { useComandas } from '../../hooks/useComandas';
import { useProductos } from '../../hooks/useProductos';
import { useUsers } from '../../hooks/useUsers';
import { useCategorias } from '../../hooks/useCategorias';

// Importaciones de Recharts
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LabelList, LineChart, Line
} from 'recharts';

// Importar módulo CSS para estilos específicos
import styles from '../../css/DashboardStats.module.css'; // Crea este archivo CSS
import EstadisticasGeneralesGerente from '../gerente/EstadisticasGeneralesGerente';
// Colores para los gráficos de torta/barras
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19A0', '#19FFD8', '#FFD819', '#82ca9d', '#ffc658'];

const DashboardStats = () => {
  // Uso de tus custom hooks para obtener los datos
  const fetchedComandas = useComandas();
  const fetchedProductos = useProductos();
  const fetchedUsers = useUsers(); // Para el nombre del mesero
  const fetchedCategorias = useCategorias(); // Para el nombre de la categoría

  // Normaliza los datos a arrays vacíos si aún están cargando (null)
  const comandas = fetchedComandas || [];
  const productos = fetchedProductos || [];
  const users = fetchedUsers || [];
  const categorias = fetchedCategorias || [];

  // Determina si los datos principales han terminado de cargar
  const isLoading = fetchedComandas === null || fetchedProductos === null || fetchedUsers === null || fetchedCategorias === null;

  // --- Cálculos de Métricas y Datos para Gráficos (usando useMemo para optimización) ---
  const {
    totalSales,
    totalPaidComandas,
    averageTicket,
    dailySalesData,
    categoryOrderData,
    topProductsData,
    paymentMethodData,
    meseroSalesData,
  } = useMemo(() => {
    if (isLoading) {
      return {
        totalSales: 0,
        totalPaidComandas: 0,
        averageTicket: 0,
        dailySalesData: [],
        categoryOrderData: [],
        topProductsData: [],
        paymentMethodData: [],
        meseroSalesData: [],
      };
    }

    // Obtener el mes y año actual para filtrar las ventas
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11
    const currentYear = now.getFullYear();

    // FILTRAR LAS COMANDAS PAGADAS Y DEL MES ACTUAL
    const paidComandasThisMonth = comandas.filter(c => {
      if (c.estado !== 'pagado' || !c.fechaPago) return false;
      
      const paymentDate = new Date(c.fechaPago);
      return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
    });

    const calculatedTotalSales = paidComandasThisMonth.reduce((sum, comanda) => sum + (parseFloat(comanda.cobrado) || 0), 0);
    const calculatedTotalPaidComandas = paidComandasThisMonth.length;
    const calculatedAverageTicket = calculatedTotalPaidComandas > 0 ? (calculatedTotalSales / calculatedTotalPaidComandas).toFixed(2) : 0;

    // --- Ventas Diarias para el Mes Actual ---
    const salesByDate = {};
    // Para asegurar que todos los días del mes actual estén presentes, incluso si no hubo ventas.
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate(); // Obtiene el último día del mes
    
    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(currentYear, currentMonth, i);
        // Formato 'YYYY-MM-DD' para ordenar correctamente
        const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        salesByDate[formattedDate] = 0; // Inicializa todas las ventas del mes a 0
    }

    paidComandasThisMonth.forEach(comanda => {
      const paymentDate = new Date(comanda.fechaPago);
      // Extrae la fecha en formato 'YYYY-MM-DD'
      const formattedDate = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}-${String(paymentDate.getDate()).padStart(2, '0')}`;
      
      const cobrado = parseFloat(comanda.cobrado) || 0;
      salesByDate[formattedDate] = (salesByDate[formattedDate] || 0) + cobrado;
    });

    const calculatedDailySalesData = Object.keys(salesByDate).sort().map(date => ({
      // Formato 'DD/MM' para el eje X, más conciso para el mes completo
      date: `${date.substring(8, 10)}/${date.substring(5, 7)}`, 
      sales: salesByDate[date],
    }));

    // --- Otros cálculos que no necesitan filtrado por mes (o ya lo hacen implícitamente por `comandas` o `paidComandas`) ---
    const categoryCounts = {};
    comandas.forEach(comanda => { // Usamos todas las comandas, no solo las pagadas del mes
      comanda.productos && comanda.productos.forEach(comandaProduct => {
        const correspondingProduct = productos.find(p => p.id === comandaProduct.productoId);
        if (correspondingProduct) {
          const cantidadVendida = parseFloat(comandaProduct.cantidad) || 0;
          const category = categorias.find(cat => cat.id === correspondingProduct.cat_productos_id);
          const categoryName = category ? category.nombre : 'Sin Categoría';
          categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + cantidadVendida;
        }
      });
    });
    const calculatedCategoryOrderData = Object.entries(categoryCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .map(([name, count]) => ({ name, orders: count }));

    const productSalesCounts = {};
    comandas.forEach(comanda => { // Usamos todas las comandas
      comanda.productos && comanda.productos.forEach(comandaProduct => {
        const correspondingProduct = productos.find(p => p.id === comandaProduct.productoId);
        if (correspondingProduct) {
          const productName = correspondingProduct.nombre;
          const quantitySold = parseFloat(comandaProduct.cantidad) || 0;
          productSalesCounts[productName] = (productSalesCounts[productName] || 0) + quantitySold;
        }
      });
    });
    const calculatedTopProductsData = Object.entries(productSalesCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    const paymentMethods = {};
    paidComandasThisMonth.forEach(comanda => { // Este sí debe usar las pagadas del mes si el total de ventas es del mes
      const method = comanda.metodoPago || 'Desconocido';
      paymentMethods[method] = (paymentMethods[method] || 0) + 1;
    });
    const calculatedPaymentMethodData = Object.entries(paymentMethods).map(([name, value]) => ({ name, value }));

    const meseroSales = {};
    paidComandasThisMonth.forEach(comanda => { // También usar las pagadas del mes
      const meseroId = comanda.meseroId;
      if (meseroId) {
        const cobrado = parseFloat(comanda.cobrado) || 0;
        meseroSales[meseroId] = (meseroSales[meseroId] || 0) + cobrado;
      }
    });
    const calculatedMeseroSalesData = Object.entries(meseroSales).map(([meseroId, sales]) => {
      const mesero = users.find(user => user.id === meseroId);
      const meseroName = mesero ? (mesero.nombre || mesero.displayName || `Mesero ${meseroId}`) : `Mesero ${meseroId}`;
      return { name: meseroName, sales };
    });

    return {
      totalSales: calculatedTotalSales,
      totalPaidComandas: calculatedTotalPaidComandas,
      averageTicket: calculatedAverageTicket,
      dailySalesData: calculatedDailySalesData,
      categoryOrderData: calculatedCategoryOrderData,
      topProductsData: calculatedTopProductsData,
      paymentMethodData: calculatedPaymentMethodData,
      meseroSalesData: calculatedMeseroSalesData,
    };
  }, [isLoading, comandas, productos, users, categorias]);

  if (isLoading) {
    return (
      <div className={`${styles.dashboardContainer} ${styles.loadingState}`}>
        <div className={styles.spinner}></div>
        <p className={styles.loadingText}>Cargando datos del dashboard...</p>
        <div className={styles.statsGrid}>
          {[...Array(3)].map((_, index) => (
            <div key={index} className={`${styles.statCard} ${styles.skeleton}`}>
              <div className={`${styles.skeletonLine} w-3/4 h-5 mb-2`}></div>
              <div className={`${styles.skeletonLine} w-1/2 h-8`}></div>
            </div>
          ))}
        </div>
        <div className={`${styles.chartContainer} ${styles.skeleton} h-72 mt-6`}></div>
      </div>
    );
  }

  if (comandas.length === 0 && productos.length === 0) {
    return (
      <div className={styles.dashboardContainer}>
        <h2 className={styles.mainTitle}>Dashboard de Estadísticas</h2>
        <p className={styles.noDataMessage}>No hay datos disponibles para generar estadísticas.</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <h2 className={styles.mainTitle}>Dashboard de Estadísticas del Restaurante</h2>
     
        {/* Sección de Resumen General */}
        <EstadisticasGeneralesGerente />
        

      <hr className={styles.divider} />

      {/* Gráfico de Líneas: Ventas Diarias (Ahora para todo el mes) */}
      <div className={styles.chartSection}>
        <h3 className={styles.sectionTitle}>Ventas Diarias del Mes Actual</h3>
        {dailySalesData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailySalesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className={styles.gridStroke} />
              <XAxis dataKey="date" className={styles.axisText} />
              <YAxis className={styles.axisText} tickFormatter={(value) => `$${value.toFixed(2)}`} />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#8884d8" name="Ventas" activeDot={{ r: 8 }} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className={styles.noChartData}>No hay datos de ventas diarias para el mes actual para mostrar este gráfico.</p>
        )}
      </div>

      <hr className={styles.divider} />

      {/* Gráfico de Barras: Cantidad de Productos Vendidos por Categoría */}
      <div className={styles.chartSection}>
        <h3 className={styles.sectionTitle}>Unidades Vendidas por Categoría</h3>
        {categoryOrderData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryOrderData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className={styles.gridStroke} />
              <XAxis dataKey="name" className={styles.axisText} />
              <YAxis className={styles.axisText} />
              <Tooltip />
              <Legend />
              <Bar dataKey="orders" fill="#00C49F" name="Unidades Vendidas">
                   <LabelList dataKey="orders" position="insideTop" className={styles.labelText} />
               </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className={styles.noChartData}>No hay datos de productos por categoría para mostrar este gráfico.</p>
        )}
      </div>

      <hr className={styles.divider} />

      {/* Gráfico de Barras: Top 10 Productos Más Vendidos (Unidades) */}
      <div className={styles.chartSection}>
        <h3 className={styles.sectionTitle}>Top 10 Productos Más Vendidos (Unidades)</h3>
        {topProductsData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={topProductsData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className={styles.gridStroke} />
              <XAxis type="number" className={styles.axisText} />
              <YAxis type="category" dataKey="name" width={120} className={styles.axisText} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#FFBB28" name="Cantidad Vendida">
                <LabelList dataKey="count" position="right" className={styles.labelText} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className={styles.noChartData}>No hay datos de productos para mostrar este gráfico.</p>
        )}
      </div>

      <hr className={styles.divider} />

      {/* Gráfico de Torta: Distribución de Métodos de Pago */}
      <div className={styles.chartSection}>
        <h3 className={styles.sectionTitle}>Distribución de Métodos de Pago</h3>
        {paymentMethodData.length > 0 && paymentMethodData.some(d => d.value > 0) ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentMethodData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {
                  paymentMethodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))
                }
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className={styles.noChartData}>No hay datos de métodos de pago para mostrar este gráfico.</p>
        )}
      </div>

      <hr className={styles.divider} />

      {/* Gráfico de Barras: Ventas por Mesero */}
      <div className={styles.chartSection}>
        <h3 className={styles.sectionTitle}>Ventas por Mesero</h3>
        {meseroSalesData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={meseroSalesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className={styles.gridStroke} />
              <XAxis dataKey="name" className={styles.axisText} />
              <YAxis className={styles.axisText} tickFormatter={(value) => `$${value.toFixed(2)}`} />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Legend />
              <Bar dataKey="sales" fill="#ffc658" name="Ventas Generadas">
                <LabelList dataKey="sales" position="insideTop" formatter={(value) => `$${value.toFixed(2)}`} className={styles.labelText} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className={styles.noChartData}>No hay datos de ventas por mesero para mostrar este gráfico.</p>
        )}
      </div>

    </div>
  );
};

export default DashboardStats;