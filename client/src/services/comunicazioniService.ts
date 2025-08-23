import api from './api';
import { 
  ComunicazioneCliente, 
  ComunicazioneFormData, 
  TipoComunicazione, 
  Priorita,
  WhatsAppLink,
  CallLink,
  EmailLink
} from '../types';

export const comunicazioniService = {
  // Ottenere tutte le comunicazioni di un cliente
  async getComunicazioniCliente(clienteId: number): Promise<ComunicazioneCliente[]> {
    const response = await api.get(`/api/comunicazioni/cliente/${clienteId}`);
    return response.data;
  },

  // Creare una nuova comunicazione
  async createComunicazione(clienteId: number, formData: ComunicazioneFormData): Promise<ComunicazioneCliente> {
    const response = await api.post(`/api/comunicazioni/cliente/${clienteId}`, formData);
    return response.data;
  },

  // Aggiornare una comunicazione
  async updateComunicazione(
    comunicazioneId: number, 
    updates: Partial<ComunicazioneFormData>
  ): Promise<ComunicazioneCliente> {
    const response = await api.put(`/api/comunicazioni/${comunicazioneId}`, updates);
    return response.data;
  },

  // Eliminare una comunicazione
  async deleteComunicazione(comunicazioneId: number): Promise<void> {
    await api.delete(`/api/comunicazioni/${comunicazioneId}`);
  },

  // Segnare come letta
  async markAsRead(comunicazioneId: number): Promise<ComunicazioneCliente> {
    const response = await api.patch(`/api/comunicazioni/${comunicazioneId}/read`);
    return response.data;
  },

  // Ottenere comunicazioni per tipo
  async getComunicazioniPerTipo(clienteId: number, tipo: TipoComunicazione): Promise<ComunicazioneCliente[]> {
    const response = await api.get(`/api/comunicazioni/cliente/${clienteId}/tipo/${tipo}`);
    return response.data;
  },

  // Ottenere comunicazioni per priorità
  async getComunicazioniPerPriorita(clienteId: number, priorita: Priorita): Promise<ComunicazioneCliente[]> {
    const response = await api.get(`/api/comunicazioni/cliente/${clienteId}/priorita/${priorita}`);
    return response.data;
  },

  // Cercare comunicazioni
  async searchComunicazioni(clienteId: number, searchTerm: string): Promise<ComunicazioneCliente[]> {
    const response = await api.get(`/api/comunicazioni/cliente/${clienteId}/search?q=${encodeURIComponent(searchTerm)}`);
    return response.data;
  },

  // Ottenere link WhatsApp per un cliente
  async getWhatsAppLink(clienteId: number, messaggio?: string): Promise<WhatsAppLink> {
    const params = messaggio ? `?messaggio=${encodeURIComponent(messaggio)}` : '';
    const response = await api.get(`/api/comunicazioni/cliente/${clienteId}/whatsapp${params}`);
    return response.data;
  },

  // Ottenere link chiamata per un cliente
  async getCallLink(clienteId: number): Promise<CallLink> {
    const response = await api.get(`/api/comunicazioni/cliente/${clienteId}/call`);
    return response.data;
  },

  // Ottenere link email per un cliente
  async getEmailLink(clienteId: number, oggetto?: string, corpo?: string): Promise<EmailLink> {
    let params = '';
    if (oggetto || corpo) {
      const searchParams = new URLSearchParams();
      if (oggetto) searchParams.append('oggetto', oggetto);
      if (corpo) searchParams.append('corpo', corpo);
      params = `?${searchParams.toString()}`;
    }
    const response = await api.get(`/api/comunicazioni/cliente/${clienteId}/email${params}`);
    return response.data;
  },

  // Utility per aprire WhatsApp
  openWhatsApp(numeroTelefono: string, messaggio?: string): void {
    const numero = numeroTelefono.replace(/[^\d]/g, '');
    let url = `https://wa.me/${numero}`;
    if (messaggio) {
      url += `?text=${encodeURIComponent(messaggio)}`;
    }
    window.open(url, '_blank');
  },

  // Utility per aprire chiamata
  openCall(numeroTelefono: string): void {
    window.open(`tel:${numeroTelefono}`, '_self');
  },

  // Utility per aprire email
  openEmail(email: string, oggetto?: string, corpo?: string): void {
    let url = `mailto:${email}`;
    const params = [];
    if (oggetto) params.push(`subject=${encodeURIComponent(oggetto)}`);
    if (corpo) params.push(`body=${encodeURIComponent(corpo)}`);
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    window.open(url, '_self');
  },

  // Utility per formattare la data
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('it-IT', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  },

  // Utility per ottenere l'icona del tipo di comunicazione
  getTipoIcon(tipo: TipoComunicazione): string {
    const icons = {
      'Chiamata': '📞',
      'WhatsApp': '💬',
      'Email': '📧',
      'SMS': '📱',
      'Nota': '📝',
      'Promemoria': '⏰',
      'Altro': '📋'
    };
    return icons[tipo] || '📋';
  },

  // Utility per ottenere il colore della priorità
  getPrioritaColor(priorita: Priorita): string {
    const colors = {
      'Bassa': '#28a745',
      'Media': '#ffc107',
      'Alta': '#fd7e14',
      'Urgente': '#dc3545'
    };
    return colors[priorita] || '#6c757d';
  },

  // Utility per contare comunicazioni non lette
  countUnread(comunicazioni: ComunicazioneCliente[]): number {
    return comunicazioni.filter(c => !c.statoLettura).length;
  }
};
