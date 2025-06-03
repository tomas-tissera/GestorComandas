import React, { useState, useCallback, useEffect } from "react";
import { DndContext, useDraggable, useDroppable, closestCenter } from "@dnd-kit/core";
import { FaEdit, FaTrash } from "react-icons/fa";
import ModalAddTask from "./ModalAddTask";
import styles from "./TaskBoard.module.css";
// import CrearMesa from "./CrearMesa"; // Commented out as per original
// import CrearProducto from "./CrearProducto"; // Commented out as per original
// import CrearCategoria from "./CrearCategoria"; // Commented out as per original
import { useComandas, guardarComanda, eliminarComanda, actualizarComanda } from "../../hooks/useComandas";
import { useProductos } from "../../hooks/useProductos";
import ModalPago from "./ModalPago";
import HistorialComandas from "./HistorialComandas";
import { IoMdPrint } from "react-icons/io";
import { IoCardOutline } from "react-icons/io5";

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
              <div className={styles.aclaracion}> {/* Use module class */}
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
const DroppableColumn = React.memo(({ id, children, isLoading }) => { // Added isLoading prop
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={styles.column}>
      <h3>{id}</h3>
      {isLoading ? ( // Conditionally render loading state
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
  const [isLoadingComandas, setIsLoadingComandas] = useState(true); // New loading state

  const comandas = useComandas(); // All comandas from the hook
  const productosDisponibles = useProductos();

  // State to hold only the active comandas for the board
  const [activeComandas, setActiveComandas] = useState({
    Sala: [],
    Cocina: [],
    Entregado: [],
  });

  // Effect to filter comandas for the active board
  // Updated to manage loading state
  useEffect(() => {
    if (comandas.length > 0) { // Check if comandas have been loaded
        setIsLoadingComandas(false); // Set loading to false once data is available
    } else if (comandas.length === 0 && !isLoadingComandas) { // If comandas become empty after loading, might be a data reset
        // Potentially handle this case, e.g., if you delete all, it should still show as loaded.
        // For initial load, this works.
    }


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
  }, [comandas, isLoadingComandas]); // Re-run this effect whenever the raw 'comandas' data changes or loading state changes

  // You might want to update your useComandas hook to expose a loading state
  // or explicitly set isLoadingComandas to true before calling useComandas
  // and then false within its success callback. For now, this useEffect provides a basic indicator.

  // Callback for adding a new comanda
  const handleAddTask = useCallback(async (newTask) => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      newTask.estado = "Sala";
      newTask.estadoPago = "pendiente";

      const yaExiste = comandas.some((c) => c.nombre === newTask.nombre);
      if (yaExiste) {
        console.warn("Comanda ya existe:", newTask.nombre);
        alert(`La comanda con el nombre "${newTask.nombre}" ya existe.`);
        setIsSaving(false);
        return;
      }

      await guardarComanda(newTask);
      setShowModal(false);
    } catch (error) {
      console.error("Error al guardar la comanda:", error);
      alert("Hubo un error al guardar la comanda. Por favor, inténtalo de nuevo.");
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, comandas]);

  // Callback for editing a comanda
  const handleEditComanda = useCallback((task) => {
    setEditingTask(task);
    setShowEditModal(true);
  }, []);

  // Callback for closing edit modal
  const handleCloseEditModal = useCallback(() => {
    setShowEditModal(false);
    setEditingTask(null);
  }, []);

  // Callback for updating a comanda (from edit modal)
  const handleUpdateComanda = useCallback(async (updatedTask) => {
    try {
      await actualizarComanda(updatedTask.id, updatedTask);
      handleCloseEditModal();
    } catch (error) {
      console.error("Error al actualizar la comanda:", error);
      alert("Hubo un error al actualizar la comanda. Por favor, inténtalo de nuevo.");
    }
  }, [handleCloseEditModal]);

  // Callback for deleting a comanda
  const handleDeleteComanda = useCallback((taskId) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta comanda?")) {
      return;
    }
    eliminarComanda(taskId)
      .then(() => {
        console.log(`Comanda con ID ${taskId} eliminada.`);
      })
      .catch((error) => {
        console.error("Error al eliminar la comanda:", error);
        alert("Hubo un error al intentar eliminar la comanda. Por favor, inténtalo de nuevo.");
      });
  }, []);

  // Callback for drag and drop end
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
        .catch(error => {
          console.error("Error al arrastrar y actualizar comanda:", error);
          alert("No se pudo actualizar el estado de la comanda.");
        });
    }
  }, [activeComandas]);

  // Function to handle printing a ticket
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

  // Callbacks for payment modal
  const handleAbrirPago = (task) => {
    setTaskToPagar(task);
    setShowPagoModal(true);
  };

  const handleCerrarPago = () => {
    setShowPagoModal(false);
    setTaskToPagar(null);
  };

  // Callback to confirm payment and update comanda status
  const handleConfirmarPago = async (comandaActualizada) => {
    try {
      await actualizarComanda(comandaActualizada.id, {
        ...comandaActualizada,
        estado: "pagado"
      });
      handleCerrarPago();
    } catch (error) {
      console.error("Error al guardar el pago:", error);
      alert("Hubo un error al procesar el pago. Por favor, inténtalo de nuevo.");
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
              <DroppableColumn key={col} id={col} isLoading={isLoadingComandas}> {/* Pass isLoadingComandas prop */}
                {/* (inside DroppableColumn) */}
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