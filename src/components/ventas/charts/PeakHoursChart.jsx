import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import styles from '../../../css/DashboardStats.module.css';

const PeakHoursChart = ({ peakHoursData }) => {
    if (!peakHoursData || peakHoursData.length === 0) {
        return (
            <p className={styles.noChartData}>
                No hay datos de horas pico de venta para mostrar este gráfico.
            </p>
        );
    }

    return (
        <div className={styles.chartSection}>
            <h3 className={styles.sectionTitle}>Comandas Pagadas por Hora del Día (Mes Actual)</h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={peakHoursData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className={styles.gridStroke} />
                    <XAxis dataKey="hour" className={styles.axisText} />
                    <YAxis className={styles.axisText} label={{ value: 'Comandas', angle: -90, position: 'insideLeft', fill: '#666' }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="comandas" stroke="#FF5733" name="Número de Comandas" activeDot={{ r: 8 }} strokeWidth={2} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PeakHoursChart;