// src/pages/Dashboard.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const { role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && role) {
      switch (role) {
        case 'mesero':
          navigate('/mesero-dashboard');
          break;
        case 'cocinero':
          navigate('/cocinero-dashboard');
          break;
        case 'gerente':
          navigate('/gerente-dashboard');
          break;
        default:
          // Manejar roles desconocidos o redirigir a una página de error
          navigate('/');
          break;
      }
    }
  }, [role, loading, navigate]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <h2>Redirigiendo...</h2>
    </div>
  );
};

export default Dashboard;