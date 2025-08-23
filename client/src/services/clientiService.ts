import api from './api';
import { Cliente, ClienteFormData, StatsResponse, SearchFilters } from '../types';

const clientiService = {
  getAll: async (filters?: {
    search?: string;
    provenienzaContatto?: string;
    consensoMarketing?: boolean;
  }): Promise<Cliente[]> => {
    const params = new URLSearchParams();
    
    if (filters?.search) params.append('search', filters.search);
    if (filters?.provenienzaContatto) params.append('provenienzaContatto', filters.provenienzaContatto);
    if (filters?.consensoMarketing !== undefined) params.append('consensoMarketing', filters.consensoMarketing.toString());
    
    const response = await api.get<{ clienti: Cliente[] }>(`/clienti?${params}`);
    
    return response.data.clienti;
  },

  getById: async (id: number): Promise<Cliente> => {
    const response = await api.get<{ cliente: Cliente }>(`/clienti/${id}`);
    
    return response.data.cliente;
  },

  create: async (cliente: ClienteFormData): Promise<{ message: string; clienteId: number }> => {
    const response = await api.post<{ message: string; clienteId: number }>(`/clienti`, cliente);
    
    return response.data;
  },

  update: async (id: number, cliente: ClienteFormData): Promise<{ message: string }> => {
    const response = await api.put<{ message: string }>(`/clienti/${id}`, cliente);
    
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/clienti/${id}`);
  },

  deleteCliente: async (id: number): Promise<void> => {
    await api.delete(`/clienti/${id}`);
  },

  getStats: async (): Promise<StatsResponse> => {
    const response = await api.get<StatsResponse>(`/clienti/stats`);
    
    return response.data;
  },

  getClienti: async (filters: SearchFilters): Promise<{
    clienti: Cliente[];
    pagination: {
      current: number;
      total: number;
      hasNext: boolean;
      hasPrev: boolean;
      totalRecords: number;
    };
    filters: any;
  }> => {
    const token = localStorage.getItem('authToken');
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.provenienzaContatto) params.append('provenienzaContatto', filters.provenienzaContatto);
    if (filters.consensoMarketing) params.append('consensoMarketing', filters.consensoMarketing);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    
    const response = await api.get(`/clienti?${params}`);
    
    return response.data;
  },

  getProvenienzaContatti: (): string[] => {
    return [
      'Cliente esistente',
      'Facebook',
      'Giornale',
      'Google',
      'Instagram',
      'Passaparola',
      'Radio',
      'Sito web',
      'TV',
      'Volantino'
    ];
  }
};

export default clientiService;
