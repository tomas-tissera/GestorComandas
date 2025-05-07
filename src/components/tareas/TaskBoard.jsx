import React, { useState } from "react";
import { DndContext, useDraggable, useDroppable, closestCenter } from "@dnd-kit/core";
import { FaEdit, FaTrash } from "react-icons/fa";
import ModalAddTask from "./ModalAddTask";
import styles from "./TaskBoard.module.css";

const availableProducts = [
  { id: "1", name: "Pizza" },
  { id: "2", name: "Hamburguesa" },
  { id: "3", name: "Coca-Cola" },
  { id: "4", name: "Fanta" },
  { id: "5", name: "Agua Mineral" },
  { id: "6", name: "Ensalada" },
];

const columns = ["Sala", "Cocina", "Entregado"];

const initialTasks = {
  Sala: [
    {
      id: 1,
      nombre: "Mesa 1",
      productos: [
        { productoId: "1", cantidad: 2, aclaracion: "Sin cebolla" },
        { productoId: "3", cantidad: 1, aclaracion: "Con hielo extra" },
      ],
    },
  ],
  Cocina: [],
  Entregado: [],
};

// 🔹 Componente arrastrable
function DraggableItem({ task }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  });

  const style = {
    transform: transform
      ? `translate(${transform.x}px, ${transform.y}px)`
      : undefined,
    border: "1px solid #ccc",
    padding: "10px",
    borderRadius: "6px",
    backgroundColor: "#fff",
    marginBottom: "10px",
    cursor: "grab",
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <strong>{task.nombre}</strong>
      <ul>
        {task.productos.map((prod, index) => (
          <li key={index}>
            {prod.cantidad} x {getProductNameById(prod.productoId)}
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
}

// 🔹 Zona receptora de drop
function DroppableColumn({ id, children }) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={styles.column}>
      <h3>{id}</h3>
      {children}
    </div>
  );
}

// 🔹 Buscar nombre de producto
function getProductNameById(id) {
  const p = availableProducts.find((prod) => prod.id === id);
  return p?.name || "Desconocido";
}

export default function TaskBoard() {
  const [tasks, setTasks] = useState(initialTasks);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleAddTask = (newTask) => {
    const newId = Date.now(); // ID único
    newTask.id = newId;
    setTasks((prev) => ({
      ...prev,
      Sala: [...prev.Sala, newTask],
    }));
  };

  const handleEditComanda = (task) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingTask(null);
  };

  const handleUpdateComanda = (updatedTask) => {
    setTasks((prev) => {
      const updated = { ...prev };
      for (const col of columns) {
        updated[col] = updated[col].map((task) =>
          task.id === updatedTask.id ? updatedTask : task
        );
      }
      return updated;
    });
    handleCloseEditModal();
  };

  const handleDeleteComanda = (taskId) => {
    setTasks((prev) => {
      const updated = {};
      for (const col of columns) {
        updated[col] = prev[col].filter((task) => task.id !== taskId);
      }
      return updated;
    });
  };

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;

    let sourceCol, targetCol;
    for (const col of columns) {
      if (tasks[col].some((task) => task.id === active.id)) {
        sourceCol = col;
        break;
      }
    }

    targetCol = over.id;

    if (sourceCol && targetCol && sourceCol !== targetCol) {
      setTasks((prev) => {
        const movedTask = prev[sourceCol].find((task) => task.id === active.id);
        return {
          ...prev,
          [sourceCol]: prev[sourceCol].filter((task) => task.id !== active.id),
          [targetCol]: [...prev[targetCol], movedTask],
        };
      });
    }
  };

  return (
    <div>
      <button
        onClick={() => setShowModal(true)}
        style={{ padding: "10px 20px", marginBottom: "20px" }}
      >
        Agregar Comanda
      </button>

      {/* Modal para agregar */}
      {showModal && (
        <ModalAddTask
          onClose={() => setShowModal(false)}
          onAdd={handleAddTask}
          availableProducts={availableProducts}
        />
      )}

      {/* ✅ Modal para editar */}
      {showEditModal && (
        <ModalAddTask
          onClose={handleCloseEditModal}
          onAdd={handleAddTask}
          onEdit={handleUpdateComanda}
          availableProducts={availableProducts}
          taskToEdit={editingTask}
        />
      )}

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className={styles.boardContainer}>
          {columns.map((col) => (
            <DroppableColumn key={col} id={col}>
              {tasks[col].map((task) => (
                <div key={task.id}>
                  <DraggableItem task={task} />
                  <div style={{ display: "flex", gap: "5px" }}>
                    <button
                      onClick={() => handleEditComanda(task)}
                      style={{
                        backgroundColor: "#007bff",
                        color: "#fff",
                        padding: "5px 10px",
                      }}
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDeleteComanda(task.id)}
                      style={{
                        backgroundColor: "#dc3545",
                        color: "#fff",
                        padding: "5px 10px",
                      }}
                    >
                      <FaTrash />
                    </button>
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
