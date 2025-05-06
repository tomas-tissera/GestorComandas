// DraggableItem.jsx
import React from "react";
import { useDraggable } from "@dnd-kit/core";

export default function DraggableItem({ id, children }) {
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        padding: "10px",
        margin: "8px 0",
        backgroundColor: "#fff",
        border: "1px solid #ddd",
        borderRadius: "6px",
        cursor: isDragging ? "grabbing" : "grab",
        boxShadow: isDragging ? "0 0 10px rgba(0, 0, 0, 0.3)" : "none", // Efecto de sombra al mover
        transition: "box-shadow 0.2s ease",
        transform: transform
          ? `translate(${transform.x}px, ${transform.y}px)` // Aplicar el movimiento del drag
          : undefined, // Si no hay movimiento, no aplicar transform
        zIndex: isDragging ? 999 : 1, // Asegura que la tarea arrastrada esté encima de las demás
      }}
    >
      {children}
    </div>
  );
}
