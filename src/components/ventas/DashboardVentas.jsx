import React, { useMemo } from 'react';

// Importa tus custom hooks para obtener datos
import { useComandas } from '../../hooks/useComandas';
import { useProductos } from '../../hooks/useProductos';
import { useUsers } from '../../hooks/useUsers';
import { useCategorias } from '../../hooks/useCategorias';

// Importaciones de Recharts para gráficos directos
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from 'recharts';

// Importar los componentes de gráficos dedicados
import DailySalesByPaymentMethodChart from './charts/DailySalesByPaymentMethodChart';
import CategoryUnitsSoldChart from './charts/CategoryUnitsSoldChart';
import PeakHoursChart from './charts/PeakHoursChart';
import MonthlySalesOverviewChart from './charts/MonthlySalesOverviewChart';
import AverageOrderValueByMeseroChart from './charts/AverageOrderValueByMeseroChart';

// Importar módulo CSS para estilos específicos
import styles from '../../css/DashboardStats.module.css';
import EstadisticasGeneralesGerente from '../gerente/EstadisticasGeneralesGerente';

// Colores para gráficos (ej. PieChart)
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19A0', '#19FFD8', '#FFD819', '#82ca9d', '#ffc658', '#4CAF50', '#FF5733', '#7D3C98'];

