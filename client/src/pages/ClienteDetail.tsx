import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Cliente } from '../types';
import clientiService from '../services/clientiService';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import DocumentiCliente from '../components/DocumentiCliente';
import ComunicazioniCliente from '../components/ComunicazioniCliente';

const ClienteDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadCliente();
    }
  }, [id]);

  const loadCliente = async () => {
    if (!id) return;
    
    // Validate that id is a valid number
    const clienteId = parseInt(id);
    if (isNaN(clienteId)) {
      console.error('ID cliente non valido:', id);
      toast.error('ID cliente non valido');
      navigate('/clienti');
      return;
    }
    
    try {
      setLoading(true);
      const clienteData = await clientiService.getById(clienteId);
      setCliente(clienteData);
    } catch (error) {
      console.error('Errore nel caricamento del cliente:', error);
      toast.error('Errore nel caricamento dei dati del cliente');
      navigate('/clienti');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!cliente || !id) return;
    
    const confirmed = window.confirm(`Sei sicuro di voler eliminare il cliente ${cliente.nome} ${cliente.cognome}?`);
    if (!confirmed) return;

    try {
      await clientiService.delete(parseInt(id));
      toast.success('Cliente eliminato con successo');
      navigate('/clienti');
    } catch (error) {
      console.error('Errore nell\'eliminazione del cliente:', error);
      toast.error('Errore nell\'eliminazione del cliente');
    }
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Caricamento...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger">
          Cliente non trovato
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">
                <i className="fas fa-user me-2"></i>
                {cliente.nome} {cliente.cognome}
              </h5>
              <div className="btn-group">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => navigate('/clienti')}
                >
                  <i className="fas fa-arrow-left me-2"></i>
                  Torna alla lista
                </button>
                <Link
                  to={`/clienti/${cliente.clienteId}/modifica`}
                  className="btn btn-primary"
                >
                  <i className="fas fa-edit me-2"></i>
                  Modifica
                </Link>
                {user?.ruolo === 'Amministratore' && (
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleDelete}
                  >
                    <i className="fas fa-trash me-2"></i>
                    Elimina
                  </button>
                )}
              </div>
            </div>
            <div className="card-body">
              <div className="row">
                {/* Informazioni di base */}
                <div className="col-12">
                  <h6 className="text-primary mb-3">
                    <i className="fas fa-user me-2"></i>
                    Informazioni di base
                  </h6>
                </div>
                
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Nome</label>
                  <p className="form-control-plaintext">{cliente.nome}</p>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Cognome</label>
                  <p className="form-control-plaintext">{cliente.cognome}</p>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Email</label>
                  <p className="form-control-plaintext">
                    <a href={`mailto:${cliente.email}`} className="text-decoration-none">
                      {cliente.email}
                    </a>
                  </p>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Telefono</label>
                  <p className="form-control-plaintext">
                    {cliente.telefono ? (
                      <a href={`tel:${cliente.telefono}`} className="text-decoration-none">
                        {cliente.telefono}
                      </a>
                    ) : (
                      <span className="text-muted">Non specificato</span>
                    )}
                  </p>
                </div>

                {/* Indirizzo */}
                {(cliente.indirizzo || cliente.citta || cliente.cap || cliente.provincia) && (
                  <>
                    <div className="col-12 mt-4">
                      <h6 className="text-primary mb-3">
                        <i className="fas fa-map-marker-alt me-2"></i>
                        Indirizzo
                      </h6>
                    </div>

                    <div className="col-md-8 mb-3">
                      <label className="form-label fw-bold">Indirizzo</label>
                      <p className="form-control-plaintext">
                        {cliente.indirizzo || <span className="text-muted">Non specificato</span>}
                      </p>
                    </div>

                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-bold">CAP</label>
                      <p className="form-control-plaintext">
                        {cliente.cap || <span className="text-muted">Non specificato</span>}
                      </p>
                    </div>

                    <div className="col-md-8 mb-3">
                      <label className="form-label fw-bold">Città</label>
                      <p className="form-control-plaintext">
                        {cliente.citta || <span className="text-muted">Non specificata</span>}
                      </p>
                    </div>

                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-bold">Provincia</label>
                      <p className="form-control-plaintext">
                        {cliente.provincia || <span className="text-muted">Non specificata</span>}
                      </p>
                    </div>
                  </>
                )}

                {/* Marketing e Consensi */}
                <div className="col-12 mt-4">
                  <h6 className="text-primary mb-3">
                    <i className="fas fa-handshake me-2"></i>
                    Marketing e Consensi
                  </h6>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Provenienza Contatto</label>
                  <p className="form-control-plaintext">
                    {cliente.provenienzaContatto || <span className="text-muted">Non specificata</span>}
                  </p>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Consensi</label>
                  <div className="mt-2">
                    <div className="mb-2">
                      <span className={`badge ${cliente.consensoPrivacy ? 'bg-success' : 'bg-danger'}`}>
                        <i className={`fas ${cliente.consensoPrivacy ? 'fa-check' : 'fa-times'} me-1`}></i>
                        Consenso Privacy
                      </span>
                    </div>
                    <div>
                      <span className={`badge ${cliente.consensoMarketing ? 'bg-success' : 'bg-secondary'}`}>
                        <i className={`fas ${cliente.consensoMarketing ? 'fa-check' : 'fa-times'} me-1`}></i>
                        Consenso Marketing
                      </span>
                    </div>
                  </div>
                </div>

                {/* Note */}
                {cliente.note && (
                  <>
                    <div className="col-12 mt-4">
                      <h6 className="text-primary mb-3">
                        <i className="fas fa-sticky-note me-2"></i>
                        Note
                      </h6>
                    </div>

                    <div className="col-12 mb-3">
                      <div className="bg-light p-3 rounded">
                        {cliente.note}
                      </div>
                    </div>
                  </>
                )}

                {/* Informazioni sistema */}
                <div className="col-12 mt-4">
                  <h6 className="text-primary mb-3">
                    <i className="fas fa-info-circle me-2"></i>
                    Informazioni sistema
                  </h6>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Data creazione</label>
                  <p className="form-control-plaintext">
                    {new Date(cliente.dataCreazione).toLocaleString('it-IT')}
                  </p>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Ultima modifica</label>
                  <p className="form-control-plaintext">
                    {new Date(cliente.dataModifica).toLocaleString('it-IT')}
                  </p>
                </div>

                {cliente.nomeUtenteCreazione && (
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Creato da</label>
                    <p className="form-control-plaintext">
                      {cliente.nomeUtenteCreazione} {cliente.cognomeUtenteCreazione}
                    </p>
                  </div>
                )}

                {cliente.nomeUtenteModifica && (
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Modificato da</label>
                    <p className="form-control-plaintext">
                      {cliente.nomeUtenteModifica} {cliente.cognomeUtenteModifica}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sezione Documenti */}
      <div className="row mt-4">
        <div className="col-12">
          <DocumentiCliente 
            clienteId={cliente.clienteId} 
            nomeCliente={`${cliente.nome} ${cliente.cognome}`} 
          />
        </div>
      </div>

      {/* Sezione Comunicazioni */}
      <div className="row mt-4">
        <div className="col-12">
          <ComunicazioniCliente 
            clienteId={cliente.clienteId} 
            nomeCliente={`${cliente.nome} ${cliente.cognome}`}
            telefono={cliente.telefono || undefined}
            email={cliente.email}
          />
        </div>
      </div>
    </div>
  );
};

export default ClienteDetail;
