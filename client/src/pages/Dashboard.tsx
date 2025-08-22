import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import clientiService from '../services/clientiService';
import { 
  Users, 
  UserPlus, 
  TrendingUp, 
  Shield,
  Calendar,
  BarChart3
} from 'lucide-react';
import StatsCards from '../components/StatsCards';
import ProvenienzaChart from '../components/ProvenienzaChart';

const Dashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery(
    'clientiStats',
    () => clientiService.getStats(),
    {
      refetchOnWindowFocus: false,
    }
  );

  const { data: clientiData, isLoading: clientiLoading } = useQuery(
    'recentClienti',
    () => clientiService.getClienti({ limit: 5, sortBy: 'dataCreazione', sortOrder: 'DESC' }),
    {
      refetchOnWindowFocus: false,
    }
  );

  return (
    <Container fluid>
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h3 mb-0">Dashboard</h1>
              <p className="text-muted mb-0">
                Benvenuto, {user?.nome} {user?.cognome}
              </p>
            </div>
            <div>
              <Button as={Link} to="/clienti/nuovo" variant="primary" className="me-2">
                <UserPlus size={16} className="me-1" />
                Nuovo Cliente
              </Button>
              <Button as={Link} to="/clienti" variant="outline-primary">
                <Users size={16} className="me-1" />
                Gestisci Clienti
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Stats Cards */}
      {stats && <StatsCards stats={stats} isLoading={statsLoading} />}

      <Row>
        {/* Provenienza Clienti Chart */}
        <Col lg={6} className="mb-4">
          <Card>
            <Card.Header className="d-flex align-items-center">
              <BarChart3 size={20} className="me-2" />
              <h5 className="mb-0">Provenienza Clienti</h5>
            </Card.Header>
            <Card.Body>
              {stats && <ProvenienzaChart data={stats.provenienzaContatto} />}
            </Card.Body>
          </Card>
        </Col>

        {/* Clienti Recenti */}
        <Col lg={6} className="mb-4">
          <Card>
            <Card.Header className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <Calendar size={20} className="me-2" />
                <h5 className="mb-0">Clienti Recenti</h5>
              </div>
              <Button as={Link} to="/clienti" variant="outline-primary" size="sm">
                Vedi tutti
              </Button>
            </Card.Header>
            <Card.Body>
              {clientiLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">Caricamento...</span>
                  </div>
                </div>
              ) : clientiData?.clienti.length ? (
                <div className="list-group list-group-flush">
                  {clientiData.clienti.map((cliente) => (
                    <div key={cliente.clienteId} className="list-group-item border-0 px-0 py-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">
                            {cliente.nome} {cliente.cognome}
                          </h6>
                          <p className="text-muted mb-0 small">{cliente.email}</p>
                          <small className="text-muted">{cliente.provenienzaContatto}</small>
                        </div>
                        <div className="text-end">
                          <small className="text-muted">
                            {new Date(cliente.dataCreazione).toLocaleDateString('it-IT')}
                          </small>
                          <br />
                          <span className={`badge ${cliente.consensoMarketing ? 'bg-success' : 'bg-secondary'}`}>
                            {cliente.consensoMarketing ? 'Marketing OK' : 'No Marketing'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted">
                  <Users size={48} className="mb-3 opacity-50" />
                  <p>Nessun cliente trovato</p>
                  <Button as={Link} to="/clienti/nuovo" variant="primary" size="sm">
                    Aggiungi primo cliente
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Admin Section */}
      {isAdmin() && (
        <Row>
          <Col lg={6} className="mb-4">
            <Card className="border-warning">
              <Card.Header className="bg-warning bg-opacity-10 d-flex align-items-center">
                <Shield size={20} className="me-2 text-warning" />
                <h5 className="mb-0">Area Amministratore</h5>
              </Card.Header>
              <Card.Body>
                <p className="text-muted mb-3">
                  Accedi alle funzioni riservate agli amministratori
                </p>
                <div className="d-grid gap-2">
                  <Button as={Link} to="/password-info" variant="warning">
                    <Shield size={16} className="me-1" />
                    Password e Info Sensibili
                  </Button>
                  <Button as={Link} to="/utenti" variant="secondary">
                    <Users size={16} className="me-1" />
                    Gestione Utenti
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={6} className="mb-4">
            <Card>
              <Card.Header className="d-flex align-items-center">
                <TrendingUp size={20} className="me-2" />
                <h5 className="mb-0">Andamento Mensile</h5>
              </Card.Header>
              <Card.Body>
                {stats?.andamentoMensile && stats.andamentoMensile.length > 0 ? (
                  <div>
                    {stats.andamentoMensile.slice(-6).map((item) => (
                      <div key={item.mese} className="d-flex justify-content-between align-items-center mb-2">
                        <span>{item.mese}</span>
                        <span className="badge bg-primary">{item.count} clienti</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted text-center">Dati non disponibili</p>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default Dashboard;
