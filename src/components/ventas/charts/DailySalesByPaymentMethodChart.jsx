// src/components/charts/DailySalesByPaymentMethodChart.jsx

import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import styles from '../../../css/DashboardStats.module.css'; // Reutilizamos los estilos generales

const DailySalesByPaymentMethodChart = ({ dailySalesData }) => {
    if (!dailySalesData || dailySalesData.length === 0) {
        return (
            <p className={styles.noChartData}>
                No hay datos de ventas diarias por método de pago para el mes actual para mostrar este gráfico.
            </p>
        );
    }

    return (
        <div className={styles.chartSection}>
            <h3 className={styles.sectionTitle}>Ventas Diarias por Método de Pago del Mes Actual</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailySalesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className={styles.gridStroke} />
                    <XAxis dataKey="date" className={styles.axisText} />
                    <YAxis className={styles.axisText} tickFormatter={(value) => `$${value.toFixed(2)}`} />
                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} /> {/* El Tooltip ya maneja el nombre de la key */}
                    <Legend />
                    <Bar dataKey="efectivo" stackId="a" fill="#00C49F" name="Ventas en Efectivo" /> {/* Verde */}
                    <Bar dataKey="tarjeta" stackId="a" fill="#0088FE" name="Ventas con Tarjeta" /> {/* Azul */}
                    <Bar dataKey="otros" stackId="a" fill="#FF8042" name="Otros Métodos" /> {/* Naranja para otros */}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default DailySalesByPaymentMethodChart;