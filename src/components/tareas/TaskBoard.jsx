import React, { useState, useCallback, useEffect } from "react";
import { DndContext, useDraggable, useDroppable, closestCenter } from "@dnd-kit/core";
import { FaEdit, FaTrash } from "react-icons/fa";
import { MdDeliveryDining } from "react-icons/md"; // Import the new icon
import ModalAddTask from "./ModalAddTask";
import styles from "./TaskBoard.module.css";
import Swal from "sweetalert2";
import { ref, push } from "firebase/database";
import { database } from "../../firebase";
import { useAuth } from "../../components/AuthProvider";

// Import your Firebase hooks and functions
import { useComandas, guardarComanda, eliminarComanda, actualizarComanda } from "../../hooks/useComandas";
import { useProductos } from "../../hooks/useProductos";
import ModalPago from "./ModalPago";
import HistorialComandas from "./HistorialComandas";
import { IoMdPrint } from "react-icons/io";
import { IoCardOutline } from "react-icons/io5";

// --- MODIFICACIÓN 1: Nombres de las columnas ---
// Añadimos "Entregado" como un nuevo estado posterior.
const COLUMNS = ["Sala", "Cocina", "Listo_para_servir", "Entregado"]; // Added 'Entregado'

// Helper function to get product name by ID
function getProductNameById(id, productosDisponibles) {
    const p = productosDisponibles.find((prod) => prod.id === id);
    return p?.nombre || "Desconocido";
}

