import React from 'react';
import styles from '../../css/CocinaComandasView.module.css';
import { useComandas , actualizarComanda } from '../../hooks/useComandas';
// import { FaUtensils, FaCheckCircle, FaSpinner, FaTimesCircle, FaSyncAlt, FaClipboardList, FaTable, FaInfoCircle } from 'react-icons/fa'; // Mantén si usas React Icons

/**
 * Componente para que los usuarios con rol de cocinero
 * vean y gestionen las comandas en estado "cocina" usando Firebase.
 */
const CocinaComandasView = () => {
    // Usamos tu hook useComandas para obtener las comandas en tiempo real desde Firebase
    const allComandas = useComandas();
    const [loading, setLoading] = React.useState(true); // Controlar el estado de carga inicial
    const [error, setError] = React.useState(null);     // Controlar errores (aunque useComandas ya maneja el vacío)

    // Filtramos las comandas para mostrar solo las que están en estado "cocina"
    const kitchenOrders = React.useMemo(() => {
        // Asumiendo que `allComandas` ya viene cargada o vacía.
        // Simulamos un breve tiempo de carga para la primera renderización
        // antes de que useComandas traiga los datos.
        if (allComandas.length > 0 || !loading) { // Una vez que hay datos o ya no está cargando
            setLoading(false);
        }
        return allComandas.filter(comanda => comanda.estado === 'Cocina');
    }, [allComandas, loading]);

    // Pequeño useEffect para simular que al inicio hay una carga
    // y que el `useComandas` está en proceso de obtener los datos.
    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (allComandas.length === 0) { // Si no hay datos después de un tiempo, y no hay error, asume que está vacío
                setLoading(false);
            }
        }, 500); // Pequeño retraso para que el spinner se vea si los datos cargan muy rápido
        return () => clearTimeout(timer);
    }, [allComandas]);

    /**
     * Función para actualizar el estado de una comanda en Firebase.
     * @param {string} orderId - El ID de la comanda a actualizar (generado por Firebase).
     * @param {string} newStatus - El nuevo estado (ej. 'Listo_para_servir', 'cancelado').
     */
    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            // Usamos tu función `actualizarComanda` de Firebase
            await actualizarComanda(orderId, { estado: newStatus });
            // La UI se actualizará automáticamente gracias a `useComandas`
            alert(`Comanda #${orderId} actualizada a: ${newStatus.replace('_', ' ')}`);
        } catch (err) {
            console.error(`Error al actualizar la comanda ${orderId} a ${newStatus}:`, err);
            alert(`Error al actualizar el estado de la comanda #${orderId}.`);
        }
    };

    // --- Renderizado Condicional de Estados ---
    if (loading && allComandas.length === 0) {
        return (
            <div className={styles.loadingState}>
                <div className={styles.spinner}></div>
                <p className={styles.loadingText}>Cargando comandas en cocina...</p>
            </div>
        );
    }

    if (error) { // Este error se manejaría si la suscripción a Firebase fallara, lo cual es menos común
        return (
            <div className={styles.errorState}>
                <p>{error}</p>
                {/* No hay botón de reintentar si el error viene de la suscripción, se auto-recupera */}
            </div>
        );
    }

    return (
        <div className={styles.kitchenOrdersContainer}>
            <h1 className={styles.mainTitle}>Comandas en Cocina</h1>
            <p className={styles.subtitle}>Aquí puedes ver y gestionar las comandas pendientes de preparación.</p>

            {kitchenOrders.length === 0 ? (
                <div className={styles.noOrdersMessage}>
                    <p>¡No hay comandas en la cocina en este momento! ¡Es hora de un descanso!</p>
                    {/* El botón de refrescar aquí solo causaría un re-render sin forzar una nueva carga desde Firebase
                        ya que `useComandas` ya es en tiempo real. Podrías quitarlo o usarlo para refetch manual
                        si `useComandas` tuviera una función de refetch explícita.
                        Por ahora, lo mantengo solo para que el usuario sepa que puede "revisar" de nuevo.
                    */}
                    <button className={styles.refreshButton} onClick={() => {
                        // Forzar una pequeña re-renderización para actualizar
                        setLoading(true); // Opcional: Para mostrar el spinner brevemente
                        setTimeout(() => setLoading(false), 200);
                        // El `useComandas` ya se encarga de la reactividad.
                    }}>
                        {/* <FaSyncAlt /> */} Actualizar Vista
                    </button>
                </div>
            ) : (
                <div className={styles.ordersGrid}>
                    {kitchenOrders.map(order => (
                        <div key={order.id} className={styles.orderCard}>
                            <div className={styles.orderHeader}>
                                <h3 className={styles.orderId}>
                                    {/* <FaClipboardList /> */} Comanda #{order.id.substring(0, 5)}... {/* Muestra un ID corto */}
                                </h3>
                                <span className={styles.tableNumber}>
                                    {/* <FaTable /> */} Mesa: {order.nombre || 'N/A'} {/* `nombre` se usa para la mesa en tu hook */}
                                </span>
                            </div>
                            <div className={styles.orderItems}>
                                <h4>Platos:</h4>
                                <ul>
                                    {order.productos && order.productos.map((item, index) => (
                                        <li key={index} className={styles.orderItem}>
                                            <span>{item.cantidad}x {item.nombre}</span>
                                            {item.notas && <span className={styles.itemNotes}>{/* <FaInfoCircle /> */} ({item.notas})</span>}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            {order.notasComanda && ( // Si tienes un campo de notas generales para la comanda
                                <div className={styles.orderNotes}>
                                    <p>Notas de la comanda:</p>
                                    <p className={styles.noteText}>{order.notasComanda}</p>
                                </div>
                            )}
                            <div className={styles.orderFooter}>
                                <span className={styles.timeReceived}>Recibida: {new Date(order.fechaCreacion || Date.now()).toLocaleTimeString()}</span>
                                <div className={styles.actionButtons}>
                                    <button
                                        className={`${styles.actionButton} ${styles.readyButton}`}
                                        onClick={() => updateOrderStatus(order.id, 'Listo_para_servir')}
                                    >
                                        {/* <FaCheckCircle /> */} Listo para Servir
                                    </button>
                                    <button
                                        className={`${styles.actionButton} ${styles.cancelButton}`}
                                        onClick={() => updateOrderStatus(order.id, 'cancelado')}
                                    >
                                        {/* <FaTimesCircle /> */} Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CocinaComandasView;