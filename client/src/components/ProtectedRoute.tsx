import React, { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Alert } from 'react-bootstrap';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireOperatorOrAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false,
  requireOperatorOrAdmin = false 
}) => {
  const { user, isAdmin } = useAuth();

  if (!user) {
    return (
      <Alert variant="danger" className="alert-custom">
        <Alert.Heading>Accesso negato</Alert.Heading>
        <p>Devi effettuare il login per accedere a questa pagina.</p>
      </Alert>
    );
  }

  if (requireAdmin && !isAdmin()) {
    return (
      <Alert variant="warning" className="alert-custom">
        <Alert.Heading>Accesso riservato</Alert.Heading>
        <p>
          Questa sezione è riservata agli amministratori. 
          Il tuo ruolo attuale è: <strong>{user.ruolo}</strong>
        </p>
      </Alert>
    );
  }

  if (requireOperatorOrAdmin && !['Operatore', 'Amministratore'].includes(user.ruolo)) {
    return (
      <Alert variant="warning" className="alert-custom">
        <Alert.Heading>Accesso riservato</Alert.Heading>
        <p>
          Questa sezione è riservata agli operatori e amministratori. 
          Il tuo ruolo attuale è: <strong>{user.ruolo}</strong>
        </p>
      </Alert>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
