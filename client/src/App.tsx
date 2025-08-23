import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ClientiList from './pages/ClientiList';
import ClienteDetail from './pages/ClienteDetail';
import ClienteForm from './pages/ClienteForm';
import PasswordInfo from './pages/PasswordInfo';
import GestioneUtenti from './pages/GestioneUtenti';
import ProtectedRoute from './components/ProtectedRoute';
import { Spinner } from 'react-bootstrap';

const App: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="text-center">
          <Spinner animation="border" role="status" />
          <div className="mt-2">Caricamento...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Routes clienti */}
        <Route path="/clienti" element={<ClientiList />} />
        <Route path="/clienti/nuovo" element={<ClienteForm />} />
        <Route path="/clienti/:id" element={<ClienteDetail />} />
        <Route path="/clienti/:id/modifica" element={<ClienteForm />} />
        
        {/* Routes operatori e admin */}
        <Route 
          path="/password-info" 
          element={
            <ProtectedRoute requireOperatorOrAdmin>
              <PasswordInfo />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/utenti" 
          element={
            <ProtectedRoute requireAdmin>
              <GestioneUtenti />
            </ProtectedRoute>
          } 
        />
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </Layout>
  );
};

export default App;
