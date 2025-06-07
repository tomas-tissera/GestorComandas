import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export const useUsers = () => {
  const [users, setUsers] = useState(null); // Usamos 'null' inicialmente para indicar que está cargando

  useEffect(() => {
    const usersCollectionRef = collection(db, 'users'); // Asume que tus usuarios están en la colección 'users'

    const unsubscribe = onSnapshot(
      usersCollectionRef,
      (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersData);
      },
      (err) => {
        console.error("Error fetching users:", err);
        setUsers([]); // Si hay un error, establece un array vacío
      }
    );

    return () => unsubscribe(); // Función de limpieza para desuscribirse cuando el componente se desmonte
  }, []);

  return users; // Retornará 'null' mientras carga, y luego un array de usuarios (vacío si no hay o hay error)
};