import React, { useState, useCallback, useEffect } from "react";
import { DndContext, useDraggable, useDroppable, closestCenter } from "@dnd-kit/core";
import { FaEdit, FaTrash } from "react-icons/fa";
import ModalAddTask from "./ModalAddTask";
import styles from "./TaskBoard.module.css";
import CrearMesa from "./CrearMesa";
import CrearProducto from "./CrearProducto";
import CrearCategoria from "./CrearCategoria";
import { useComandas, guardarComanda, eliminarComanda, actualizarComanda } from "../../hooks/useComandas";
import { useProductos } from "../../hooks/useProductos";
import ModalPago from "./ModalPago";

const COLUMNS = ["Sala", "Cocina", "Entregado"];

function getProductNameById(id, productosDisponibles) {
  const p = productosDisponibles.find((prod) => prod.id === id);
  return p?.nombre || "Desconocido";
}

const DraggableItem = React.memo(({ task, productosDisponibles }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: task.id });

  const style = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    padding: "10px",
    borderRadius: "6px",
    marginBottom: "10px",
    backgroundColor: "#fff",
    cursor: "grab",
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

const DroppableColumn = React.memo(({ id, children }) => {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={styles.column}>
      <h3>{id}</h3>
      {children}
    </div>
  );
});

export default function TaskBoard() {
  const [tasks, setTasks] = useState({
    Sala: [],
    Cocina: [],
    Entregado: [],
  });
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const comandas = useComandas();
  const productosDisponibles = useProductos();

  useEffect(() => {
    const updatedTasks = {
      Sala: [],
      Cocina: [],
      Entregado: [],
    };

    comandas.forEach((comanda) => {
      const estadoValido = COLUMNS.includes(comanda.estado) ? comanda.estado : "Sala";
      updatedTasks[estadoValido].push(comanda);
    });

    setTasks(updatedTasks);
  }, [comandas]);

  const handleAddTask = useCallback(async (newTask) => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      newTask.estado = "Sala";

      const yaExiste = comandas.some((c) => c.nombre === newTask.nombre);
      if (yaExiste) {
        console.warn("Comanda ya existe:", newTask.nombre);
        setIsSaving(false);
        return;
      }

      await guardarComanda(newTask);
      setShowModal(false); // El useComandas actualizará tasks automáticamente
    } catch (error) {
      console.error("Error al guardar la comanda:", error);
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

  const handleUpdateComanda = useCallback((updatedTask) => {
    actualizarComanda(updatedTask.id, updatedTask);
    handleCloseEditModal();
  }, [handleCloseEditModal]);

  const handleDeleteComanda = useCallback((taskId) => {
    eliminarComanda(taskId).then(() => {
      setTasks((prev) => {
        const updated = {};
        for (const col of COLUMNS) {
          updated[col] = prev[col].filter((task) => task.id !== taskId);
        }
        return updated;
      });
    });
  }, []);

  const handleDragEnd = useCallback(({ active, over }) => {
    if (!over || active.id === over.id) return;

    let sourceCol = null;
    for (const col of COLUMNS) {
      if (tasks[col].some((task) => task.id === active.id)) {
        sourceCol = col;
        break;
      }
    }

    const targetCol = over.id;
    if (sourceCol && targetCol && sourceCol !== targetCol) {
      setTasks((prev) => {
        const movedTask = prev[sourceCol].find((task) => task.id === active.id);
        if (!movedTask) return prev;

        const updatedTask = { ...movedTask, estado: targetCol };
        actualizarComanda(updatedTask.id, { estado: targetCol });

        return {
          ...prev,
          [sourceCol]: prev[sourceCol].filter((task) => task.id !== active.id),
          [targetCol]: [...prev[targetCol], updatedTask],
        };
      });
    }
  }, [tasks]);

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

  const [showPagoModal, setShowPagoModal] = useState(false);
  const [taskToPagar, setTaskToPagar] = useState(null);

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
      await actualizarComanda(comandaActualizada.id, comandaActualizada);
      handleCerrarPago();
    } catch (error) {
      console.error("Error al guardar el pago:", error);
    }
  };

  return (
    <div>
      <CrearCategoria />
      <CrearProducto />
      <CrearMesa />

      <button onClick={() => setShowModal(true)} disabled={isSaving}>
        Agregar Comanda
      </button>

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

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className={styles.boardContainer}>
          {COLUMNS.map((col) => (
            <DroppableColumn key={col} id={col}>
              {tasks[col].map((task) => (
                <div key={task.id} className={styles.boardItem}>
                  <DraggableItem task={task} productosDisponibles={productosDisponibles} />
                  <div className={styles.boardIcon}>
                    <button onClick={() => handleEditComanda(task)}>
                      <FaEdit />
                    </button>
                    <button onClick={() => handleDeleteComanda(task.id)}>
                      <FaTrash />
                    </button>
                    {col === "Entregado" && (
                      <>
                        <button onClick={() => handlePrint(task)}>🖨️</button>
                        <button onClick={() => handleAbrirPago(task)}>💳</button>
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
