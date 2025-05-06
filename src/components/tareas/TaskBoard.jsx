import React, { useState } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import DroppableColumn from "./DroppableColumn";
import DraggableItem from "./DraggableItem";
import ModalAddTask from "./ModalAddTask";
import styles from "./TaskBoard.module.css";

// Lista fija de productos disponibles
const availableProducts = [
  { id: "1", name: "Pizza" },
  { id: "2", name: "Hamburguesa" },
  { id: "3", name: "Coca-Cola" },
  { id: "4", name: "Fanta" },
  { id: "5", name: "Agua Mineral" },
  { id: "6", name: "Ensalada" },
];

// Columnas del tablero
const columns = ["Sala", "Cocina", "Entregado"];

// Comandas iniciales
const initialTasks = {
  Sala: [
    {
      id: 1,
      nombre: "Mesa 1",
      productos: [
        { productoId: "1", cantidad: 2 }, // Pizza
        { productoId: "3", cantidad: 1 }, // Coca-Cola
      ],
    },
  ],
  Cocina: [],
  Entregado: [],
};

export default function TaskBoard() {
  const [tasks, setTasks] = useState(initialTasks);
  const [showModal, setShowModal] = useState(false);

  // Buscar nombre del producto por ID
  const getProductNameById = (id) => {
    const producto = availableProducts.find((p) => p.id === id);
    return producto ? producto.name : "Producto desconocido";
  };

  // Agregar una nueva comanda a Sala
  const handleAddTask = (newTask) => {
    const newId = tasks.Sala.length ? tasks.Sala[tasks.Sala.length - 1].id + 1 : 1;
    newTask.id = newId;
    setTasks((prev) => ({
      ...prev,
      Sala: [...prev.Sala, newTask],
    }));
  };

  // Manejar movimiento de comanda
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    let sourceColumn, destinationColumn;

    for (const column in tasks) {
      if (tasks[column].find((task) => task.id === active.id)) {
        sourceColumn = column;
        break;
      }
    }

    destinationColumn = over.id;

    if (sourceColumn && destinationColumn && sourceColumn !== destinationColumn) {
      setTasks((prev) => {
        const sourceTasks = prev[sourceColumn].filter((task) => task.id !== active.id);
        const destinationTasks = [
          ...prev[destinationColumn],
          tasks[sourceColumn].find((task) => task.id === active.id),
        ];

        return {
          ...prev,
          [sourceColumn]: sourceTasks,
          [destinationColumn]: destinationTasks,
        };
      });
    }
  };

  return (
    <div>
      <button
        onClick={() => setShowModal(true)}
        style={{
          padding: "10px 20px",
          backgroundColor: "#28a745",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          marginBottom: "20px",
        }}
      >
        Agregar Comanda
      </button>

      {showModal && (
        <ModalAddTask
          onClose={() => setShowModal(false)}
          onAdd={handleAddTask}
          availableProducts={availableProducts} // Pasa productos al modal
        />
      )}

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className={styles.boardContainer}>
          {columns.map((col) => (
            
            <DroppableColumn key={col} id={col}>
              
              <h3>{col}</h3>
              {tasks[col].map((task) => (
                <DraggableItem key={task.id} id={task.id}>
                  <div>
                    <h4>{task.nombre}</h4>
                    <ul>
                      {task.productos.map((prod, index) => (
                        <li key={index}>
                          {prod.cantidad} x {getProductNameById(prod.productoId)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </DraggableItem>
              ))}
            </DroppableColumn>
          ))}
        </div>
      </DndContext>
    </div>
  );
}
