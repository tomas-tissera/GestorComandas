import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList
} from 'recharts';
import styles from '../../../css/DashboardStats.module.css'; // Reutilizamos los estilos

const AverageOrderValueByMeseroChart = ({ averageTicketByMeseroData }) => {
    if (!averageTicketByMeseroData || averageTicketByMeseroData.length === 0) {
        return (
            <p className={styles.noChartData}>
                No hay datos de ticket promedio por mesero para mostrar este gráfico.
            </p>
        );
    }

    return (
        <div className={styles.chartSection}>
            <h3 className={styles.sectionTitle}>Ticket Promedio por Mesero</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={averageTicketByMeseroData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className={styles.gridStroke} />
                    <XAxis dataKey="name" className={styles.axisText} />
                    <YAxis className={styles.axisText} tickFormatter={(value) => `$${value.toFixed(2)}`} />
                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                    <Legend />
                    <Bar dataKey="average" fill="#AF19FF" name="Ticket Promedio">
                       <LabelList dataKey="average" position="insideTop" formatter={(value) => `$${value.toFixed(2)}`} className={styles.labelText} />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default AverageOrderValueByMeseroChart;