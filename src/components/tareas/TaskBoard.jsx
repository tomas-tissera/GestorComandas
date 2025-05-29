import React, { useState, useCallback, useEffect } from "react";
import { DndContext, useDraggable, useDroppable, closestCenter } from "@dnd-kit/core";
import { FaEdit, FaTrash } from "react-icons/fa"; // <--- ADD THIS LINE: Import FaEdit and FaTrash
import ModalAddTask from "./ModalAddTask";
import styles from "./TaskBoard.module.css";
import CrearMesa from "./CrearMesa";
import CrearProducto from "./CrearProducto";
import CrearCategoria from "./CrearCategoria";
import { useComandas, guardarComanda, eliminarComanda, actualizarComanda } from "../../hooks/useComandas";
import { useProductos } from "../../hooks/useProductos";
import ModalPago from "./ModalPago";
import HistorialComandas from "./HistorialComandas"; // Import the new History Component

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
    padding: "10px",
    borderRadius: "6px",
    marginBottom: "10px",
    backgroundColor: "#fff",
    cursor: "grab",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)", // Added for better visual
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <strong>{task.nombre}</strong>
      <ul>
        {task.productos.map((prod, index) => (
          <li key={index}>
            {prod.cantidad} x {getProductNameById(prod.productoId, productosDisponibles)}
            {prod.aclaracion && (
              <div style={{ fontStyle: "italic", fontSize: "0.9em" }}>
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
const DroppableColumn = React.memo(({ id, children }) => {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={styles.column}>
      <h3>{id}</h3>
      {children}
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
  const [showHistoryModal, setShowHistoryModal] = useState(false); // New state for history modal

  const comandas = useComandas(); // All comandas from the hook
  const productosDisponibles = useProductos();

  // State to hold only the active comandas for the board
  const [activeComandas, setActiveComandas] = useState({
    Sala: [],
    Cocina: [],
    Entregado: [],
  });

  // Effect to filter comandas for the active board
  useEffect(() => {
    const newActiveComandas = {
      Sala: [],
      Cocina: [],
      Entregado: [],
    };

    comandas.forEach((comanda) => {
      // Only include comandas that are NOT paid in the active board
      // Assuming 'estado: "pagado"' is the marker for paid comandas
      if (comanda.estado !== "pagado") {
        const estadoValido = COLUMNS.includes(comanda.estado) ? comanda.estado : "Sala";
        newActiveComandas[estadoValido].push(comanda);
      }
    });

    setActiveComandas(newActiveComandas);
  }, [comandas]); // Re-run this effect whenever the raw 'comandas' data changes

  // Callback for adding a new comanda
  const handleAddTask = useCallback(async (newTask) => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      newTask.estado = "Sala";
      // Initialize estadoPago, or ensure your backend defaults it appropriately
      newTask.estadoPago = "pendiente"; // Or some other initial non-paid state

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
        // The `useEffect` listening to `comandas` will update `activeComandas`
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
    // Determine the source column from activeComandas
    for (const col of COLUMNS) {
      if (activeComandas[col].some((task) => task.id === active.id)) {
        sourceCol = col;
        break;
      }
    }

    const targetCol = over.id;

    // Proceed only if valid source, target is a column, and it's a different column
    if (sourceCol && COLUMNS.includes(targetCol) && sourceCol !== targetCol) {
      const movedTask = activeComandas[sourceCol].find((task) => task.id === active.id);
      if (!movedTask) return;

      // Update the task's status in the backend
      // The `useComandas` hook will then update, triggering `useEffect` and `activeComandas` re-render
      actualizarComanda(movedTask.id, { estado: targetCol })
        .catch(error => {
          console.error("Error al arrastrar y actualizar comanda:", error);
          alert("No se pudo actualizar el estado de la comanda.");
        });
    }
  }, [activeComandas]); // Dependency on activeComandas

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
      // Important: Ensure ModalPago sets comandaActualizada.estado = "pagado"
      // If it uses estadoPago, make sure this component's useEffect checks estadoPago
      await actualizarComanda(comandaActualizada.id, {
        ...comandaActualizada,
        estado: "pagado" // Explicitly setting state to 'pagado' here
      });
      handleCerrarPago();
    } catch (error) {
      console.error("Error al guardar el pago:", error);
      alert("Hubo un error al procesar el pago. Por favor, inténtalo de nuevo.");
    }
  };

  return (
    <div>
      {/* Configuration components (CrearCategoria, CrearProducto, CrearMesa) */}
      <CrearCategoria />
      <CrearProducto />
      <CrearMesa />

      {/* Action buttons */}
      <button onClick={() => setShowModal(true)} disabled={isSaving}>
        Agregar Comanda
      </button>
      <button onClick={() => setShowHistoryModal(true)} style={{ marginLeft: "10px" }}>
        Ver Historial de Comandas
      </button>

      {/* Modals */}
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

      {/* History Modal - Conditionally rendered */}
      {showHistoryModal && (
        <HistorialComandas
          onClose={() => setShowHistoryModal(false)}
          // You don't need to pass comandas or productosDisponibles here
          // as HistorialComandas will fetch them via its own hooks
        />
      )}

      {/* Task Board Columns */}
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className={styles.boardContainer}>
          {COLUMNS.map((col) => (
            <DroppableColumn key={col} id={col}>
              {/* Render only active comandas (not paid) */}
              {activeComandas[col].map((task) => (
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
                          🖨️
                        </button>
                        <button onClick={() => handleAbrirPago(task)} title="Marcar como Pagado">
                          💳
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
  );
}