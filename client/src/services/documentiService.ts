import api from './api';
import { DocumentoCliente, DocumentoFormData, TipoDocumento } from '../types';

export const documentiService = {
  // Ottenere tutti i documenti di un cliente
  async getDocumentiCliente(clienteId: number): Promise<DocumentoCliente[]> {
    const response = await api.get(`/api/documenti/cliente/${clienteId}`);
    return response.data;
  },

  // Caricare un nuovo documento
  async uploadDocumento(clienteId: number, formData: DocumentoFormData): Promise<DocumentoCliente> {
    const uploadData = new FormData();
    uploadData.append('tipoDocumento', formData.tipoDocumento);
    uploadData.append('titolo', formData.titolo);
    if (formData.descrizione) {
      uploadData.append('descrizione', formData.descrizione);
    }
    uploadData.append('documento', formData.file);

    const response = await api.post(`/api/documenti/cliente/${clienteId}`, uploadData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Scaricare un documento
  async downloadDocumento(documentoId: number): Promise<Blob> {
    const response = await api.get(`/api/documenti/${documentoId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Ottenere dettagli di un documento
  async getDocumento(documentoId: number): Promise<DocumentoCliente> {
    const response = await api.get(`/api/documenti/${documentoId}`);
    return response.data;
  },

  // Aggiornare un documento (solo metadati)
  async updateDocumento(
    documentoId: number, 
    updates: Partial<Pick<DocumentoFormData, 'titolo' | 'descrizione' | 'tipoDocumento'>>
  ): Promise<DocumentoCliente> {
    const response = await api.put(`/api/documenti/${documentoId}`, updates);
    return response.data;
  },

  // Eliminare un documento
  async deleteDocumento(documentoId: number): Promise<void> {
    await api.delete(`/api/documenti/${documentoId}`);
  },

  // Ottenere documenti per tipo
  async getDocumentiPerTipo(clienteId: number, tipoDocumento: TipoDocumento): Promise<DocumentoCliente[]> {
    const response = await api.get(`/api/documenti/cliente/${clienteId}/tipo/${tipoDocumento}`);
    return response.data;
  },

  // Cercare documenti
  async searchDocumenti(clienteId: number, searchTerm: string): Promise<DocumentoCliente[]> {
    const response = await api.get(`/api/documenti/cliente/${clienteId}/search?q=${encodeURIComponent(searchTerm)}`);
    return response.data;
  },

  // Utility per creare URL di download
  getDownloadUrl(documentoId: number): string {
    return `/api/documenti/${documentoId}/download`;
  },

  // Utility per validare il tipo di file
  isFileTypeAllowed(file: File): boolean {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];
    return allowedTypes.includes(file.type);
  },

  // Utility per verificare la dimensione del file (max 10MB)
  isFileSizeAllowed(file: File): boolean {
    const maxSize = 10 * 1024 * 1024; // 10MB
    return file.size <= maxSize;
  },

  // Utility per formattare la dimensione del file
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
};