// Draggable Item Component (memoized for performance)
const DraggableItem = React.memo(({ task, productosDisponibles, isListoParaServir }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: task.id });

    const style = {
        transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
        cursor: "grab",
    };

    return (
        // --- MODIFICACIÓN 3: Clase para resaltar "Listo para Servir" ---
        <div ref={setNodeRef} style={style}
             className={`${styles.boardItem} ${isListoParaServir ? styles.readyToServeItem : ''}`}
             {...listeners} {...attributes}>
            <strong>{task.nombre}</strong>
            <ul>
                {task.productos.map((prod, index) => (
                    <li key={index}>
                        {prod.cantidad} x {getProductNameById(prod.productoId, productosDisponibles)}
                        {prod.aclaracion && (
                            <div className={styles.aclaracion}>
                                Aclaración: {prod.aclaracion}
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
});

// Droppable Column Component (memoized for performance)
const DroppableColumn = React.memo(({ id, children, isLoading }) => {
  const { setNodeRef } = useDroppable({ id });
    let columnTitle = id;
    if (id === "Listo_para_servir") {
        columnTitle = "Listo para Servir";
    } else if (id === "Entregado") { // New display name for 'Entregado'
        columnTitle = "Entregado";
    }
    return (
        <div ref={setNodeRef} className={styles.column}>
            <h3>{columnTitle}</h3>
            {isLoading ? (
                <div className={styles.loadingIndicator}>
                    Cargando comandas...
                    <div className={styles.spinner}></div>
                </div>
            ) : (
                children
            )}
        </div>
    );
});

// Main TaskBoard Component
export default function TaskBoard() {
    const [showModal, setShowModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showPagoModal, setShowPagoModal] = useState(false);
    const [taskToPagar, setTaskToPagar] = useState(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [isLoadingComandas, setIsLoadingComandas] = useState(true);

    const comandas = useComandas(); // Todas las comandas activas
    const productosDisponibles = useProductos();
    const { currentUser } = useAuth(); // Para obtener el rol del usuario

    const [activeComandas, setActiveComandas] = useState({
        Sala: [],
        Cocina: [],
        Listo_para_servir: [],
        Entregado: [], // Initialize the new column
    });

    useEffect(() => {
        if (comandas !== null) {
            setIsLoadingComandas(false);
            const newActiveComandas = {};

            // Initialize all columns from the COLUMNS array to empty arrays
            COLUMNS.forEach(column => {
                newActiveComandas[column] = [];
            });

            comandas.forEach((comanda) => {
                if (comanda.estado !== "pagado") {
                    const estadoValido = COLUMNS.includes(comanda.estado) ? comanda.estado : "Sala";
                    newActiveComandas[estadoValido].push(comanda);
                }
            });
            setActiveComandas(newActiveComandas);
        }
    }, [comandas]);


    const handleAddTask = useCallback(async (newTask) => {
        if (isSaving) return;
        setIsSaving(true);

        try {
            newTask.estado = "Sala";
            newTask.estadoPago = "pendiente";

            const yaExiste = comandas.some((c) => c.nombre === newTask.nombre && c.estado !== "pagado");
            if (yaExiste) {
                Swal.fire({
                    icon: "warning",
                    title: "¡Comanda Existente!",
                    text: `Ya existe una comanda para la mesa "${newTask.nombre}" que no ha sido pagada. Por favor, edita la comanda existente o selecciona otra mesa.`,
                    confirmButtonText: "Entendido",
                    confirmButtonColor: "#f4a261",
                });
                setIsSaving(false);
                return;
            }

            await guardarComanda(newTask);
            setShowModal(false);
            Swal.fire({
                icon: "success",
                title: "¡Comanda Creada!",
                text: `La comanda para la mesa "${newTask.nombre}" ha sido agregada a la Sala.`,
                showConfirmButton: false,
                timer: 1500,
                position: 'top-end',
                toast: true,
            });
        } catch (error) {
            console.error("Error al guardar la comanda:", error);
            Swal.fire({
                icon: "error",
                title: "¡Error al guardar!",
                text: "Hubo un problema al guardar la comanda. Por favor, verifica tu conexión y vuelve a intentarlo.",
                confirmButtonText: "Aceptar",
                confirmButtonColor: "#e63946",
            });
        } finally {
            setIsSaving(false);
        }
    }, [isSaving, comandas]);

    const handleEditComanda = useCallback((task) => {
        setEditingTask(task);
        setShowEditModal(true);
    }, []);

    const handleCloseEditModal = useCallback(() => {
        setShowEditModal(false);
        setEditingTask(null);
    }, []);

    const handleUpdateComanda = useCallback(async (updatedTask) => {
        try {
            const cleanedUpdatedTask = Object.fromEntries(
                Object.entries(updatedTask).filter(([_, value]) => value !== undefined)
            );

            await actualizarComanda(updatedTask.id, cleanedUpdatedTask);
            handleCloseEditModal();
            Swal.fire({
                icon: "success",
                title: "¡Comanda Actualizada!",
                text: `Los cambios en la comanda de la mesa "${updatedTask.nombre}" han sido guardados.`,
                showConfirmButton: false,
                timer: 1500,
                position: 'top-end',
                toast: true,
            });
        } catch (error) {
            console.error("Error al actualizar la comanda:", error);
            Swal.fire({
                icon: "error",
                title: "¡Error al Actualizar!",
                text: "No pudimos guardar los cambios en la comanda. Inténtalo de nuevo.",
                confirmButtonText: "Entendido",
                confirmButtonColor: "#e63946",
            });
        }
    }, [handleCloseEditModal]);


    const handleDeleteComanda = useCallback(async (taskId) => {
        const result = await Swal.fire({
            title: "¿Eliminar esta comanda?",
            text: "¡Esta acción es irreversible y la comanda se eliminará permanentemente! Se guardará una copia en el historial.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
            reverseButtons: true,
        });

        if (result.isConfirmed) {
            try {
                let comandaToDelete = null;
                for (const col of COLUMNS) {
                    comandaToDelete = activeComandas[col].find(task => task.id === taskId);
                    if (comandaToDelete) break;
                }

                if (!comandaToDelete) {
                    console.warn(`Comanda con ID ${taskId} no encontrada en el estado activo.`);
                    Swal.fire({
                        icon: "error",
                        title: "Error",
                        text: "No se encontró la comanda para eliminar.",
                        confirmButtonText: "Aceptar",
                        confirmButtonColor: "#e63946",
                    });
                    return;
                }

                const comandaForHistory = { ...comandaToDelete };

                if (comandaForHistory.fechaPago === undefined) {
                    comandaForHistory.fechaPago = null;
                }

                const cleanedComanda = Object.fromEntries(
                    Object.entries(comandaForHistory).filter(([_, value]) => value !== undefined)
                );

                cleanedComanda.eliminadoPor = {
                    uid: currentUser.uid,
                    email: currentUser.email,
                    nombre: currentUser.displayName || "Usuario Desconocido",
                };
                cleanedComanda.fechaEliminacion = new Date().toISOString();

                const historialComandasRef = ref(database, "historial/comandas");
                await push(historialComandasRef, cleanedComanda);

                await eliminarComanda(taskId);

                Swal.fire({
                    icon: "success",
                    title: "¡Eliminada!",
                    text: "La comanda ha sido eliminada y guardada en el historial.",
                    showConfirmButton: false,
                    timer: 1500,
                    position: 'top-end',
                    toast: true,
                });
            } catch (error) {
                console.error("Error al eliminar la comanda:", error);
                Swal.fire({
                    icon: "error",
                    title: "¡Error al Eliminar!",
                    text: "Hubo un error al intentar eliminar la comanda. Por favor, inténtalo de nuevo.",
                    confirmButtonText: "Aceptar",
                    confirmButtonColor: "#e63946",
                });
            }
        }
    }, [activeComandas, currentUser, eliminarComanda]);


    const handleDragEnd = useCallback(async ({ active, over }) => {
        if (!over || active.id === over.id) return;

        let sourceCol = null;
        for (const col of COLUMNS) {
            if (activeComandas[col].some((task) => task.id === active.id)) {
                sourceCol = col;
                break;
            }
        }

        const targetCol = over.id;

        if (sourceCol && COLUMNS.includes(targetCol) && sourceCol !== targetCol) {
            const movedTask = activeComandas[sourceCol].find((task) => task.id === active.id);
            if (!movedTask) return;

            try {
                await actualizarComanda(movedTask.id, { estado: targetCol });

                if (targetCol === "Listo_para_servir") {
                    Swal.fire({
                        icon: "success",
                        title: "¡Comanda Lista!",
                        html: `La comanda para la mesa <strong>${movedTask.nombre}</strong> está lista para ser servida.<br/> ¡Mesero, favor de buscar!`,
                        timer: 5000,
                        timerProgressBar: true,
                        position: 'center',
                        showConfirmButton: false,
                        customClass: {
                            popup: styles.readyToServeAlert,
                            title: styles.readyToServeAlertTitle,
                            htmlContainer: styles.readyToServeAlertText
                        }
                    });
                } else if (targetCol === "Entregado") { // New alert for 'Entregado'
                    Swal.fire({
                        icon: "info",
                        title: `Comanda Entregada`,
                        text: `La comanda para la mesa "${movedTask.nombre}" ha sido marcada como entregada.`,
                        showConfirmButton: false,
                        timer: 1500,
                        position: 'top-end',
                        toast: true,
                    });
                } else {
                    Swal.fire({
                        icon: "info",
                        title: `Comanda movida a ${targetCol === "Listo_para_servir" ? "Listo para Servir" : targetCol}`,
                        showConfirmButton: false,
                        timer: 1000,
                        position: 'bottom-start',
                        toast: true,
                    });
                }
            } catch (error) {
                console.error("Error al arrastrar y actualizar comanda:", error);
                Swal.fire({
                    icon: "error",
                    title: "¡Error al Mover!",
                    text: "No se pudo actualizar el estado de la comanda. Inténtalo de nuevo.",
                    confirmButtonText: "Entendido",
                    confirmButtonColor: "#e63946",
                });
            }
        }
    }, [activeComandas]);

    const handlePrint = (task) => {
        const now = new Date();
        const fecha = now.toLocaleDateString();
        const hora = now.toLocaleTimeString();

        const getPrecio = (id) => {
            const prod = productosDisponibles.find((p) => p.id === id);
            return prod ? parseFloat(prod.precio) : 0;
        };

        const lineItems = task.productos.map((p) => {
            const nombre = getProductNameById(p.productoId, productosDisponibles);
            const precio = getPrecio(p.productoId);
            const subtotal = precio * p.cantidad;
            return { ...p, nombre, precio, subtotal };
        });

        const total = lineItems.reduce((acc, item) => acc + item.subtotal, 0);

        const win = window.open("", "PRINT", "height=600,width=800");
        win.document.write(`
          <html>
            <head>
              <title>Ticket - ${task.nombre}</title>
              <style>
                body { font-family: monospace; padding: 20px; }
                .ticket { max-width: 300px; margin: auto; }
                .line { border-bottom: 1px dashed #000; margin: 6px 0; }
                .item { display: flex; justify-content: space-between; }
                .aclaracion { font-style: italic; font-size: 0.9em; margin-left: 10px; }
                .bold { font-weight: bold; }
              </style>
            </head>
            <body>
              <div class="ticket">
                <h1>Restaurante XYZ</h1>
                <p>${fecha} ${hora}</p>
                <div class="line"></div>
                <p><strong>Mesa:</strong> ${task.nombre}</p>
                <div class="line"></div>
                ${lineItems.map(item => `
                  <div class="item">
                    <span>${item.cantidad} x ${item.nombre}</span>
                    <span>$${item.subtotal.toFixed(2)}</span>
                  </div>
                  ${item.aclaracion ? `<div class="aclaracion">↳ ${item.aclaracion}</div>` : ""}
                `).join("")}
                <div class="line"></div>
                <div class="item bold">
                  <span>Total:</span>
                  <span>$${total.toFixed(2)}</span>
                </div>
                <div class="line"></div>
                <p>Estado: ${task.estado === "Listo_para_servir" ? "Lista para Servir" : task.estado === "Entregado" ? "Entregada" : task.estado}</p>
                <p>¡Gracias por su visita!</p>
              </div>
            </body>
          </html>
        `);
        win.document.close();
        win.focus();
        win.print();
        win.close();
    };

    // --- NEW: Handle marking comanda as 'Entregado' ---
    const handleMarkAsEntregado = useCallback(async (task) => {
        const result = await Swal.fire({
            title: "¿Marcar como entregado?",
            text: `¿Confirmas que la comanda de la mesa "${task.nombre}" ha sido entregada?`,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Sí, entregar",
            cancelButtonText: "Cancelar",
        });

        if (result.isConfirmed) {
            try {
                await actualizarComanda(task.id, { estado: "Entregado" });
                Swal.fire({
                    icon: "success",
                    title: "¡Entregada!",
                    text: `La comanda de la mesa "${task.nombre}" ha sido marcada como entregada.`,
                    showConfirmButton: false,
                    timer: 1500,
                    position: 'top-end',
                    toast: true,
                });
            } catch (error) {
                console.error("Error al marcar como entregado:", error);
                Swal.fire({
                    icon: "error",
                    title: "¡Error!",
                    text: "No se pudo marcar la comanda como entregada. Inténtalo de nuevo.",
                    confirmButtonText: "Aceptar",
                    confirmButtonColor: "#e63946",
                });
            }
        }
    }, []);


    const handleAbrirPago = (task) => {
        setTaskToPagar(task);
        setShowPagoModal(true);
    };

    const handleCerrarPago = () => {
        setShowPagoModal(false);
        setTaskToPagar(null);
    };

    const handleConfirmarPago = async (comandaActualizada) => {
        try {
            const updatedComanda = {
                ...comandaActualizada,
                estado: "pagado",
                estadoPago: "pagado",
                fechaPago: new Date().toISOString(),
            };

            const cleanedUpdatedComanda = Object.fromEntries(
                Object.entries(updatedComanda).filter(([_, value]) => value !== undefined)
            );

            await actualizarComanda(comandaActualizada.id, cleanedUpdatedComanda);
            handleCerrarPago();
            Swal.fire({
                icon: "success",
                title: "¡Pago Registrado!",
                text: `La comanda de la mesa "${comandaActualizada.nombre}" ha sido marcada como pagada.`,
                showConfirmButton: false,
                timer: 2000,
                position: 'top-end',
                toast: true,
            });
        } catch (error) {
            console.error("Error al guardar el pago:", error);
            Swal.fire({
                icon: "error",
                title: "¡Error al Registrar Pago!",
                text: "Hubo un error al procesar el pago. Por favor, inténtalo de nuevo.",
                confirmButtonText: "Aceptar",
                confirmButtonColor: "#e63946",
            });
        }
    };

    return (
        <>
            <div className={styles.divButton}>
                <button onClick={() => setShowModal(true)} disabled={isSaving} className={styles.boardButton}>
                    Agregar Comanda
                </button>
                <button onClick={() => setShowHistoryModal(true)} className={styles.boardButton}>
                    Ver Historial de Comandas
                </button>
            </div>
            <div className={styles.boardContainerDad}>
                {showModal && (
                    <ModalAddTask
                        onClose={() => setShowModal(false)}
                        onAdd={handleAddTask}
                        productosDisponibles={productosDisponibles}
                        isSaving={isSaving}
                    />
                )}

                {showEditModal && (
                    <ModalAddTask
                        onClose={handleCloseEditModal}
                        onEdit={handleUpdateComanda}
                        taskToEdit={editingTask}
                        productosDisponibles={productosDisponibles}
                    />
                )}

                {showPagoModal && taskToPagar && (
                    <ModalPago
                        task={taskToPagar}
                        productosDisponibles={productosDisponibles}
                        onClose={handleCerrarPago}
                        onPagar={handleConfirmarPago}
                    />
                )}

                {showHistoryModal && (
                    <HistorialComandas
                        onClose={() => setShowHistoryModal(false)}
                    />
                )}

                <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <div className={styles.boardContainer}>
                        {COLUMNS.map((col) => (
                            <DroppableColumn key={col} id={col} isLoading={isLoadingComandas}>
                                {!isLoadingComandas && activeComandas[col] && activeComandas[col].map((task) => (
                                    <div key={task.id} className={styles.boardItemWrapper}>
                                        <DraggableItem
                                            task={task}
                                            productosDisponibles={productosDisponibles}
                                            isListoParaServir={task.estado === "Listo_para_servir"}
                                        />
                                        <div className={styles.boardItemActions}>
                                            <button onClick={() => handleEditComanda(task)} title="Editar Comanda" className={styles.actionBtn}>
                                                <FaEdit />
                                            </button>
                                            <button onClick={() => handleDeleteComanda(task.id)} title="Eliminar Comanda" className={styles.actionBtn}>
                                                <FaTrash />
                                            </button>
                                            {/* Los botones de Imprimir, Pagar y Entregado solo aparecen en "Listo para Servir" */}
                                            {col === "Listo_para_servir" && (
                                                <>
                                                    {/* NEW: Button to mark as delivered */}
                                                    <button onClick={() => handleMarkAsEntregado(task)} title="Marcar como Entregado" className={styles.actionBtn}>
                                                        <MdDeliveryDining /> {/* New icon for delivery */}
                                                    </button>
                                                </>
                                            )}
                                            {col === "Entregado" && (
                                                <>
                                                    <button onClick={() => handlePrint(task)} title="Imprimir Ticket" className={styles.actionBtn}>
                                                        <IoMdPrint />
                                                    </button>
                                                    <button onClick={() => handleAbrirPago(task)} title="Marcar como Pagado" className={styles.actionBtn}>
                                                        <IoCardOutline />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </DroppableColumn>
                        ))}
                    </div>
                </DndContext>
            </div>
        </>
    );
}