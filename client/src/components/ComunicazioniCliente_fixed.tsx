import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Row, Col, Badge, InputGroup, Alert, Table } from 'react-bootstrap';
import { MessageSquare, Plus, X, Search, Filter, Phone, Mail, Trash2, Eye } from 'lucide-react';
import { 
  ComunicazioneCliente, 
  TipoComunicazione, 
  Priorita, 
  ComunicazioneFormData 
} from '../types';
import { comunicazioniService } from '../services/comunicazioniService';
import { toast } from 'react-toastify';

interface ComunicazioniClienteProps {
  clienteId: number;
  nomeCliente: string;
  telefono?: string;
  email?: string;
}

const ComunicazioniCliente: React.FC<ComunicazioniClienteProps> = ({ 
  clienteId, 
  nomeCliente, 
  telefono, 
  email 
}) => {
  const [comunicazioni, setComunicazioni] = useState<ComunicazioneCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<ComunicazioneFormData>({
    tipoComunicazione: 'Nota',
    oggetto: '',
    contenuto: '',
    priorita: 'Media'
  });
  const [filtroTipo, setFiltroTipo] = useState<TipoComunicazione | 'Tutti'>('Tutti');
  const [filtroPriorita, setFiltroPriorita] = useState<Priorita | 'Tutte'>('Tutte');
  const [searchTerm, setSearchTerm] = useState('');

  const tipiComunicazione: TipoComunicazione[] = [
    'Chiamata', 'WhatsApp', 'Email', 'SMS', 'Nota', 'Promemoria', 'Altro'
  ];

  const priorita: Priorita[] = ['Bassa', 'Media', 'Alta', 'Urgente'];

  useEffect(() => {
    loadComunicazioni();
  }, [clienteId]);

  const loadComunicazioni = async () => {
    try {
      setLoading(true);
      const data = await comunicazioniService.getComunicazioniCliente(clienteId);
      setComunicazioni(data);
    } catch (error) {
      console.error('Errore nel caricamento comunicazioni:', error);
      toast.error('Errore nel caricamento delle comunicazioni');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.contenuto.trim()) {
      toast.error('Il contenuto è obbligatorio');
      return;
    }

    try {
      await comunicazioniService.createComunicazione(clienteId, formData);
      toast.success('Comunicazione aggiunta con successo');
      
      // Reset form
      setFormData({
        tipoComunicazione: 'Nota',
        oggetto: '',
        contenuto: '',
        priorita: 'Media'
      });
      setShowForm(false);
      
      // Ricarica lista
      loadComunicazioni();
    } catch (error) {
      console.error('Errore creazione comunicazione:', error);
      toast.error('Errore nella creazione della comunicazione');
    }
  };

  const handleMarkAsRead = async (comunicazioneId: number) => {
    try {
      await comunicazioniService.markAsRead(comunicazioneId);
      setComunicazioni(prev => 
        prev.map(c => 
          c.comunicazioneId === comunicazioneId 
            ? { ...c, statoLettura: true }
            : c
        )
      );
    } catch (error) {
      console.error('Errore aggiornamento lettura:', error);
      toast.error('Errore nell\'aggiornamento dello stato');
    }
  };

  const handleDelete = async (comunicazioneId: number) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa comunicazione?')) return;

    try {
      await comunicazioniService.deleteComunicazione(comunicazioneId);
      toast.success('Comunicazione eliminata');
      loadComunicazioni();
    } catch (error) {
      console.error('Errore eliminazione:', error);
      toast.error('Errore nell\'eliminazione della comunicazione');
    }
  };

  const handleWhatsApp = () => {
    if (telefono) {
      const url = `https://wa.me/${telefono.replace(/[^0-9]/g, '')}`;
      window.open(url, '_blank');
    }
  };

  const handleCall = () => {
    if (telefono) {
      window.location.href = `tel:${telefono}`;
    }
  };

  const handleEmail = () => {
    if (email) {
      window.location.href = `mailto:${email}`;
    }
  };

  const comunicazioniFiltered = comunicazioni.filter(com => {
    const matchesTipo = filtroTipo === 'Tutti' || com.tipoComunicazione === filtroTipo;
    const matchesPriorita = filtroPriorita === 'Tutte' || com.priorita === filtroPriorita;
    const matchesSearch = searchTerm === '' || 
      com.oggetto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      com.contenuto.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesTipo && matchesPriorita && matchesSearch;
  });

  const getPrioritaBadge = (priorita: Priorita) => {
    const variants = {
      'Bassa': 'secondary',
      'Media': 'info',
      'Alta': 'warning',
      'Urgente': 'danger'
    };
    return <Badge bg={variants[priorita]}>{priorita}</Badge>;
  };

  const comunicazioniNonLette = comunicazioni.filter(c => !c.statoLettura).length;

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center p-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Caricamento...</span>
        </div>
      </div>
    );
  }

  return (
    <Card className="mb-4">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <MessageSquare size={20} className="me-2 text-primary" />
          <h5 className="mb-0">Comunicazioni con {nomeCliente}</h5>
          {comunicazioniNonLette > 0 && (
            <Badge bg="danger" className="ms-2">
              {comunicazioniNonLette} non lette
            </Badge>
          )}
        </div>
        <Button
          variant={showForm ? "outline-secondary" : "primary"}
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="d-flex align-items-center"
        >
          {showForm ? <X size={16} className="me-1" /> : <Plus size={16} className="me-1" />}
          {showForm ? 'Annulla' : 'Nuova Comunicazione'}
        </Button>
      </Card.Header>

      <Card.Body>
        {/* Pulsanti azioni rapide */}
        <div className="d-flex flex-wrap gap-2 mb-3">
          {telefono && (
            <>
              <Button
                variant="success"
                size="sm"
                onClick={handleWhatsApp}
                className="d-flex align-items-center"
              >
                💬 WhatsApp
              </Button>
              <Button
                variant="info"
                size="sm"
                onClick={handleCall}
                className="d-flex align-items-center"
              >
                <Phone size={16} className="me-1" />
                Chiama
              </Button>
            </>
          )}
          {email && (
            <Button
              variant="warning"
              size="sm"
              onClick={handleEmail}
              className="d-flex align-items-center"
            >
              <Mail size={16} className="me-1" />
              Email
            </Button>
          )}
        </div>

        {/* Form nuova comunicazione */}
        {showForm && (
          <Card className="mb-4 border-primary">
            <Card.Body className="bg-light">
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tipo *</Form.Label>
                      <Form.Select
                        value={formData.tipoComunicazione}
                        onChange={(e) => setFormData({...formData, tipoComunicazione: e.target.value as TipoComunicazione})}
                        required
                      >
                        {tipiComunicazione.map(tipo => (
                          <option key={tipo} value={tipo}>
                            {comunicazioniService.getTipoIcon(tipo)} {tipo}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Priorità</Form.Label>
                      <Form.Select
                        value={formData.priorita}
                        onChange={(e) => setFormData({...formData, priorita: e.target.value as Priorita})}
                      >
                        {priorita.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Oggetto</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.oggetto}
                        onChange={(e) => setFormData({...formData, oggetto: e.target.value})}
                        placeholder="Oggetto della comunicazione"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Contenuto *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={formData.contenuto}
                    onChange={(e) => setFormData({...formData, contenuto: e.target.value})}
                    placeholder="Contenuto della comunicazione..."
                    required
                  />
                </Form.Group>

                <div className="d-flex gap-2">
                  <Button
                    type="submit"
                    variant="success"
                    className="d-flex align-items-center"
                  >
                    <Plus size={16} className="me-1" />
                    Aggiungi Comunicazione
                  </Button>
                  <Button
                    type="button"
                    variant="outline-secondary"
                    onClick={() => {
                      setShowForm(false);
                      setFormData({
                        tipoComunicazione: 'Nota',
                        oggetto: '',
                        contenuto: '',
                        priorita: 'Media'
                      });
                    }}
                  >
                    Annulla
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        )}

        {/* Filtri */}
        <Row className="mb-3">
          <Col md={4}>
            <Form.Group>
              <Form.Label>Cerca comunicazioni</Form.Label>
              <InputGroup>
                <InputGroup.Text>
                  <Search size={16} />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Cerca per oggetto o contenuto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Form.Label>Filtra per tipo</Form.Label>
              <Form.Select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value as TipoComunicazione | 'Tutti')}
              >
                <option value="Tutti">Tutti i tipi</option>
                {tipiComunicazione.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Form.Label>Filtra per priorità</Form.Label>
              <Form.Select
                value={filtroPriorita}
                onChange={(e) => setFiltroPriorita(e.target.value as Priorita | 'Tutte')}
              >
                <option value="Tutte">Tutte le priorità</option>
                {priorita.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        {/* Lista comunicazioni */}
        {comunicazioniFiltered.length === 0 ? (
          <Alert variant="info" className="text-center">
            <MessageSquare size={48} className="mb-3 opacity-50" />
            <h6>Nessuna comunicazione trovata</h6>
            <p className="mb-0">Non ci sono comunicazioni per questo cliente o nessuna comunicazione corrisponde ai filtri selezionati.</p>
          </Alert>
        ) : (
          <div className="table-responsive">
            <Table hover>
              <thead className="table-dark">
                <tr>
                  <th>Comunicazione</th>
                  <th>Tipo</th>
                  <th>Priorità</th>
                  <th>Data</th>
                  <th>Stato</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {comunicazioniFiltered.map((comunicazione) => (
                  <tr key={comunicazione.comunicazioneId} className={!comunicazione.statoLettura ? 'table-warning' : ''}>
                    <td>
                      <div>
                        {comunicazione.oggetto && <strong>{comunicazione.oggetto}</strong>}
                        <div className="text-truncate" style={{ maxWidth: '300px' }}>
                          {comunicazione.contenuto}
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge bg="info">
                        {comunicazioniService.getTipoIcon(comunicazione.tipoComunicazione)} {comunicazione.tipoComunicazione}
                      </Badge>
                    </td>
                    <td>
                      {getPrioritaBadge(comunicazione.priorita)}
                    </td>
                    <td className="small text-muted">
                      {new Date(comunicazione.dataCreazione).toLocaleString('it-IT')}
                    </td>
                    <td>
                      {comunicazione.statoLettura ? (
                        <Badge bg="success">Letta</Badge>
                      ) : (
                        <Badge bg="warning">Non letta</Badge>
                      )}
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        {!comunicazione.statoLettura && (
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => handleMarkAsRead(comunicazione.comunicazioneId)}
                            title="Segna come letta"
                          >
                            <Eye size={14} />
                          </Button>
                        )}
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(comunicazione.comunicazioneId)}
                          title="Elimina comunicazione"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default ComunicazioniCliente;
