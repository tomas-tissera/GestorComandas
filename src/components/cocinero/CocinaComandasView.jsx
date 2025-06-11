import React from 'react';
import styles from '../../css/CocinaComandasView.module.css';
import { useComandas, actualizarComanda } from '../../hooks/useComandas';
import { useUsers } from '../../hooks/useUsers';
import { ToastContainer, toast } from 'react-toastify'; // Import toastify components
import 'react-toastify/dist/ReactToastify.css'; // Import toastify CSS

const CocinaComandasView = () => {
    const allComandas = useComandas();
    const users = useUsers();
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    // Mapeo de usuarios para mostrar nombre completo
    const userMap = React.useMemo(() => {
        if (!users) return new Map();
        return new Map(users.map(user => [user.id, `${user.nombre || ''} ${user.apellido || ''}`.trim()]));
    }, [users]);

    // Filtrar comandas por estado "Cocina"
    const kitchenOrders = React.useMemo(() => {
        if (allComandas.length > 0 || !loading) setLoading(false);
        return allComandas.filter(c => c.estado === 'Cocina');
    }, [allComandas, loading]);

    // Simulación de carga inicial
    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (allComandas.length === 0) setLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [allComandas]);

    const updateOrderStatus = async (id, estado) => {
        try {
            await actualizarComanda(id, { estado });
            // Reemplazado alert() con toast.success()
            toast.success(`¡Comanda #${id} actualizada a: ${estado.replace('_', ' ')}!`, {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        } catch (err) {
            console.error(`Error al actualizar comanda ${id}:`, err);
            // Reemplazado alert() con toast.error()
            toast.error(`Error al actualizar el estado de la comanda #${id}.`, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            setError(`Error al actualizar el estado de la comanda #${id}`); // Keep error state for main display if needed
        }
    };

    // Estado de carga
    if (loading && allComandas.length === 0) {
        return (
            <div className={styles.loadingState}>
                <div className={styles.spinner}></div>
                <p className={styles.loadingText}>Cargando comandas en cocina...</p>
            </div>
        );
    }

    // Error
    if (error) {
        return (
            <div className={styles.errorState}>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className={styles.kitchenOrdersContainer}>
            {/* Agrega ToastContainer en la raíz de tu componente */}
            <ToastContainer /> 

            <div className={styles.mainTitleCont}>
                <h1 className={styles.mainTitle}>Comandas en Cocina</h1>
                <p className={styles.subtitle}>Aquí puedes ver y gestionar las comandas pendientes de preparación.</p>
            </div>

            {kitchenOrders.length === 0 ? (
                <div className={styles.noOrdersMessage}>
                    <p>¡No hay comandas en la cocina en este momento! ¡Es hora de un descanso!</p>
                    <button className={styles.refreshButton} onClick={() => {
                        setLoading(true);
                        setTimeout(() => setLoading(false), 200);
                    }}>
                        Actualizar Vista
                    </button>
                </div>
            ) : (
                <div className={styles.ordersGrid}>
                    {kitchenOrders.map(order => (
                        <div key={order.id} className={styles.orderCard}>
                            <div className={styles.orderHeader}>
                                <h3 className={styles.tableNumber}>{order.nombre || 'N/A'}</h3>
                            </div>
                            <div className={styles.meseroNombreHread}>
                                <span className={styles.meseroNombre}>{userMap.get(order.meseroId) || 'Mesero desconocido'}</span>
                            </div>

                            <div className={styles.orderItems}>
                                <h4>Platos:</h4>
                                <ul>
                                    {order.productos?.map((item, i) => (
                                        <li key={i} className={styles.orderItem}>
                                            <div>
                                                <span>{item.cantidad}x {item.nombre}</span>
                                            </div>
                                            {item.aclaracion && <span>Aclaración: {item.aclaracion}</span>}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {order.notasComanda && (
                                <div className={styles.orderNotes}>
                                    <p>Notas de la comanda:</p>
                                    <p className={styles.noteText}>{order.notasComanda}</p>
                                </div>
                            )}

                            <div className={styles.orderFooter}>
                                <span className={styles.timeReceived}>
                                    Recibida en Cocina: {new Date(order.hsCocina || order.fechaCreacion || Date.now()).toLocaleTimeString()}
                                </span>
                                <div className={styles.actionButtons}>
                                    <button className={`${styles.actionButton} ${styles.readyButton}`} onClick={() => updateOrderStatus(order.id, 'Listo_para_servir')}>
                                        Listo para Servir
                                    </button>
                                    <button className={`${styles.actionButton} ${styles.cancelButton}`} onClick={() => updateOrderStatus(order.id, 'cancelado')}>
                                        Cancelar
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