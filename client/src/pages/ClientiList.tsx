import React, { useState } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Badge, Pagination } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import clientiService from '../services/clientiService';
import { SearchFilters } from '../types';
import { 
  Search, 
  UserPlus, 
  Edit, 
  Trash2, 
  Eye, 
  Phone, 
  Mail,
  Filter,
  Plus
} from 'lucide-react';
import { toast } from 'react-toastify';

const ClientiList: React.FC = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    provenienzaContatto: '',
    consensoMarketing: '',
    page: 1,
    limit: 20,
    sortBy: 'cognome',
    sortOrder: 'ASC'
  });

  const { data, isLoading, refetch } = useQuery(
    ['clienti', filters],
    () => clientiService.getClienti(filters),
    {
      keepPreviousData: true,
      refetchOnWindowFocus: false,
    }
  );

  const handleFilterChange = (key: keyof SearchFilters, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : (typeof value === 'string' ? parseInt(value) : value) // Reset alla prima pagina se non stiamo cambiando pagina
    }));
  };

  const handleDeleteCliente = async (id: number, nome: string, cognome: string) => {
    if (!isAdmin()) {
      toast.error('Solo gli amministratori possono eliminare clienti');
      return;
    }

    const confirmed = window.confirm(
      `Sei sicuro di voler eliminare il cliente ${nome} ${cognome}? Questa azione non può essere annullata.`
    );

    if (confirmed) {
      try {
        await clientiService.deleteCliente(id);
        toast.success('Cliente eliminato con successo');
        refetch();
      } catch (error) {
        console.error('Errore eliminazione cliente:', error);
        toast.error('Errore durante l\'eliminazione del cliente');
      }
    }
  };

  const getConsensoMarketingBadge = (consenso: boolean) => {
    return consenso ? (
      <Badge bg="success">Marketing OK</Badge>
    ) : (
      <Badge bg="secondary">No Marketing</Badge>
    );
  };

  const renderPagination = () => {
    if (!data?.pagination || data.pagination.total <= 1) return null;

    const { current, total, hasPrev, hasNext } = data.pagination;
    const pages = [];

    // Calcola le pagine da mostrare
    const startPage = Math.max(1, current - 2);
    const endPage = Math.min(total, current + 2);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <Pagination className="justify-content-center">
        <Pagination.First 
          disabled={!hasPrev} 
          onClick={() => handleFilterChange('page', 1)}
        />
        <Pagination.Prev 
          disabled={!hasPrev} 
          onClick={() => handleFilterChange('page', current - 1)}
        />
        
        {startPage > 1 && (
          <>
            <Pagination.Item onClick={() => handleFilterChange('page', 1)}>1</Pagination.Item>
            {startPage > 2 && <Pagination.Ellipsis />}
          </>
        )}

        {pages.map(page => (
          <Pagination.Item
            key={page}
            active={page === current}
            onClick={() => handleFilterChange('page', page)}
          >
            {page}
          </Pagination.Item>
        ))}

        {endPage < total && (
          <>
            {endPage < total - 1 && <Pagination.Ellipsis />}
            <Pagination.Item onClick={() => handleFilterChange('page', total)}>{total}</Pagination.Item>
          </>
        )}

        <Pagination.Next 
          disabled={!hasNext} 
          onClick={() => handleFilterChange('page', current + 1)}
        />
        <Pagination.Last 
          disabled={!hasNext} 
          onClick={() => handleFilterChange('page', total)}
        />
      </Pagination>
    );
  };

  return (
    <Container fluid>
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h3 mb-0">Gestione Clienti</h1>
              <p className="text-muted mb-0">
                {data?.pagination.totalRecords || 0} clienti totali
              </p>
            </div>
                        <Button variant="primary" onClick={() => navigate('/clienti/nuovo')}>
              <Plus className="me-1" />
              Nuovo Cliente
            </Button>
          </div>
        </Col>
      </Row>

      {/* Filtri */}
      <Card className="mb-4">
        <Card.Header>
          <Filter size={16} className="me-1" />
          Filtri di Ricerca
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4} className="mb-3">
              <Form.Label>Ricerca</Form.Label>
              <InputGroup>
                <InputGroup.Text>
                  <Search size={16} />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Nome, cognome, email o telefono..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </InputGroup>
            </Col>
            
            <Col md={3} className="mb-3">
              <Form.Label>Provenienza Contatto</Form.Label>
              <Form.Select
                value={filters.provenienzaContatto}
                onChange={(e) => handleFilterChange('provenienzaContatto', e.target.value)}
              >
                <option value="">Tutte le provenienze</option>
                {clientiService.getProvenienzaContatti().map(provenienza => (
                  <option key={provenienza} value={provenienza}>
                    {provenienza}
                  </option>
                ))}
              </Form.Select>
            </Col>

            <Col md={3} className="mb-3">
              <Form.Label>Consenso Marketing</Form.Label>
              <Form.Select
                value={filters.consensoMarketing}
                onChange={(e) => handleFilterChange('consensoMarketing', e.target.value)}
              >
                <option value="">Tutti</option>
                <option value="true">Con consenso</option>
                <option value="false">Senza consenso</option>
              </Form.Select>
            </Col>

            <Col md={2} className="mb-3">
              <Form.Label>Ordinamento</Form.Label>
              <Form.Select
                value={`${filters.sortBy}_${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('_');
                  handleFilterChange('sortBy', sortBy);
                  handleFilterChange('sortOrder', sortOrder);
                }}
              >
                <option value="cognome_ASC">Cognome A-Z</option>
                <option value="cognome_DESC">Cognome Z-A</option>
                <option value="nome_ASC">Nome A-Z</option>
                <option value="nome_DESC">Nome Z-A</option>
                <option value="dataCreazione_DESC">Più recenti</option>
                <option value="dataCreazione_ASC">Meno recenti</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tabella Clienti */}
      <Card>
        <Card.Body className="p-0">
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Caricamento...</span>
              </div>
              <p className="mt-2 text-muted">Caricamento clienti...</p>
            </div>
          ) : data?.clienti.length ? (
            <>
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead className="table-dark">
                    <tr>
                      <th>Cliente</th>
                      <th>Contatti</th>
                      <th>Località</th>
                      <th>Provenienza</th>
                      <th>Marketing</th>
                      <th>Data Creazione</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.clienti.map((cliente) => (
                      <tr key={cliente.clienteId}>
                        <td>
                          <div>
                            <strong>{cliente.nome} {cliente.cognome}</strong>
                            {cliente.note && (
                              <div className="text-muted small text-truncate" style={{ maxWidth: '200px' }}>
                                {cliente.note}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="small">
                            <div className="d-flex align-items-center mb-1">
                              <Mail size={12} className="me-1" />
                              <a href={`mailto:${cliente.email}`} className="text-decoration-none">
                                {cliente.email}
                              </a>
                            </div>
                            <div className="d-flex align-items-center">
                              <Phone size={12} className="me-1" />
                              <a href={`tel:${cliente.telefono}`} className="text-decoration-none">
                                {cliente.telefono}
                              </a>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="small">
                            {cliente.citta && <div>{cliente.citta}</div>}
                            {cliente.provincia && <div className="text-muted">{cliente.provincia}</div>}
                          </div>
                        </td>
                        <td>
                          <Badge bg="info" className="small">
                            {cliente.provenienzaContatto}
                          </Badge>
                        </td>
                        <td>
                          {getConsensoMarketingBadge(cliente.consensoMarketing)}
                        </td>
                        <td className="small text-muted">
                          {new Date(cliente.dataCreazione).toLocaleDateString('it-IT')}
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <Button
                              as={Link}
                              to={`/clienti/${cliente.clienteId}`}
                              variant="outline-primary"
                              size="sm"
                              title="Visualizza dettagli"
                            >
                              <Eye size={14} />
                            </Button>
                            <Button
                              as={Link}
                              to={`/clienti/${cliente.clienteId}/modifica`}
                              variant="outline-warning"
                              size="sm"
                              title="Modifica cliente"
                            >
                              <Edit size={14} />
                            </Button>
                            {isAdmin() && (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                title="Elimina cliente"
                                onClick={() => handleDeleteCliente(
                                  cliente.clienteId, 
                                  cliente.nome, 
                                  cliente.cognome
                                )}
                              >
                                <Trash2 size={14} />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              
              {/* Paginazione */}
              <div className="p-3 border-top">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="text-muted small">
                    Visualizzati {data.clienti.length} di {data.pagination.totalRecords} clienti
                  </div>
                  {renderPagination()}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-5">
              <div className="text-muted">
                <Search size={48} className="mb-3 opacity-50" />
                <h5>Nessun cliente trovato</h5>
                <p>Prova a modificare i filtri di ricerca o aggiungi un nuovo cliente.</p>
                <Button as={Link} to="/clienti/nuovo" variant="primary">
                  <UserPlus size={16} className="me-1" />
                  Aggiungi Cliente
                </Button>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ClientiList;