const DashboardStats = () => {
    // Hooks para obtener los datos de tu aplicación
    const fetchedComandas = useComandas();
    const fetchedProductos = useProductos();
    const fetchedUsers = useUsers();
    const fetchedCategorias = useCategorias();

    // Asegurarse de que los arrays no sean nulos si los hooks están cargando o no tienen datos
    const comandas = fetchedComandas || [];
    const productos = fetchedProductos || []; 
    const users = fetchedUsers || [];
    const categorias = fetchedCategorias || [];

    // Determinar si algún dato aún está cargando
    const isLoading = fetchedComandas === null || fetchedProductos === null || fetchedUsers === null || fetchedCategorias === null;

    // useMemo para calcular todas las estadísticas solo cuando las dependencias cambian
    const {
        totalSales,
        totalPaidComandas,
        averageTicket,
        dailySalesByPaymentMethodData,
        categoryOrderData,
        topProductsData,
        paymentMethodData,
        meseroSalesData,
        peakHoursData,
        monthlySalesData,
        averageTicketByMeseroData,
    } = useMemo(() => {
        // Estado de carga inicial: devolver valores vacíos
        if (isLoading) {
            return {
                totalSales: 0,
                totalPaidComandas: 0,
                averageTicket: 0,
                dailySalesByPaymentMethodData: [],
                categoryOrderData: [],
                topProductsData: [],
                paymentMethodData: [],
                meseroSalesData: [],
                peakHoursData: [],
                monthlySalesData: [],
                averageTicketByMeseroData: [],
            };
        }

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Mapea productos por ID para acceso rápido a sus detalles (especialmente el precio)
        const productsById = productos.reduce((acc, product) => {
            acc[product.id] = product;
            return acc;
        }, {});

        // --- Función auxiliar para calcular el total de una comanda ---
        // Calcula el total de la comanda sumando (cantidad * precio) de cada producto.
        const calculateComandaTotal = (comanda) => {
            let total = 0;
            if (comanda.productos && Array.isArray(comanda.productos)) {
                comanda.productos.forEach(comandaProduct => {
                    const productDetails = productsById[comandaProduct.productoId];
                    if (productDetails && typeof productDetails.precio === 'number') { // Asegura que el precio es un número
                        const cantidad = parseFloat(comandaProduct.cantidad) || 0;
                        const precio = parseFloat(productDetails.precio) || 0;
                        total += cantidad * precio;
                    }
                });
            }
            return total;
        };

        // 1. Filtra solo las comandas pagadas y les añade el 'calculatedTotal'
        const paidComandasWithCalculatedTotal = comandas
            .filter(c => c.estado === 'pagado' && c.fechaPago)
            .map(comanda => ({
                ...comanda,
                calculatedTotal: calculateComandaTotal(comanda) 
            }));


        // 2. Filtra las comandas pagadas DEL MES ACTUAL para la mayoría de las métricas operativas
        const paidComandasThisMonth = paidComandasWithCalculatedTotal.filter(c => {
            const paymentDate = new Date(c.fechaPago);
            return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
        });

        // --- CALCULO DE MÉTRICAS GENERALES DEL MES ACTUAL ---
        const calculatedTotalSales = paidComandasThisMonth.reduce((sum, comanda) => sum + comanda.calculatedTotal, 0);
        const calculatedTotalPaidComandas = paidComandasThisMonth.length;
        const calculatedAverageTicket = calculatedTotalPaidComandas > 0 ? (calculatedTotalSales / calculatedTotalPaidComandas).toFixed(2) : 0;

        // --- VENTAS DIARIAS POR MÉTODO DE PAGO DEL MES ACTUAL ---
        const salesByDateAndMethod = {};
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate(); // Obtiene el último día del mes

        // Inicializa cada día del mes con 0 para cada método de pago
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(currentYear, currentMonth, i);
            const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            salesByDateAndMethod[formattedDate] = { efectivo: 0, tarjeta: 0, otros: 0, total: 0 };
        }

        paidComandasThisMonth.forEach(comanda => {
            const paymentDate = new Date(comanda.fechaPago);
            const formattedDate = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}-${String(paymentDate.getDate()).padStart(2, '0')}`;
            
            const totalComanda = comanda.calculatedTotal;
            const rawMetodoPago = (comanda.metodoPago || '').toLowerCase(); 

            let classifiedMetodoPago = 'otros'; // Por defecto, si no coincide

            if (rawMetodoPago.includes('efectivo')) {
                classifiedMetodoPago = 'efectivo';
            } else if (rawMetodoPago.includes('tarjeta') || rawMetodoPago.includes('credito') || rawMetodoPago.includes('debito') || rawMetodoPago.includes('card')) {
                classifiedMetodoPago = 'tarjeta';
            }

            if (salesByDateAndMethod[formattedDate]) {
                salesByDateAndMethod[formattedDate][classifiedMetodoPago] += totalComanda;
                salesByDateAndMethod[formattedDate].total += totalComanda;
            }
        });

        const calculatedDailySalesByPaymentMethodData = Object.keys(salesByDateAndMethod).sort().map(date => ({
            date: `${date.substring(8, 10)}/${date.substring(5, 7)}`, // Formato DD/MM
            efectivo: parseFloat(salesByDateAndMethod[date].efectivo.toFixed(2)),
            tarjeta: parseFloat(salesByDateAndMethod[date].tarjeta.toFixed(2)),
            otros: parseFloat(salesByDateAndMethod[date].otros.toFixed(2)),
            total: parseFloat(salesByDateAndMethod[date].total.toFixed(2))
        }));

        // --- UNIDADES VENDIDAS POR CATEGORÍA (MES ACTUAL) ---
        // (Esta métrica sigue basándose en la 'cantidad' de productos, no en su valor monetario)
        const categoryCounts = {};
        paidComandasThisMonth.forEach(comanda => { 
            comanda.productos && comanda.productos.forEach(comandaProduct => {
                const correspondingProduct = productsById[comandaProduct.productoId];
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

        // --- TOP 10 PRODUCTOS MÁS VENDIDOS (UNIDADES - MES ACTUAL) ---
        // Se mantiene el cálculo para el MES ACTUAL, coherente con el título del gráfico.
        // --- TOP 10 PRODUCTOS MÁS VENDIDOS (UNIDADES - MES ACTUAL) ---
      // Se mantiene el cálculo para el MES ACTUAL, coherente con el título del gráfico.
      const productSalesCounts = {};
      paidComandasThisMonth.forEach(comanda => { // <--- This is the key part!
          if (comanda.productos && Array.isArray(comanda.productos)) {
              comanda.productos.forEach(comandaProduct => {
                  const correspondingProduct = productsById[comandaProduct.productoId];
                  if (correspondingProduct) {
                      const productName = correspondingProduct.nombre;
                      const quantitySold = parseFloat(comandaProduct.cantidad) || 0;
                      productSalesCounts[productName] = (productSalesCounts[productName] || 0) + quantitySold;
                  }
              });
          }
      });
      const calculatedTopProductsData = Object.entries(productSalesCounts)
          .sort(([, countA], [, countB]) => countB - countA)
          .slice(0, 10)
          .map(([name, count]) => ({ name, count }));

        // --- DISTRIBUCIÓN DE MÉTODOS DE PAGO (Comandas del Mes Actual) ---
        // Esta métrica cuenta el NÚMERO de comandas por método de pago.
        // Si quisieras la distribución POR MONTO, deberías usar 'calculatedTotal' aquí.
        const paymentMethods = {};
        paidComandasThisMonth.forEach(comanda => {
            const method = comanda.metodoPago || 'Desconocido';
            paymentMethods[method] = (paymentMethods[method] || 0) + 1;
        });
        const calculatedPaymentMethodData = Object.entries(paymentMethods).map(([name, value]) => ({ name, value }));

        // --- VENTAS POR MESERO (MES ACTUAL - ahora usando `calculatedTotal`) ---
        const meseroSales = {};
        paidComandasThisMonth.forEach(comanda => {
            const meseroId = comanda.meseroId;
            if (meseroId) {
                meseroSales[meseroId] = (meseroSales[meseroId] || 0) + comanda.calculatedTotal;
            }
        });
        const calculatedMeseroSalesData = Object.entries(meseroSales).map(([meseroId, sales]) => {
            const mesero = users.find(user => user.id === meseroId);
            const meseroName = mesero ? (mesero.nombre || mesero.displayName || `Mesero ${meseroId}`) : `Mesero ${meseroId}`;
            return { name: meseroName, sales: parseFloat(sales.toFixed(2)) };
        });

        // --- HORAS PICO DE VENTA (Cantidad de Comandas - MES ACTUAL) ---
        // (Esta métrica sigue basándose en el NÚMERO de comandas)
        const salesByHour = {};
        for (let h = 0; h < 24; h++) {
            const hourKey = String(h).padStart(2, '0');
            salesByHour[hourKey] = 0;
        }

        paidComandasThisMonth.forEach(comanda => {
            if (comanda.fechaPago) {
                const paymentHour = new Date(comanda.fechaPago).getHours();
                const hourKey = String(paymentHour).padStart(2, '0');
                salesByHour[hourKey] = (salesByHour[hourKey] || 0) + 1;
            }
        });

        const calculatedPeakHoursData = Object.keys(salesByHour).sort().map(hour => ({
            hour: `${hour}:00`,
            comandas: salesByHour[hour]
        }));

        // --- VENTAS TOTALES POR MES (Histórico - últimos 12 meses, usando `calculatedTotal`) ---
        const monthlySales = {};
        const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

        // Inicializa para los últimos 12 meses para asegurar continuidad en el gráfico
        for (let i = 0; i < 12; i++) {
            let d = new Date();
            d.setMonth(now.getMonth() - i);
            const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            monthlySales[yearMonth] = 0;
        }

        paidComandasWithCalculatedTotal.forEach(comanda => { // Usa TODAS las comandas pagadas con total calculado
            const paymentDate = new Date(comanda.fechaPago);
            const yearMonth = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
            
            if (monthlySales.hasOwnProperty(yearMonth)) {
                monthlySales[yearMonth] = (monthlySales[yearMonth] || 0) + comanda.calculatedTotal;
            }
        });

        const calculatedMonthlySalesData = Object.keys(monthlySales)
            .sort() // Ordenar cronológicamente
            .map(ym => {
                const [year, monthNum] = ym.split('-');
                return {
                    month: `${monthNames[parseInt(monthNum, 10) - 1]} ${year.slice(-2)}`, // Ej: "Jun 25"
                    sales: parseFloat(monthlySales[ym].toFixed(2))
                };
            });

        // --- TICKET PROMEDIO POR MESERO (MES ACTUAL - usando `calculatedTotal`) ---
        const meseroComandaCounts = {};
        const meseroTotalSales = {};

        paidComandasThisMonth.forEach(comanda => {
            const meseroId = comanda.meseroId;
            const totalComanda = comanda.calculatedTotal;

            if (meseroId) {
                meseroComandaCounts[meseroId] = (meseroComandaCounts[meseroId] || 0) + 1;
                meseroTotalSales[meseroId] = (meseroTotalSales[meseroId] || 0) + totalComanda;
            }
        });

        const calculatedAverageTicketByMeseroData = Object.keys(meseroTotalSales).map(meseroId => {
            const mesero = users.find(user => user.id === meseroId);
            const meseroName = mesero ? (mesero.nombre || mesero.displayName || `Mesero ${meseroId}`) : `Mesero ${meseroId}`;
            const average = meseroComandaCounts[meseroId] > 0 ? (meseroTotalSales[meseroId] / meseroComandaCounts[meseroId]) : 0;
            return { name: meseroName, average: parseFloat(average.toFixed(2)) };
        }).sort((a, b) => b.average - a.average); // Ordenar por ticket promedio descendente


        // Devolver todos los datos calculados
        return {
            totalSales: calculatedTotalSales,
            totalPaidComandas: calculatedTotalPaidComandas,
            averageTicket: calculatedAverageTicket,
            dailySalesByPaymentMethodData: calculatedDailySalesByPaymentMethodData,
            categoryOrderData: calculatedCategoryOrderData,
            topProductsData: calculatedTopProductsData,
            paymentMethodData: calculatedPaymentMethodData,
            meseroSalesData: calculatedMeseroSalesData,
            peakHoursData: calculatedPeakHoursData,
            monthlySalesData: calculatedMonthlySalesData,
            averageTicketByMeseroData: calculatedAverageTicketByMeseroData,
        };
    }, [isLoading, comandas, productos, users, categorias]); // Dependencias del useMemo

    // --- ESTADO DE CARGA ---
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

    // --- ESTADO SIN DATOS ---
    if (comandas.length === 0 && productos.length === 0) {
        return (
            <div className={styles.dashboardContainer}>
                <h2 className={styles.mainTitle}>Dashboard de Estadísticas</h2>
                <p className={styles.noDataMessage}>No hay datos disponibles para generar estadísticas. Asegúrate de tener comandas y productos cargados.</p>
            </div>
        );
    }

    // --- RENDERIZADO DEL DASHBOARD ---
    return (
        <div className={styles.dashboardContainer}>
            <h2 className={styles.mainTitle}>Dashboard de Estadísticas del Restaurante</h2>
            
            {/* Sección de Resumen General */}
            {/* Este componente ya incluye la lógica de selección de mes y muestra estadísticas dinámicas */}
            <EstadisticasGeneralesGerente />
            
            <hr className={styles.divider} />

            {/* Gráfico: Ventas Diarias por Método de Pago (Mes Actual) */}
            <DailySalesByPaymentMethodChart dailySalesData={dailySalesByPaymentMethodData} />

            <hr className={styles.divider} />

            {/* Gráfico: Ventas Diarias Totales del Mes Actual (usando el mismo data de ventas diarias pero solo el total) */}
            <div className={styles.chartSection}>
                <h3 className={styles.sectionTitle}>Ventas Diarias Totales del Mes Actual</h3>
                {dailySalesByPaymentMethodData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={dailySalesByPaymentMethodData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" className={styles.gridStroke} />
                            <XAxis dataKey="date" className={styles.axisText} />
                            <YAxis className={styles.axisText} tickFormatter={(value) => `$${value.toFixed(2)}`} />
                            <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                            <Legend />
                            <Bar dataKey="total" fill="#8884d8" name="Ventas Totales" />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <p className={styles.noChartData}>No hay datos de ventas diarias para el mes actual para mostrar este gráfico.</p>
                )}
            </div>

            <hr className={styles.divider} />

            {/* Gráfico: Visión General de Ventas Mensuales (Histórico) */}
            <MonthlySalesOverviewChart monthlySalesData={monthlySalesData} />

            <hr className={styles.divider} />

            {/* Gráfico: Top 10 Productos Más Vendidos (Unidades - Mes Actual) */}
            <div className={styles.chartSection}>
              <h3 className={styles.sectionTitle}>Top 10 Productos Más Vendidos (Unidades - Mes Actual)</h3>
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
                  <p className={styles.noChartData}>No hay datos de Top 10 productos para mostrar este gráfico en el mes actual.</p>
              )}
            </div>

            <hr className={styles.divider} />

            {/* Gráfico: Distribución de Métodos de Pago (Comandas del Mes Actual) */}
            <div className={styles.chartSection}>
                <h3 className={styles.sectionTitle}>Distribución de Métodos de Pago (Comandas del Mes Actual)</h3>
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

            {/* Gráfico: Ventas por Mesero (Mes Actual) */}
            <div className={styles.chartSection}>
                <h3 className={styles.sectionTitle}>Ventas Generadas por Mesero (Mes Actual)</h3>
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

            <hr className={styles.divider} />

            {/* Gráfico: Ticket Promedio por Mesero (Mes Actual) */}
            <AverageOrderValueByMeseroChart averageTicketByMeseroData={averageTicketByMeseroData} />

            <hr className={styles.divider} />

            {/* Gráfico: Horas Pico de Venta (Mes Actual) */}
            <PeakHoursChart peakHoursData={peakHoursData} />
            
        </div>
    );
};

export default DashboardStats;