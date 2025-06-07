// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';

// Páginas
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import MeseroDashboard from './pages/MeseroDashboard';
import CocineroDashboard from './pages/CocineroDashboard';
import GerenteDashboard from './pages/GerenteDashboard';
import NotFoundPage from './pages/NotFoundPage';
import MesasDashboard from './pages/MesasDashboard'
import PedidosDashboard from './pages/PedidosDashboard'
import Categorias from './components/categorias/categorias';
import Productos from './components/Productos/Productos';
import DashboardGerentePerformance from './components/DashboardGerentePerformance';
// **Importa el CSS aquí**
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <div className="container"> {/* Agrega un contenedor para centrar el contenido */}
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/mesero-dashboard"
              element={
                <PrivateRoute allowedRoles={['mesero', 'gerente']}>
                  <MeseroDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/mesas"
              element={
                <PrivateRoute allowedRoles={['mesero', 'gerente']}>
                  <MesasDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/pedidos"
              element={
                <PrivateRoute allowedRoles={['mesero', 'gerente']}>
                  <PedidosDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/categorias"
              element={
                <PrivateRoute allowedRoles={['gerente']}>
                  <Categorias />
                </PrivateRoute>
              }
            />
            <Route
              path="/productos"
              element={
                <PrivateRoute allowedRoles={['gerente']}>
                  <Productos />
                </PrivateRoute>
              }
            />
            <Route
              path="/gestion-empleados"
              element={
                <PrivateRoute allowedRoles={['gerente']}>
                  <DashboardGerentePerformance />
                </PrivateRoute>
              }
            />
            <Route
              path="/cocinero-dashboard"
              element={
                <PrivateRoute allowedRoles={['cocinero', 'gerente']}>
                  <CocineroDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/gerente-dashboard"
              element={
                <PrivateRoute allowedRoles={['gerente']}>
                  <GerenteDashboard />
                </PrivateRoute>
              }
            />

            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;