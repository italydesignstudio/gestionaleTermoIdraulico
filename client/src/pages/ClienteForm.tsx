import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProvenienzaContatto, ClienteFormData } from '../types';
import clientiService from '../services/clientiService';
import { toast } from 'react-toastify';

const ClienteForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<ClienteFormData>({
    nome: '',
    cognome: '',
    codiceFiscale: '',
    email: '',
    telefono: '',
    indirizzo: '',
    citta: '',
    cap: '',
    provincia: '',
    provenienzaContatto: 'Altro' as ProvenienzaContatto,
    consensoPrivacy: false,
    consensoMarketing: false,
    note: ''
  });

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditing);

  const provenienzaOptions = [
    'Passaparola',
    'Google',
    'Facebook',
    'Instagram',
    'Volantino',
    'Giornale',
    'Radio',
    'TV',
    'Sito web',
    'Cliente esistente',
    'Altro'
  ];

  const provincieItaliane = [
    'AG', 'AL', 'AN', 'AO', 'AR', 'AP', 'AT', 'AV', 'BA', 'BT', 'BL', 'BN', 'BG', 'BI', 'BO', 'BZ',
    'BS', 'BR', 'CA', 'CL', 'CB', 'CI', 'CE', 'CT', 'CZ', 'CH', 'CO', 'CS', 'CR', 'KR', 'CN', 'EN',
    'FM', 'FE', 'FI', 'FG', 'FC', 'FR', 'GE', 'GO', 'GR', 'IM', 'IS', 'SP', 'AQ', 'LT', 'LE', 'LC',
    'LI', 'LO', 'LU', 'MC', 'MN', 'MS', 'MT', 'ME', 'MI', 'MO', 'MB', 'NA', 'NO', 'NU', 'OT', 'OR',
    'PD', 'PA', 'PR', 'PV', 'PG', 'PU', 'PE', 'PC', 'PI', 'PT', 'PN', 'PZ', 'PO', 'RG', 'RA', 'RC',
    'RE', 'RI', 'RN', 'RM', 'RO', 'SA', 'VS', 'SS', 'SV', 'SI', 'SR', 'SO', 'TA', 'TE', 'TR', 'TO',
    'OG', 'TP', 'TN', 'TV', 'TS', 'UD', 'VA', 'VE', 'VB', 'VC', 'VR', 'VV', 'VI', 'VT'
  ];

  useEffect(() => {
    console.log('ClienteForm - ID ricevuto:', id, 'tipo:', typeof id, 'isEditing:', isEditing);
    if (isEditing && id && id !== 'undefined') {
      loadCliente();
    } else if (isEditing && (!id || id === 'undefined')) {
      console.error('ID cliente non valido per modifica:', id);
      toast.error('ID cliente non valido');
      navigate('/clienti');
    }
  }, [id, isEditing]);

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
      setLoadingData(true);
      const cliente = await clientiService.getById(clienteId);
      setFormData({
        nome: cliente.nome || '',
        cognome: cliente.cognome || '',
        codiceFiscale: (cliente as any).codiceFiscale || (cliente as any).codicefiscale || '',
        email: cliente.email || '',
        telefono: cliente.telefono || '',
        indirizzo: cliente.indirizzo || '',
        citta: cliente.citta || '',
        cap: cliente.cap || '',
        provincia: cliente.provincia || '',
        provenienzaContatto: cliente.provenienzaContatto || 'Altro',
        consensoPrivacy: Boolean(cliente.consensoPrivacy),
        consensoMarketing: Boolean(cliente.consensoMarketing),
        note: cliente.note || ''
      });
    } catch (error) {
      console.error('Errore nel caricamento del cliente:', error);
      toast.error('Errore nel caricamento dei dati del cliente');
      navigate('/clienti');
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.consensoPrivacy) {
      toast.error('Il consenso alla privacy è obbligatorio');
      return;
    }

    try {
      setLoading(true);
      
      if (isEditing && id) {
        const clienteId = parseInt(id);
        if (isNaN(clienteId)) {
          toast.error('ID cliente non valido');
          navigate('/clienti');
          return;
        }
        await clientiService.update(clienteId, formData);
        toast.success('Cliente aggiornato con successo');
      } else {
        await clientiService.create(formData);
        toast.success('Cliente creato con successo');
      }
      
      navigate('/clienti');
    } catch (error: any) {
      console.error('Errore nel salvataggio:', error);
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      console.error('Form data inviato:', formData);
      
      const message = error.response?.data?.message || error.response?.data?.error || 'Errore nel salvataggio del cliente';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
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

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">
                {isEditing ? 'Modifica Cliente' : 'Nuovo Cliente'}
              </h5>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => navigate('/clienti')}
              >
                <i className="fas fa-arrow-left me-2"></i>
                Torna alla lista
              </button>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row">
                  {/* Informazioni di base */}
                  <div className="col-12">
                    <h6 className="text-primary mb-3">
                      <i className="fas fa-user me-2"></i>
                      Informazioni di base
                    </h6>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label htmlFor="nome" className="form-label">
                      Nome <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      id="nome"
                      name="nome"
                      className="form-control"
                      value={formData.nome}
                      onChange={handleInputChange}
                      required
                      maxLength={100}
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="cognome" className="form-label">
                      Cognome <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      id="cognome"
                      name="cognome"
                      className="form-control"
                      value={formData.cognome}
                      onChange={handleInputChange}
                      required
                      maxLength={100}
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="codiceFiscale" className="form-label">
                      Codice Fiscale
                    </label>
                    <input
                      type="text"
                      id="codiceFiscale"
                      name="codiceFiscale"
                      className="form-control"
                      value={formData.codiceFiscale}
                      onChange={handleInputChange}
                      maxLength={16}
                      placeholder="RSSMRA80A01H501U (opzionale)"
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="email" className="form-label">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="form-control"
                      value={formData.email}
                      onChange={handleInputChange}
                      maxLength={255}
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="telefono" className="form-label">Telefono</label>
                    <input
                      type="tel"
                      id="telefono"
                      name="telefono"
                      className="form-control"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      required
                      maxLength={20}
                      placeholder="+39 123 456 7890"
                    />
                  </div>

                  {/* Indirizzo */}
                  <div className="col-12 mt-4">
                    <h6 className="text-primary mb-3">
                      <i className="fas fa-map-marker-alt me-2"></i>
                      Indirizzo
                    </h6>
                  </div>

                  <div className="col-md-8 mb-3">
                    <label htmlFor="indirizzo" className="form-label">Indirizzo</label>
                    <input
                      type="text"
                      id="indirizzo"
                      name="indirizzo"
                      className="form-control"
                      value={formData.indirizzo}
                      onChange={handleInputChange}
                      maxLength={255}
                      placeholder="Via/Piazza Nome Numero"
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label htmlFor="cap" className="form-label">CAP</label>
                    <input
                      type="text"
                      id="cap"
                      name="cap"
                      className="form-control"
                      value={formData.cap}
                      onChange={handleInputChange}
                      maxLength={5}
                      pattern="[0-9]{5}"
                      placeholder="12345"
                    />
                  </div>

                  <div className="col-md-8 mb-3">
                    <label htmlFor="citta" className="form-label">Città</label>
                    <input
                      type="text"
                      id="citta"
                      name="citta"
                      className="form-control"
                      value={formData.citta}
                      onChange={handleInputChange}
                      maxLength={100}
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label htmlFor="provincia" className="form-label">Provincia</label>
                    <select
                      id="provincia"
                      name="provincia"
                      className="form-select"
                      value={formData.provincia}
                      onChange={handleInputChange}
                    >
                      <option value="">Seleziona...</option>
                      {provincieItaliane.map(provincia => (
                        <option key={provincia} value={provincia}>{provincia}</option>
                      ))}
                    </select>
                  </div>

                  {/* Marketing e Consensi */}
                  <div className="col-12 mt-4">
                    <h6 className="text-primary mb-3">
                      <i className="fas fa-handshake me-2"></i>
                      Marketing e Consensi
                    </h6>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="provenienzaContatto" className="form-label">
                      Provenienza Contatto
                    </label>
                    <select
                      id="provenienzaContatto"
                      name="provenienzaContatto"
                      className="form-select"
                      value={formData.provenienzaContatto}
                      onChange={handleInputChange}
                    >
                      <option value="">Seleziona...</option>
                      {provenienzaOptions.map(opzione => (
                        <option key={opzione} value={opzione}>{opzione}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Consensi</label>
                    <div className="mt-2">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          id="consensoPrivacy"
                          name="consensoPrivacy"
                          className="form-check-input"
                          checked={formData.consensoPrivacy}
                          onChange={handleInputChange}
                          required
                        />
                        <label htmlFor="consensoPrivacy" className="form-check-label">
                          Consenso Privacy <span className="text-danger">*</span>
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          type="checkbox"
                          id="consensoMarketing"
                          name="consensoMarketing"
                          className="form-check-input"
                          checked={formData.consensoMarketing}
                          onChange={handleInputChange}
                        />
                        <label htmlFor="consensoMarketing" className="form-check-label">
                          Consenso Marketing
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Note */}
                  <div className="col-12 mt-4">
                    <h6 className="text-primary mb-3">
                      <i className="fas fa-sticky-note me-2"></i>
                      Note aggiuntive
                    </h6>
                  </div>

                  <div className="col-12 mb-3">
                    <label htmlFor="note" className="form-label">Note</label>
                    <textarea
                      id="note"
                      name="note"
                      className="form-control"
                      rows={4}
                      value={formData.note}
                      onChange={handleInputChange}
                      maxLength={1000}
                      placeholder="Note aggiuntive sul cliente..."
                    />
                    <div className="form-text">
                      {(formData.note || '').length}/1000 caratteri
                    </div>
                  </div>
                </div>

                <hr />

                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate('/clienti')}
                    disabled={loading}
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Salvataggio...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        {isEditing ? 'Aggiorna Cliente' : 'Crea Cliente'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClienteForm;
