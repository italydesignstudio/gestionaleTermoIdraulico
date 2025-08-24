import React, { useState, useEffect } from 'react';
import { PasswordInfo, PasswordInfoFormData, CategoriaPassword } from '../types';
import passwordInfoService from '../services/passwordInfoService';
import { toast } from 'react-toastify';
import { Shield, Plus, Save, Edit, Trash2, Eye, EyeOff, Globe, Mail, User, Key, Code, FileText, StickyNote, Filter, X } from 'lucide-react';

const CATEGORIE: CategoriaPassword[] = [
  'Termoidraulica', 'Email', 'Software', 'PA_Fiscale', 'E-commerce', 
  'Servizi_Web', 'Fornitori', 'Bancario', 'Social', 'Altro'
];

const PasswordInfoPage: React.FC = () => {
  const [passwordInfos, setPasswordInfos] = useState<PasswordInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInfo, setEditingInfo] = useState<PasswordInfo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoriaPassword | 'Tutti'>('Tutti');
  const [revealingId, setRevealingId] = useState<number | null>(null);
  const [selectedInfo, setSelectedInfo] = useState<PasswordInfo | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  const [formData, setFormData] = useState<PasswordInfoFormData>({
    titolo: '',
    categoria: 'Altro',
    url: '',
    username: '',
    email: '',
    password: '',
    codici: '',
    descrizione: '',
    note: ''
  });

  const getCategoryColor = (categoria: string): string => {
    const colors: Record<string, string> = {
      'Termoidraulica': 'primary',
      'Email': 'success',
      'Software': 'info',
      'PA_Fiscale': 'warning',
      'E-commerce': 'danger',
      'Servizi_Web': 'secondary',
      'Fornitori': 'dark',
      'Bancario': 'success',
      'Social': 'info',
      'Altro': 'dark'
    };
    return colors[categoria] || 'dark';
  };

  const handleShowDetails = (info: PasswordInfo) => {
    setSelectedInfo(info);
    setShowDetailsModal(true);
  };

  const loadPasswordInfos = async () => {
    try {
      setLoading(true);
      const data = await passwordInfoService.getAll();
      console.log('Dati caricati:', data); // Per debug
      setPasswordInfos(data || []);
    } catch (error: any) {
      console.error('Errore nel caricamento delle informazioni:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Errore nel caricamento delle informazioni';
      toast.error(errorMessage);
      setPasswordInfos([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      titolo: '',
      categoria: 'Altro',
      url: '',
      username: '',
      email: '',
      password: '',
      codici: '',
      descrizione: '',
      note: ''
    });
    setEditingInfo(null);
    setShowForm(false);
  };

  const handleEdit = (info: PasswordInfo) => {
    setFormData({
      titolo: info.titolo,
      categoria: info.categoria || 'Altro',
      url: info.url || '',
      username: info.username || '',
      email: info.email || '',
      password: info.password || '',
      codici: info.codici || '',
      descrizione: info.descrizione || '',
      note: info.note || ''
    });
    setEditingInfo(info);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titolo.trim() || !formData.password.trim()) {
      toast.error('Titolo e password sono obbligatori');
      return;
    }
    
    try {
      if (editingInfo) {
        await passwordInfoService.update(editingInfo.infoId, formData);
        toast.success('Informazione aggiornata con successo');
      } else {
        await passwordInfoService.create(formData);
        toast.success('Informazione creata con successo');
      }
      
      await loadPasswordInfos();
      resetForm();
    } catch (error: any) {
      console.error('Errore nella gestione del form:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Errore nella gestione del form';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (infoId: number) => {
    if (!confirm('Sei sicuro di voler eliminare questa informazione?')) {
      return;
    }
    
    try {
      await passwordInfoService.delete(infoId);
      toast.success('Informazione eliminata con successo');
      await loadPasswordInfos();
    } catch (error: any) {
      console.error('Errore nell\'eliminazione:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Errore nell\'eliminazione dell\'informazione';
      toast.error(errorMessage);
    }
  };

  useEffect(() => {
    loadPasswordInfos();
  }, []);

  const filteredPasswordInfos = passwordInfos.filter(info => {
    const matchesSearch = info.titolo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (info.descrizione && info.descrizione.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (info.username && info.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (info.email && info.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'Tutti' || info.categoria === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <Shield className="me-2" size={24} />
                  <h4 className="mb-0">Gestione Password</h4>
                </div>
                <button
                  type="button"
                  className="btn btn-light btn-sm"
                  onClick={() => setShowForm(!showForm)}
                >
                  <Plus className="me-1" size={16} />
                  Nuova Password
                </button>
              </div>
            </div>

            {showForm && (
              <div className="card-body border-bottom">
                <h6 className="text-primary mb-3">
                  {editingInfo ? 'Modifica Informazione' : 'Nuova Informazione'}
                </h6>
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="titolo" className="form-label">
                        Titolo <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        id="titolo"
                        className="form-control"
                        value={formData.titolo}
                        onChange={(e) => setFormData(prev => ({ ...prev, titolo: e.target.value }))}
                        required
                        maxLength={100}
                      />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label htmlFor="categoria" className="form-label">Categoria</label>
                      <select
                        id="categoria"
                        className="form-select"
                        value={formData.categoria}
                        onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value as CategoriaPassword }))}
                      >
                        {CATEGORIE.map(cat => (
                          <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label htmlFor="url" className="form-label">
                        <Globe size={16} className="me-1" />
                        URL/Sito Web
                      </label>
                      <input
                        type="url"
                        id="url"
                        className="form-control"
                        value={formData.url}
                        onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                        maxLength={500}
                        placeholder="https://..."
                      />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label htmlFor="username" className="form-label">
                        <User size={16} className="me-1" />
                        Username
                      </label>
                      <input
                        type="text"
                        id="username"
                        className="form-control"
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        maxLength={100}
                      />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label htmlFor="email" className="form-label">
                        <Mail size={16} className="me-1" />
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        className="form-control"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        maxLength={100}
                      />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label htmlFor="password" className="form-label">
                        <Key size={16} className="me-1" />
                        Password <span className="text-danger">*</span>
                      </label>
                      <input
                        type="password"
                        id="password"
                        className="form-control"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        required
                        maxLength={1000}
                      />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label htmlFor="codici" className="form-label">
                        <Code size={16} className="me-1" />
                        Codici/PIN
                      </label>
                      <input
                        type="text"
                        id="codici"
                        className="form-control"
                        value={formData.codici}
                        onChange={(e) => setFormData(prev => ({ ...prev, codici: e.target.value }))}
                        maxLength={200}
                        placeholder="PIN, codici, numeri cliente..."
                      />
                    </div>
                    
                    <div className="col-12 mb-3">
                      <label htmlFor="descrizione" className="form-label">
                        <FileText size={16} className="me-1" />
                        Descrizione
                      </label>
                      <input
                        type="text"
                        id="descrizione"
                        className="form-control"
                        value={formData.descrizione}
                        onChange={(e) => setFormData(prev => ({ ...prev, descrizione: e.target.value }))}
                        maxLength={500}
                        placeholder="Breve descrizione del servizio..."
                      />
                    </div>
                    
                    <div className="col-12 mb-3">
                      <label htmlFor="note" className="form-label">
                        <StickyNote size={16} className="me-1" />
                        Note
                      </label>
                      <textarea
                        id="note"
                        className="form-control"
                        rows={3}
                        value={formData.note}
                        onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                        maxLength={1000}
                        placeholder="Note aggiuntive, istruzioni particolari..."
                      />
                    </div>
                  </div>
                  
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary">
                      <Save className="me-2" size={16} />
                      {editingInfo ? 'Aggiorna' : 'Crea'}
                    </button>
                    <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>
                      Annulla
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-6">
                  <div className="input-group">
                    <span className="input-group-text">
                      <Filter size={16} />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Cerca per titolo, descrizione, username o email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <select
                    className="form-select"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value as CategoriaPassword | 'Tutti')}
                  >
                    <option value="Tutti">Tutte le categorie</option>
                    {CATEGORIE.map(cat => (
                      <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Caricamento...</span>
                  </div>
                  <p className="mt-2 text-muted">Caricamento informazioni password...</p>
                </div>
              ) : passwordInfos.length === 0 ? (
                <div className="text-center py-4">
                  <Shield className="mx-auto mb-3 text-muted" size={48} />
                  <p className="text-muted">Nessuna informazione password trovata</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setShowForm(true)}
                  >
                    <Plus className="me-1" size={16} />
                    Aggiungi la prima password
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Titolo</th>
                        <th>Categoria</th>
                        <th>Email</th>
                        <th style={{ width: '200px' }}>Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPasswordInfos.map((info) => (
                        <tr key={info.infoId}>
                          <td className="fw-bold">{info.titolo}</td>
                          <td>
                            <span className={`badge bg-${getCategoryColor(info.categoria || 'Altro')}`}>
                              {(info.categoria || 'Altro').replace('_', ' ')}
                            </span>
                          </td>
                          <td>
                            {info.email ? (
                              <a href={`mailto:${info.email}`} className="text-decoration-none">
                                <Mail size={14} className="me-1" />
                                {info.email}
                              </a>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              <button
                                type="button"
                                className="btn btn-sm btn-primary"
                                onClick={() => handleShowDetails(info)}
                                title="Visualizza dettagli e password"
                              >
                                <Eye size={14} className="me-1" />
                                Visualizza
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => handleEdit(info)}
                                title="Modifica"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(info.infoId)}
                                title="Elimina"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal per i dettagli completi */}
      {showDetailsModal && selectedInfo && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <Shield className="me-2" size={20} />
                  {selectedInfo.titolo}
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setShowDetailsModal(false)}
                />
              </div>
              <div className="modal-body">
                <div className="row g-4">
                  
                  {/* Categoria */}
                  <div className="col-md-6">
                    <div className="d-flex align-items-center">
                      <Filter className="me-2 text-muted" size={16} />
                      <div>
                        <small className="text-muted">Categoria</small>
                        <div>
                          <span className={`badge bg-${getCategoryColor(selectedInfo.categoria || 'Altro')}`}>
                            {(selectedInfo.categoria || 'Altro').replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Data Creazione */}
                  <div className="col-md-6">
                    <div className="d-flex align-items-center">
                      <FileText className="me-2 text-muted" size={16} />
                      <div>
                        <small className="text-muted">Data Creazione</small>
                        <div>
                          {selectedInfo.dataInserimento ? 
                            new Date(selectedInfo.dataInserimento).toLocaleString('it-IT') :
                            'Non disponibile'
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* URL */}
                  {selectedInfo.url && (
                    <div className="col-12">
                      <div className="d-flex align-items-center">
                        <Globe className="me-2 text-muted" size={16} />
                        <div className="flex-grow-1">
                          <small className="text-muted">URL/Sito Web</small>
                          <div>
                            <a 
                              href={selectedInfo.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-decoration-none"
                            >
                              {selectedInfo.url}
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Username */}
                  {selectedInfo.username && (
                    <div className="col-md-6">
                      <div className="d-flex align-items-center">
                        <User className="me-2 text-muted" size={16} />
                        <div>
                          <small className="text-muted">Username</small>
                          <div className="font-monospace bg-light px-2 py-1 rounded d-inline-block">
                            {selectedInfo.username}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Email */}
                  {selectedInfo.email && (
                    <div className="col-md-6">
                      <div className="d-flex align-items-center">
                        <Mail className="me-2 text-muted" size={16} />
                        <div>
                          <small className="text-muted">Email</small>
                          <div>
                            <a href={`mailto:${selectedInfo.email}`} className="text-decoration-none">
                              {selectedInfo.email}
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Password */}
                  <div className="col-12">
                    <div className="card bg-light">
                      <div className="card-body">
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="d-flex align-items-center">
                            <Key className="me-2 text-muted" size={16} />
                            <div>
                              <small className="text-muted">Password</small>
                              <div>
                                {selectedInfo.password ? (
                                  <span className="font-monospace bg-warning text-dark px-3 py-2 rounded fw-bold">
                                    {selectedInfo.password}
                                  </span>
                                ) : (
                                  <span className="text-muted">••••••••</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="d-flex gap-2">
                            {selectedInfo.password ? (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => {
                                    navigator.clipboard.writeText(selectedInfo.password || '');
                                    toast.success('Password copiata negli appunti');
                                  }}
                                  title="Copia password"
                                >
                                  <Code size={14} className="me-1" />
                                  Copia
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-warning"
                                  onClick={() => {
                                    setPasswordInfos(prev => prev.map(item => 
                                      item.infoId === selectedInfo.infoId 
                                        ? { ...item, password: undefined }
                                        : item
                                    ));
                                    setSelectedInfo(prev => prev ? { ...prev, password: undefined } : null);
                                  }}
                                  title="Nascondi password"
                                >
                                  <EyeOff size={14} className="me-1" />
                                  Nascondi
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-sm btn-primary"
                                onClick={async () => {
                                  try {
                                    setRevealingId(selectedInfo.infoId);
                                    const result = await passwordInfoService.reveal(selectedInfo.infoId);
                                    if (result && result.password) {
                                      setSelectedInfo(prev => prev ? { ...prev, password: result.password } : null);
                                      setPasswordInfos(prev => prev.map(item => 
                                        item.infoId === selectedInfo.infoId 
                                          ? { ...item, password: result.password }
                                          : item
                                      ));
                                      toast.success('Password rivelata con successo');
                                    } else {
                                      throw new Error('Password non ricevuta dal server');
                                    }
                                  } catch (error: any) {
                                    console.error('Errore nella rivelazione:', error);
                                    const errorMessage = error.response?.data?.error || error.message || 'Errore nella rivelazione della password';
                                    toast.error(errorMessage);
                                  } finally {
                                    setRevealingId(null);
                                  }
                                }}
                                disabled={revealingId === selectedInfo.infoId}
                              >
                                {revealingId === selectedInfo.infoId ? (
                                  <span className="spinner-border spinner-border-sm me-1" role="status" />
                                ) : (
                                  <Eye className="me-1" size={14} />
                                )}
                                Mostra Password
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Codici */}
                  {selectedInfo.codici && (
                    <div className="col-12">
                      <div className="d-flex align-items-center">
                        <Code className="me-2 text-muted" size={16} />
                        <div>
                          <small className="text-muted">Codici/PIN</small>
                          <div className="font-monospace bg-light px-2 py-1 rounded">
                            {selectedInfo.codici}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Descrizione */}
                  {selectedInfo.descrizione && (
                    <div className="col-12">
                      <div className="d-flex align-items-start">
                        <FileText className="me-2 text-muted mt-1" size={16} />
                        <div>
                          <small className="text-muted">Descrizione</small>
                          <div>{selectedInfo.descrizione}</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Note */}
                  {selectedInfo.note && (
                    <div className="col-12">
                      <div className="d-flex align-items-start">
                        <StickyNote className="me-2 text-muted mt-1" size={16} />
                        <div className="flex-grow-1">
                          <small className="text-muted">Note</small>
                          <div className="bg-light p-3 rounded border-start border-primary border-3">
                            {selectedInfo.note}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowDetailsModal(false)}
                >
                  <X className="me-1" size={16} />
                  Chiudi
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => {
                    handleEdit(selectedInfo);
                    setShowDetailsModal(false);
                  }}
                >
                  <Edit className="me-1" size={16} />
                  Modifica
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordInfoPage;
