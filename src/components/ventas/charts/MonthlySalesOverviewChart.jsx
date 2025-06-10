import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import styles from '../../../css/DashboardStats.module.css'; // Reutilizamos los estilos

const MonthlySalesOverviewChart = ({ monthlySalesData }) => {
    if (!monthlySalesData || monthlySalesData.length === 0) {
        return (
            <p className={styles.noChartData}>
                No hay datos históricos de ventas mensuales para mostrar este gráfico.
            </p>
        );
    }

    return (
        <div className={styles.chartSection}>
            <h3 className={styles.sectionTitle}>Ventas Totales por Mes</h3>
            <ResponsiveContainer width="100%" height={350}>
                <LineChart data={monthlySalesData} margin={{ top: 15, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className={styles.gridStroke} />
                    <XAxis dataKey="month" className={styles.axisText} />
                    <YAxis className={styles.axisText} tickFormatter={(value) => `$${value.toFixed(2)}`} />
                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                    <Legend />
                    <Line type="monotone" dataKey="sales" stroke="#82ca9d" name="Ventas Totales" activeDot={{ r: 8 }} strokeWidth={2} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default MonthlySalesOverviewChart;