// src/components/estadisticas/EstadisticasGeneralesGerente.js
import React, { useMemo, useState } from "react";
import { useComandas } from "../../hooks/useComandas";
import { useProductos } from "../../hooks/useProductos";
import { useUsers } from "../../hooks/useUsers";
import styles from '../../css/EstadisticasGeneralesGerente.module.css';
import '../../App.css'; // Importa App.css para las clases globales de spinner y skeleton

// Importaciones de Chart.js
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Registrar los componentes necesarios de Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
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

const getMonthYear = (date) => {
    let d;
    if (!date) {
        console.warn("getMonthYear: Fecha de comanda es null o undefined:", date);
        return 'Sin Fecha';
    }
    if (date instanceof Date) {
        d = date;
    } else if (typeof date.toDate === 'function') {
        d = date.toDate();
    } else if (typeof date === 'string' || typeof date === 'number') {
        d = new Date(date);
    } else {
        console.warn("getMonthYear: Tipo de fecha inesperado:", typeof date, date);
        return 'Sin Fecha';
    }
    if (isNaN(d.getTime())) {
        console.error("getMonthYear: Objeto Date resultante es inválido para el valor:", date);
        return 'Sin Fecha';
    }
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
};

const formatMonthLabel = (monthYear) => {
    if (monthYear === 'all') return 'Todas las Fechas';
    const [year, month] = monthYear.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(date);
};


