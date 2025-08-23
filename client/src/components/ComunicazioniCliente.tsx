import React, { useState, useEffect } from 'react';
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

  const handleWhatsApp = async () => {
    if (!telefono) {
      toast.error('Numero di telefono non disponibile');
      return;
    }

    try {
      const link = await comunicazioniService.getWhatsAppLink(clienteId);
      comunicazioniService.openWhatsApp(telefono);
      
      // Registra la comunicazione
      await comunicazioniService.createComunicazione(clienteId, {
        tipoComunicazione: 'WhatsApp',
        oggetto: 'Messaggio WhatsApp',
        contenuto: `Avviata conversazione WhatsApp con ${nomeCliente}`,
        priorita: 'Media'
      });
      
      loadComunicazioni();
    } catch (error) {
      console.error('Errore WhatsApp:', error);
      toast.error('Errore nell\'apertura di WhatsApp');
    }
  };

  const handleCall = async () => {
    if (!telefono) {
      toast.error('Numero di telefono non disponibile');
      return;
    }

    try {
      comunicazioniService.openCall(telefono);
      
      // Registra la comunicazione
      await comunicazioniService.createComunicazione(clienteId, {
        tipoComunicazione: 'Chiamata',
        oggetto: 'Chiamata telefonica',
        contenuto: `Chiamata effettuata a ${nomeCliente} (${telefono})`,
        priorita: 'Media'
      });
      
      loadComunicazioni();
    } catch (error) {
      console.error('Errore chiamata:', error);
      toast.error('Errore nell\'avvio della chiamata');
    }
  };

  const handleEmail = async () => {
    if (!email) {
      toast.error('Indirizzo email non disponibile');
      return;
    }

    try {
      comunicazioniService.openEmail(email, `Oggetto per ${nomeCliente}`);
      
      // Registra la comunicazione
      await comunicazioniService.createComunicazione(clienteId, {
        tipoComunicazione: 'Email',
        oggetto: 'Email inviata',
        contenuto: `Email inviata a ${nomeCliente} (${email})`,
        priorita: 'Media'
      });
      
      loadComunicazioni();
    } catch (error) {
      console.error('Errore email:', error);
      toast.error('Errore nell\'apertura dell\'email');
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

  const countUnread = comunicazioniService.countUnread(comunicazioni);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-semibold text-gray-800">
            💬 Comunicazioni con {nomeCliente}
          </h3>
          {countUnread > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {countUnread} non lette
            </span>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'Annulla' : '+ Nuova Comunicazione'}
        </button>
      </div>

      {/* Pulsanti azioni rapide */}
      <div className="flex flex-wrap gap-3 mb-6">
        {telefono && (
          <>
            <button
              onClick={handleWhatsApp}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              💬 WhatsApp
            </button>
            <button
              onClick={handleCall}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              📞 Chiama
            </button>
          </>
        )}
        {email && (
          <button
            onClick={handleEmail}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            📧 Email
          </button>
        )}
      </div>

      {/* Form nuova comunicazione */}
      {showForm && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo *
                </label>
                <select
                  value={formData.tipoComunicazione}
                  onChange={(e) => setFormData({...formData, tipoComunicazione: e.target.value as TipoComunicazione})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {tipiComunicazione.map(tipo => (
                    <option key={tipo} value={tipo}>
                      {comunicazioniService.getTipoIcon(tipo)} {tipo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priorità
                </label>
                <select
                  value={formData.priorita}
                  onChange={(e) => setFormData({...formData, priorita: e.target.value as Priorita})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {priorita.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Oggetto
                </label>
                <input
                  type="text"
                  value={formData.oggetto}
                  onChange={(e) => setFormData({...formData, oggetto: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Oggetto (opzionale)"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contenuto *
              </label>
              <textarea
                value={formData.contenuto}
                onChange={(e) => setFormData({...formData, contenuto: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Descrivi la comunicazione..."
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Salva Comunicazione
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData({
                    tipoComunicazione: 'Nota',
                    oggetto: '',
                    contenuto: '',
                    priorita: 'Media'
                  });
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Annulla
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtri */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Cerca comunicazioni..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="sm:w-48">
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value as TipoComunicazione | 'Tutti')}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="Tutti">Tutti i tipi</option>
            {tipiComunicazione.map(tipo => (
              <option key={tipo} value={tipo}>
                {comunicazioniService.getTipoIcon(tipo)} {tipo}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:w-48">
          <select
            value={filtroPriorita}
            onChange={(e) => setFiltroPriorita(e.target.value as Priorita | 'Tutte')}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="Tutte">Tutte le priorità</option>
            {priorita.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista comunicazioni */}
      {comunicazioniFiltered.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          {comunicazioni.length === 0 
            ? 'Nessuna comunicazione registrata per questo cliente'
            : 'Nessuna comunicazione corrisponde ai filtri selezionati'
          }
        </div>
      ) : (
        <div className="space-y-3">
          {comunicazioniFiltered.map((comunicazione) => (
            <div 
              key={comunicazione.comunicazioneId} 
              className={`border rounded-lg p-4 hover:bg-gray-50 ${
                !comunicazione.statoLettura ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg">
                      {comunicazioniService.getTipoIcon(comunicazione.tipoComunicazione)}
                    </span>
                    <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      {comunicazione.tipoComunicazione}
                    </span>
                    <span 
                      className="text-xs font-medium px-2.5 py-0.5 rounded text-white"
                      style={{ backgroundColor: comunicazioniService.getPrioritaColor(comunicazione.priorita) }}
                    >
                      {comunicazione.priorita}
                    </span>
                    {!comunicazione.statoLettura && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                        NON LETTA
                      </span>
                    )}
                  </div>
                  
                  {comunicazione.oggetto && (
                    <h4 className="font-medium text-gray-900 mb-1">{comunicazione.oggetto}</h4>
                  )}
                  
                  <p className="text-gray-700 mb-2">{comunicazione.contenuto}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>📅 {comunicazioniService.formatDate(comunicazione.dataOra)}</span>
                    <span>👤 {comunicazione.nomeUtenteCreazione} {comunicazione.cognomeUtenteCreazione}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  {!comunicazione.statoLettura && (
                    <button
                      onClick={() => handleMarkAsRead(comunicazione.comunicazioneId)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                      title="Segna come letta"
                    >
                      ✓ Letta
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(comunicazione.comunicazioneId)}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                    title="Elimina comunicazione"
                  >
                    🗑️ Elimina
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ComunicazioniCliente;
