import React, { useState, useCallback, useEffect } from "react";
import { DndContext, useDraggable, useDroppable, closestCenter } from "@dnd-kit/core";
import { FaEdit, FaTrash } from "react-icons/fa";
import ModalAddTask from "./ModalAddTask";
import styles from "./TaskBoard.module.css";
import Swal from "sweetalert2";
import { ref, remove, push } from "firebase/database";
import { database } from "../../firebase";
import { useAuth } from "../../components/AuthProvider";

import { useComandas, guardarComanda, eliminarComanda, actualizarComanda } from "../../hooks/useComandas";
import { useProductos } from "../../hooks/useProductos";
import ModalPago from "./ModalPago";
import HistorialComandas from "./HistorialComandas";
import { IoMdPrint } from "react-icons/io";
import { IoCardOutline } from "react-icons/io5"; // Assuming this is correct now

const COLUMNS = ["Sala", "Cocina", "Entregado"];

// Helper function to get product name by ID
function getProductNameById(id, productosDisponibles) {
  const p = productosDisponibles.find((prod) => prod.id === id);
  return p?.nombre || "Desconocido";
}

// Draggable Item Component (memoized for performance)
const DraggableItem = React.memo(({ task, productosDisponibles }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: task.id });

  const style = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    cursor: "grab",
  };

  return (
    <div ref={setNodeRef} style={style} className={styles.boardItem} {...listeners} {...attributes}>
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
  return (
    <div ref={setNodeRef} className={styles.column}>
      <h3>{id}</h3>
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

  const comandas = useComandas();
  const productosDisponibles = useProductos();
  const { currentUser } = useAuth();

  const [activeComandas, setActiveComandas] = useState({
    Sala: [],
    Cocina: [],
    Entregado: [],
  });

  useEffect(() => {
    if (comandas !== null) {
      setIsLoadingComandas(false);
      const newActiveComandas = {
        Sala: [],
        Cocina: [],
        Entregado: [],
      };

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

      const yaExiste = comandas.some((c) => c.nombre === newTask.nombre);
      if (yaExiste) {
        Swal.fire({
          icon: "warning",
          title: "¡Comanda Existente!",
          text: `Ya existe una comanda para la mesa "${newTask.nombre}". Por favor, edita la comanda existente o selecciona otra mesa.`,
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
      // Ensure no undefined values are passed to Firebase in updatedTask
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


  // --- MODIFIED handleDeleteComanda to explicitly handle fechaPago ---
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

        // Prepare the comanda for history:
        // 1. Start with a copy of comandaToDelete
        const comandaForHistory = { ...comandaToDelete };

        // 2. Explicitly handle 'fechaPago': if it's undefined, set it to null.
        //    Firebase allows null, but not undefined.
        if (comandaForHistory.fechaPago === undefined) {
          comandaForHistory.fechaPago = null;
        }

        // 3. Filter out any other remaining undefined values (a good general practice)
        const cleanedComanda = Object.fromEntries(
            Object.entries(comandaForHistory).filter(([_, value]) => value !== undefined)
        );

        // Add deletion metadata
        cleanedComanda.eliminadoPor = {
            uid: currentUser.uid,
            email: currentUser.email,
            nombre: currentUser.displayName || "Usuario Desconocido",
        };
        cleanedComanda.fechaEliminacion = new Date().toISOString();

        // 1. Save to historical record
        const historialComandasRef = ref(database, "historial/comandas");
        await push(historialComandasRef, cleanedComanda); // Push the fully cleaned and augmented object

        // 2. Delete from active comandas
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


  const handleDragEnd = useCallback(({ active, over }) => {
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

      actualizarComanda(movedTask.id, { estado: targetCol })
        .then(() => {
          Swal.fire({
            icon: "info",
            title: `Comanda movida a ${targetCol}`,
            showConfirmButton: false,
            timer: 1000,
            position: 'bottom-start',
            toast: true,
          });
        })
        .catch(error => {
          console.error("Error al arrastrar y actualizar comanda:", error);
          Swal.fire({
            icon: "error",
            title: "¡Error al Mover!",
            text: "No se pudo actualizar el estado de la comanda. Inténtalo de nuevo.",
            confirmButtonText: "Entendido",
            confirmButtonColor: "#e63946",
          });
        });
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
            <p>Estado: ${task.estado}</p>
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
      // Ensure fechaPago is set when updating to "pagado"
      const updatedComanda = {
        ...comandaActualizada,
        estado: "pagado",
        estadoPago: "pagado",
        fechaPago: new Date().toISOString(), // Set fechaPago here
      };

      // Filter out undefined values from updatedComanda before sending to Firebase
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
                  {!isLoadingComandas && activeComandas[col].map((task) => (
                    <div key={task.id} className={styles.boardItem}>
                      <DraggableItem task={task} productosDisponibles={productosDisponibles} />
                      <div className={styles.boardIcon}>
                        <button onClick={() => handleEditComanda(task)} title="Editar Comanda">
                          <FaEdit />
                        </button>
                        <button onClick={() => handleDeleteComanda(task.id)} title="Eliminar Comanda">
                          <FaTrash />
                        </button>
                        {col === "Entregado" && (
                          <>
                            <button onClick={() => handlePrint(task)} title="Imprimir Ticket">
                              <IoMdPrint />
                            </button>
                            <button onClick={() => handleAbrirPago(task)} title="Marcar como Pagado">
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