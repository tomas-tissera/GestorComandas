// DroppableColumn.jsx
import React from "react";
import { useDroppable } from "@dnd-kit/core";

export default function DroppableColumn({ id, children }) {
  const { setNodeRef } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        minHeight: "300px",
        flex: 1, // Asegura que las columnas tengan el mismo tamaño
        padding: "15px",
        backgroundColor: "#f4f4f4",
        borderRadius: "8px",
      }}
    >
      <h3 style={{ textAlign: "center" }}></h3>
      {children}
    </div>
  );
}
