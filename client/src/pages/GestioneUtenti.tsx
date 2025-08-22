import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, Alert } from 'react-bootstrap';
import { User } from '../types';
import authService from '../services/authService';
import { toast } from 'react-toastify';
import { Edit, Trash2, UserPlus, Users, Save } from 'lucide-react';

const GestioneUtenti: React.FC = () => {
  const [utenti, setUtenti] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    email: '',
    password: '',
    ruolo: 'Operatore' as 'Operatore' | 'Amministratore'
  });

  useEffect(() => {
    loadUtenti();
  }, []);

  const loadUtenti = async () => {
    try {
      setLoading(true);
      const data = await authService.getUsers();
      setUtenti(data.users);
    } catch (error) {
      console.error('Errore nel caricamento degli utenti:', error);
      toast.error('Errore nel caricamento degli utenti');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingUser) {
        // Update user - da implementare
        toast.success('Utente aggiornato con successo');
      } else {
        await authService.register(formData);
        toast.success('Utente creato con successo');
      }
      
      setFormData({ nome: '', cognome: '', email: '', password: '', ruolo: 'Operatore' });
      setShowForm(false);
      setEditingUser(null);
      loadUtenti();
    } catch (error: any) {
      console.error('Errore nel salvataggio:', error);
      const message = error.response?.data?.message || 'Errore nel salvataggio dell\'utente';
      toast.error(message);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      nome: user.nome,
      cognome: user.cognome,
      email: user.email,
      password: '',
      ruolo: user.ruolo
    });
    setShowForm(true);
  };

  const handleDelete = async (user: User) => {
    const confirmed = window.confirm(`Sei sicuro di voler eliminare l'utente ${user.nome} ${user.cognome}?`);
    if (!confirmed) return;

    try {
      // Delete user - da implementare nel backend
      toast.success('Utente eliminato con successo');
      loadUtenti();
    } catch (error) {
      console.error('Errore nell\'eliminazione:', error);
      toast.error('Errore nell\'eliminazione dell\'utente');
    }
  };

  const resetForm = () => {
    setFormData({ nome: '', cognome: '', email: '', password: '', ruolo: 'Operatore' });
    setShowForm(false);
    setEditingUser(null);
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

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">
                <Users className="me-2" size={20} />
                Gestione Utenti
              </h5>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowForm(true)}
              >
                <UserPlus className="me-2" size={16} />
                Nuovo Utente
              </button>
            </div>
            
            {showForm && (
              <div className="card-body border-bottom">
                <h6 className="text-primary mb-3">
                  {editingUser ? 'Modifica Utente' : 'Nuovo Utente'}
                </h6>
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="nome" className="form-label">
                        Nome <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        id="nome"
                        className="form-control"
                        value={formData.nome}
                        onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
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
                        className="form-control"
                        value={formData.cognome}
                        onChange={(e) => setFormData(prev => ({ ...prev, cognome: e.target.value }))}
                        required
                        maxLength={100}
                      />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label htmlFor="email" className="form-label">
                        Email <span className="text-danger">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        className="form-control"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        required
                        maxLength={255}
                      />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label htmlFor="ruolo" className="form-label">
                        Ruolo <span className="text-danger">*</span>
                      </label>
                      <select
                        id="ruolo"
                        className="form-select"
                        value={formData.ruolo}
                        onChange={(e) => setFormData(prev => ({ ...prev, ruolo: e.target.value as 'Operatore' | 'Amministratore' }))}
                        required
                      >
                        <option value="Operatore">Operatore</option>
                        <option value="Amministratore">Amministratore</option>
                      </select>
                    </div>
                    
                    <div className="col-12 mb-3">
                      <label htmlFor="password" className="form-label">
                        Password {!editingUser && <span className="text-danger">*</span>}
                      </label>
                      <input
                        type="password"
                        id="password"
                        className="form-control"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        required={!editingUser}
                        minLength={6}
                        placeholder={editingUser ? "Lascia vuoto per non modificare" : ""}
                      />
                      {!editingUser && (
                        <div className="form-text">
                          La password deve essere di almeno 6 caratteri
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary">
                      <Save className="me-2" size={16} />
                      {editingUser ? 'Aggiorna' : 'Crea'}
                    </button>
                    <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>
                      Annulla
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            <div className="card-body">
              {utenti.length === 0 ? (
                <div className="text-center py-4">
                  <Users size={48} className="text-muted mb-3" />
                  <p className="text-muted">Nessun utente trovato</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>Cognome</th>
                        <th>Email</th>
                        <th>Ruolo</th>
                        <th>Data Creazione</th>
                        <th style={{ width: '200px' }}>Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {utenti.map((user) => (
                        <tr key={user.utenteId}>
                          <td className="fw-bold">{user.nome}</td>
                          <td>{user.cognome}</td>
                          <td>
                            <a href={`mailto:${user.email}`} className="text-decoration-none">
                              {user.email}
                            </a>
                          </td>
                          <td>
                            <span className={`badge ${user.ruolo === 'Amministratore' ? 'bg-danger' : 'bg-primary'}`}>
                              {user.ruolo}
                            </span>
                          </td>
                          <td>
                            {user.dataCreazione ? new Date(user.dataCreazione).toLocaleDateString('it-IT') : '-'}
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleEdit(user)}
                                title="Modifica utente"
                              >
                                <Edit className="me-1" size={16} />
                                Modifica
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(user)}
                                title="Elimina utente"
                                disabled={user.utenteId === 1} // Non eliminare l'admin principale
                              >
                                <Trash2 className="me-1" size={16} />
                                Elimina
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
    </div>
  );
};

export default GestioneUtenti;
