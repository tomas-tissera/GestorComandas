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
    if (comandas.length === 0) return;

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
    newTask.estado = "Sala";

    try {
      const existingComanda = comandas.find((comanda) => comanda.nombre === newTask.nombre);
      if (existingComanda) {
        console.log("Comanda ya existe:", existingComanda);
        return;
      }

      await guardarComanda(newTask);
      setShowModal(false);
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
    setTasks((prev) => {
      const updated = { ...prev };
      for (const col of COLUMNS) {
        updated[col] = updated[col].map((task) =>
          task.id === updatedTask.id ? updatedTask : task
        );
      }
      return updated;
    });

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

    let sourceCol, targetCol;
    for (const col of COLUMNS) {
      if (tasks[col].some((task) => task.id === active.id)) {
        sourceCol = col;
        break;
      }
    }

    targetCol = over.id;

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
    const win = window.open("", "PRINT", "height=600,width=800");

    win.document.write(`
      <html>
        <head>
          <title>Ticket - ${task.nombre}</title>
          <style>
            body { font-family: Arial; padding: 20px; }
            h1 { font-size: 24px; }
            ul { list-style: none; padding: 0; }
            li { margin-bottom: 5px; }
            .aclaracion { font-style: italic; font-size: 0.9em; }
          </style>
        </head>
        <body>
          <h1>Ticket de Venta</h1>
          <p><strong>Mesa:</strong> ${task.nombre}</p>
          <ul>
            ${task.productos.map(p => `
              <li>
                ${p.cantidad} x ${getProductNameById(p.productoId, productosDisponibles)}
                ${p.aclaracion ? `<div class="aclaracion">Aclaración: ${p.aclaracion}</div>` : ""}
              </li>
            `).join("")}
          </ul>
          <p><strong>Estado:</strong> ${task.estado}</p>
        </body>
      </html>
    `);

    win.document.close();
    win.focus();
    win.print();
    win.close();
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
                      <button onClick={() => handlePrint(task)}>
                        🖨️
                      </button>
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