export default function EstadisticasGeneralesGerente() {
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

    const [selectedMonthYear, setSelectedMonthYear] = useState('all');

    const { monthlyStats, availableMonths, allTimeStats, monthlySalesChartData } = useMemo(() => {
        if (isLoading) {
            // Si está cargando, devolvemos un estado inicial vacío para evitar errores
            return { monthlyStats: {}, availableMonths: [], allTimeStats: null, monthlySalesChartData: null };
        }

        const statsByMonth = {};
        const uniqueMonths = new Set();
        
        const currentAllTimeStats = {
            totalVentas: 0,
            totalComandas: 0,
            totalProductosVendidos: 0,
            productosVendidosCount: {},
        };

        allComandas.forEach(comanda => {
            const monthYear = getMonthYear(comanda.fechaPago); 
            if (monthYear === 'Sin Fecha') {
                return;
            }
            uniqueMonths.add(monthYear);

            if (!statsByMonth[monthYear]) {
                statsByMonth[monthYear] = {
                    totalVentas: 0,
                    totalComandas: 0,
                    totalProductosVendidos: 0,
                    productosVendidosCount: {},
                };
            }

            const comandaTotal = comanda.productos.reduce((sum, prod) => {
                const productoInfo = allProductos.find(p => p.id === prod.productoId);
                if (productoInfo) {
                    const precio = parseFloat(productoInfo.precio) || 0;
                    const cantidad = parseFloat(prod.cantidad) || 0;
                    
                    statsByMonth[monthYear].totalProductosVendidos += cantidad;
                    const currentMonthProductCount = statsByMonth[monthYear].productosVendidosCount[productoInfo.nombre] || 0;
                    statsByMonth[monthYear].productosVendidosCount[productoInfo.nombre] = currentMonthProductCount + cantidad;

                    currentAllTimeStats.totalProductosVendidos += cantidad;
                    const currentAllTimeProductCount = currentAllTimeStats.productosVendidosCount[productoInfo.nombre] || 0;
                    currentAllTimeStats.productosVendidosCount[productoInfo.nombre] = currentAllTimeProductCount + cantidad;

                    return sum + (precio * cantidad);
                }
                return sum;
            }, 0);

            statsByMonth[monthYear].totalComandas++;
            statsByMonth[monthYear].totalVentas += comandaTotal;

            currentAllTimeStats.totalComandas++;
            currentAllTimeStats.totalVentas += comandaTotal;
        });

        Object.keys(statsByMonth).forEach(monthYear => {
            const monthStats = statsByMonth[monthYear];
            monthStats.valorPromedioPorComanda = monthStats.totalComandas > 0 ? monthStats.totalVentas / monthStats.totalComandas : 0;
            
            let topSellingProduct = { nombre: 'N/A', cantidad: 0 };
            if (Object.keys(monthStats.productosVendidosCount).length > 0) {
                const sortedProducts = Object.entries(monthStats.productosVendidosCount)
                    .sort(([, qtyA], [, qtyB]) => qtyB - qtyA);
                topSellingProduct = { nombre: sortedProducts[0][0], cantidad: sortedProducts[0][1] };
            }
            monthStats.topSellingProduct = topSellingProduct;
            delete monthStats.productosVendidosCount;
        });

        currentAllTimeStats.valorPromedioPorComanda = currentAllTimeStats.totalComandas > 0 ? currentAllTimeStats.totalVentas / currentAllTimeStats.totalComandas : 0;
        let allTimeTopSellingProduct = { nombre: 'N/A', cantidad: 0 };
        if (Object.keys(currentAllTimeStats.productosVendidosCount).length > 0) {
            const sortedProducts = Object.entries(currentAllTimeStats.productosVendidosCount)
                .sort(([, qtyA], [, qtyB]) => qtyB - qtyA);
            allTimeTopSellingProduct = { nombre: sortedProducts[0][0], cantidad: sortedProducts[0][1] };
        }
        currentAllTimeStats.topSellingProduct = allTimeTopSellingProduct;
        delete currentAllTimeStats.productosVendidosCount;

        const sortedMonths = Array.from(uniqueMonths).sort();

        const totalMeseros = allUsers.filter(user => user.role === 'mesero').length;
        currentAllTimeStats.totalMeseros = totalMeseros;

        // --- Preparar datos para el gráfico de ventas mensuales ---
        const chartLabels = [];
        const chartSalesData = [];

        sortedMonths.forEach(monthYear => {
            chartLabels.push(formatMonthLabel(monthYear)); 
            chartSalesData.push(statsByMonth[monthYear]?.totalVentas || 0);
        });

        const primaryColorRgba = 'rgba(0, 123, 255, 0.7)'; // Corresponde a --color-primary
        const primaryColorSolid = '#007bff'; // Corresponde a --color-primary

        const monthlySalesChartData = {
            labels: chartLabels,
            datasets: [
                {
                    label: 'Ventas Mensuales',
                    data: chartSalesData,
                    backgroundColor: primaryColorRgba, 
                    borderColor: primaryColorSolid,
                    borderWidth: 1,
                },
            ],
        };
        // -----------------------------------------------------------

        return { 
            monthlyStats: statsByMonth, 
            availableMonths: sortedMonths, 
            allTimeStats: currentAllTimeStats,
            monthlySalesChartData 
        };
    }, [isLoading, allComandas, allProductos, allUsers]);

    const currentStats = useMemo(() => {
        if (selectedMonthYear === 'all') {
            return allTimeStats;
        }
        return monthlyStats[selectedMonthYear] || null;
    }, [selectedMonthYear, monthlyStats, allTimeStats]);

    // Opciones para el gráfico de barras
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false, 
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: 'var(--color-text-medium, #555)',
                }
            },
            title: {
                display: true,
                text: 'Ventas Totales por Mes',
                color: 'var(--color-text-dark, #333)',
                font: {
                    size: 18,
                    weight: 'bold',
                },
                // La propiedad 'border' no es válida directamente aquí en Chart.js, es un estilo CSS.
                // Si deseas un borde en el título del gráfico, deberías aplicarlo al contenedor div que lo envuelve
                // o usar una propiedad de Chart.js si existe una equivalente para el borde del texto.
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += formatCurrency(context.parsed.y);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: 'var(--color-text-light, #666)'
                }
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0,0,0,0.05)'
                },
                ticks: {
                    callback: function(value) {
                        return formatCurrency(value);
                    },
                    color: 'var(--color-text-light, #666)'
                }
            }
        }
    };

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <div className="spinner"></div> {/* Usa la clase global .spinner */}
                <p className={styles.loadingText}>Cargando estadísticas generales...</p>
                
                {/* Esqueletos para las tarjetas de estadísticas */}
                <div className={styles.statsGrid}> {/* Asegúrate de que este estilo tenga display: grid para que los esqueletos se alineen */}
                    {[...Array(5)].map((_, index) => ( // 5 tarjetas de esqueleto
                        <div key={index} className={`${styles.statCard} loading-skeleton`}>
                            <div className="skeleton-line" style={{ width: '70%', height: '1.2em', marginBottom: '10px' }}></div>
                            <div className="skeleton-line" style={{ width: '50%', height: '2em' }}></div>
                        </div>
                    ))}
                </div>

                {/* Esqueleto para el gráfico */}
                <div className={`${styles.chartContainer} loading-skeleton`} style={{
                    minHeight: '300px', // Altura del esqueleto del gráfico
                    width: '100%',
                    marginTop: '20px',
                    borderRadius: '8px' // Añade un borde redondeado al esqueleto del gráfico
                }}>
                    <div className="skeleton-line" style={{ width: '90%', height: '1.5em', margin: '15px auto' }}></div> {/* Título del gráfico */}
                    <div className="skeleton-line" style={{ width: '80%', height: '180px', margin: '20px auto' }}></div> {/* Área del gráfico */}
                    <div className="skeleton-line" style={{ width: '60%', height: '1em', margin: '10px auto' }}></div> {/* Leyenda/Ejes */}
                </div>
            </div>
        );
    }

    if (allComandas.length === 0 && allUsers.length === 0 && allProductos.length === 0) {
        return (
            <section className={styles.container}>
                <h3 className={styles.title}>Estadísticas Generales</h3>
                <p className={styles.noData}>No hay datos disponibles para generar estadísticas.</p>
            </section>
        );
    }

    return (
        <section className={styles.container}>
            <h3 className={styles.title}>Estadísticas Generales</h3>

            <div className={styles.monthSelectorContainer}>
                <label htmlFor="month-select" className={styles.monthLabel}>Seleccionar Período:</label>
                <select
                    id="month-select"
                    className={styles.monthSelect}
                    value={selectedMonthYear}
                    onChange={(e) => setSelectedMonthYear(e.target.value)}
                >
                    <option value="all">{formatMonthLabel('all')}</option>
                    {availableMonths.map(month => (
                        <option key={month} value={month}>
                            {formatMonthLabel(month)}
                        </option>
                    ))}
                </select>
            </div>

            {currentStats ? (
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <h4 className={styles.cardTitle}>Ventas Totales</h4>
                        <p className={styles.cardValue}>{formatCurrency(currentStats.totalVentas)}</p>
                    </div>

                    <div className={styles.statCard}>
                        <h4 className={styles.cardTitle}>Total Comandas</h4>
                        <p className={styles.cardValue}>{currentStats.totalComandas}</p>
                    </div>

                    <div className={styles.statCard}>
                        <h4 className={styles.cardTitle}>Valor Promedio por Comanda</h4>
                        <p className={styles.cardValue}>{formatCurrency(currentStats.valorPromedioPorComanda)}</p>
                    </div>

                    <div className={styles.statCard}>
                        <h4 className={styles.cardTitle}>Productos Vendidos (unidades)</h4>
                        <p className={styles.cardValue}>{currentStats.totalProductosVendidos}</p>
                    </div>
                    
                    <div className={styles.statCard}>
                        <h4 className={styles.cardTitle}>Producto Más Vendido</h4>
                        <p className={styles.cardValue}>
                            {currentStats.topSellingProduct.nombre} 
                            {currentStats.topSellingProduct.cantidad > 0 && 
                                <span className={styles.cardSubValue}> ({currentStats.topSellingProduct.cantidad} unid.)</span>
                            }
                        </p>
                    </div>
                </div>
            ) : (
                <p className={styles.noData}>No hay datos de comandas para el período seleccionado.</p>
            )}

            {monthlySalesChartData && monthlySalesChartData.labels.length > 0 && (
                <div className={styles.chartContainer}>
                    <Bar options={chartOptions} data={monthlySalesChartData} />
                </div>
            )}
            {monthlySalesChartData && monthlySalesChartData.labels.length === 0 && !isLoading && (
                <p className={styles.noData}>No hay datos de ventas para mostrar en el gráfico.</p>
            )}
        </section>
    );
}