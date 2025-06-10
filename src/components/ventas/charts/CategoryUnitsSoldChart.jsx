import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList
} from 'recharts';
import styles from '../../../css/DashboardStats.module.css';

// Agregamos monthName y year como props para el título dinámico
const CategoryUnitsSoldChart = ({ categoryOrderData, monthName, year }) => {
    // Asegurarse de que los datos tengan la estructura esperada:
    // [{ name: 'Bebidas', unitsSold: 150 }] // Cambiamos 'orders' a 'unitsSold'

    if (!categoryOrderData || categoryOrderData.length === 0) {
        return (
            <p className={styles.noChartData}>
                No hay datos de unidades vendidas por categoría para mostrar este gráfico en {monthName} {year}.
            </p>
        );
    }

    return (
        <div className={styles.chartSection}>
            {/* Título dinámico */}
            <h3 className={styles.sectionTitle}>Unidades Vendidas por Categoría ({monthName} {year})</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryOrderData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className={styles.gridStroke} />
                    <XAxis dataKey="name" className={styles.axisText} interval={0} angle={-30} textAnchor="end" height={60} />
                    <YAxis className={styles.axisText} />
                    <Tooltip />
                    <Legend />
                    {/* Cambiamos dataKey de "orders" a "unitsSold" y el nombre de la leyenda */}
                    <Bar dataKey="unitsSold" fill="#00C49F" name="Unidades Vendidas">
                        {/* Cambiamos dataKey de "orders" a "unitsSold" para la etiqueta */}
                        <LabelList dataKey="unitsSold" position="insideTop" className={styles.labelText} />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default CategoryUnitsSoldChart;