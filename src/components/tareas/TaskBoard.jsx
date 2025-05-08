// src/TaskBoard.jsx
import React, { useState, useCallback ,useEffect} from "react";
import { DndContext, useDraggable, useDroppable, closestCenter } from "@dnd-kit/core";
import { FaEdit, FaTrash } from "react-icons/fa";
import ModalAddTask from "./ModalAddTask";
import styles from "./TaskBoard.module.css";
import CrearMesa from "./CrearMesa";
import { guardarComanda } from "../../hooks/useComandas";  // Importamos la función para guardar comandas
import { useComandas } from "../../hooks/useComandas";  // Importamos el hook para obtener las comandas

const AVAILABLE_PRODUCTS = [
  { id: "1", name: "Pizza" },
  { id: "2", name: "Hamburguesa" },
  { id: "3", name: "Coca-Cola" },
  { id: "4", name: "Fanta" },
  { id: "5", name: "Agua Mineral" },
  { id: "6", name: "Ensalada" },
];

const COLUMNS = ["Sala", "Cocina", "Entregado"];

const DraggableItem = React.memo(({ task }) => {
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

function getProductNameById(id) {
  const p = AVAILABLE_PRODUCTS.find((prod) => prod.id === id);
  return p?.name || "Desconocido";
}

export default function TaskBoard() {
  const [tasks, setTasks] = useState({
    Sala: [],
    Cocina: [],
    Entregado: [],
  });
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Usamos el hook para obtener las comandas de Firebase
  const comandas = useComandas();

  // Convertir las comandas en el formato adecuado para mostrar
  useEffect(() => {
    const updatedTasks = {
      Sala: [],
      Cocina: [],
      Entregado: [],
    };

    comandas.forEach((comanda) => {
      // Se asigna cada comanda a su columna correspondiente, según el estado de la comanda
      updatedTasks.Sala.push(comanda);
    });

    setTasks(updatedTasks);
  }, [comandas]);

  const handleAddTask = useCallback((newTask) => {
    newTask.id = Date.now();
    newTask.productos = newTask.productos.map((prod) => ({
      ...prod,
      condiciones: prod.condiciones || [],
    }));

    // Guardar la nueva comanda en Firebase
    guardarComanda(newTask).then(() => {
      // Después de guardarla, actualizamos la UI
      setTasks((prev) => ({ ...prev, Sala: [...prev.Sala, newTask] }));
    }).catch((error) => {
      console.error("Error al guardar la comanda:", error);
    });
  }, []);

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
    handleCloseEditModal();
  }, [handleCloseEditModal]);

  const handleDeleteComanda = useCallback((taskId) => {
    setTasks((prev) => {
      const updated = {};
      for (const col of COLUMNS) {
        updated[col] = prev[col].filter((task) => task.id !== taskId);
      }
      return updated;
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
        return {
          ...prev,
          [sourceCol]: prev[sourceCol].filter((task) => task.id !== active.id),
          [targetCol]: [...prev[targetCol], movedTask],
        };
      });
    }
  }, [tasks]);

  return (
    <div>
      <CrearMesa />
      <button onClick={() => setShowModal(true)}>Agregar Comanda</button>

      {showModal && (
        <ModalAddTask
          onClose={() => setShowModal(false)}
          onAdd={handleAddTask}
          availableProducts={AVAILABLE_PRODUCTS}
        />
      )}

      {showEditModal && (
        <ModalAddTask
          onClose={handleCloseEditModal}
          onEdit={handleUpdateComanda}
          taskToEdit={editingTask}
          availableProducts={AVAILABLE_PRODUCTS}
        />
      )}

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className={styles.boardContainer}>
          {COLUMNS.map((col) => (
            <DroppableColumn key={col} id={col}>
              {tasks[col].map((task) => (
                <div key={task.id} className={styles.boardItem}>
                  <DraggableItem task={task} />
                  <div className={styles.boardIcon}>
                    <button onClick={() => handleEditComanda(task)}>
                      <FaEdit />
                    </button>
                    <button onClick={() => handleDeleteComanda(task.id)}>
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
