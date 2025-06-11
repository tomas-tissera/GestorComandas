# 🍽️ Mesero App

Aplicación web para la gestión de pedidos en restaurantes. Permite a meseros, cocineros y gerentes coordinar de manera eficiente los pedidos, tiempos de entrega y generación de reportes.

## 🧑‍💼 Roles y Credenciales de Prueba

### Mesero
- **Correo**: `meserotest@gamil.com`
- **Contraseña**: `123456`

### Cocinero
- **Correo**: `cocineroTest@gamil.com`
- **Contraseña**: `123456`

### Gerente
- **Correo**: `gerente@gmail.com`
- **Contraseña**: `123456`

---

## 🚀 Funcionalidades

### Para Meseros
- Crear y enviar pedidos a cocina.
- Visualizar historial de pedidos por mesa.
- Filtrar y editar pedidos antes de enviar.

### Para Cocineros
- Ver pedidos entrantes en tiempo real.
- Cambiar estado de los pedidos (pendiente, en preparación, listo).
- Ordenar pedidos por prioridad o mesa.

### Para Gerentes
- Visualizar todos los pedidos.
- Generar reportes en PDF.
- Acceso a estadísticas y gráficas de productividad.
- Gestión de usuarios y roles (opcional).

---

## 🛠️ Tecnologías Usadas

- **React 18** – Interfaz basada en componentes.
- **Firebase** – Autenticación, Base de datos, Hosting.
- **Zustand** – Estado global simple.
- **React Router DOM** – Rutas protegidas.
- **SweetAlert2/React-toastify** – Alertas modernas.
- **Chart.js + Recharts** – Gráficas interactivas.
- **jsPDF + html2canvas** – Exportación de reportes PDF.
- **DND Kit** – Drag & Drop para gestión visual.
- **React Hook Form** – Formularios optimizados.
- **Date-fns & React Datepicker** – Manejo de fechas.
- **Lucide React & React Icons** – Íconos SVG.
- **LocalForage** – Soporte offline (opcional).
- **Match-sorter & Sort-by** – Búsqueda y ordenamiento.

---

## ⚙️ Instalación

1. Clona el repositorio:
   ```
   git clone https://github.com/tomas-tissera/GestorComandas.git
   cd mesero-app
   ```
2. Instala las dependencias:
    ```
    npm install
    ```
3. Configura Firebase:
    ```
    Crea un archivo src/firebase.js con tu configuración de Firebase:
    
    import { initializeApp } from "firebase/app";
    import { getAuth } from "firebase/auth";
    import { getFirestore } from "firebase/firestore";
    import { getDatabase } from "firebase/database";

    const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_AUTH_DOMAIN",
    projectId: "TU_PROJECT_ID",
    storageBucket: "TU_BUCKET",
    messagingSenderId: "TU_SENDER_ID",
    appId: "TU_APP_ID"
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const database = getDatabase(app); 
    ```
4. Inicia la app en modo desarrollo:
    ```
    npm run dev
    ```
📦 Build de Producción
    ```
    npm run build
    ```
    
📄 Licencia

MIT © 2025 - Tomas Tissera