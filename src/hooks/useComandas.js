// src/hooks/useComandas.js
import { ref, push } from "firebase/database";
import { database } from "../firebase";

export function guardarComanda(comanda) {
  const comandasRef = ref(database, "comandas/");
  return push(comandasRef, comanda);
}
