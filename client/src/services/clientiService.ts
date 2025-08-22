import axios from 'axios';
import { Cliente, ClienteFormData, StatsResponse, SearchFilters } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://gestionale-termoidraulico-api.onrender.com/api';

const clientiService = {
  getAll: async (filters?: {
    search?: string;
    provenienzaContatto?: string;
    consensoMarketing?: boolean;
  }): Promise<Cliente[]> => {
    const token = localStorage.getItem('authToken');
    const params = new URLSearchParams();
    
    if (filters?.search) params.append('search', filters.search);
    if (filters?.provenienzaContatto) params.append('provenienzaContatto', filters.provenienzaContatto);
    if (filters?.consensoMarketing !== undefined) params.append('consensoMarketing', filters.consensoMarketing.toString());
    
    const response = await axios.get<{ clienti: Cliente[] }>(`${API_BASE_URL}/clienti?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return response.data.clienti;
  },

  getById: async (id: number): Promise<Cliente> => {
    const token = localStorage.getItem('authToken');
    const response = await axios.get<{ cliente: Cliente }>(`${API_BASE_URL}/clienti/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return response.data.cliente;
  },

  create: async (cliente: ClienteFormData): Promise<{ message: string; clienteId: number }> => {
    const token = localStorage.getItem('authToken');
    const response = await axios.post<{ message: string; clienteId: number }>(`${API_BASE_URL}/clienti`, cliente, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return response.data;
  },

  update: async (id: number, cliente: ClienteFormData): Promise<{ message: string }> => {
    const token = localStorage.getItem('authToken');
    const response = await axios.put<{ message: string }>(`${API_BASE_URL}/clienti/${id}`, cliente, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    const token = localStorage.getItem('authToken');
    await axios.delete(`${API_BASE_URL}/clienti/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  deleteCliente: async (id: number): Promise<void> => {
    const token = localStorage.getItem('authToken');
    await axios.delete(`${API_BASE_URL}/clienti/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  getStats: async (): Promise<StatsResponse> => {
    const token = localStorage.getItem('authToken');
    const response = await axios.get<StatsResponse>(`${API_BASE_URL}/clienti/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
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
    
    const response = await axios.get(`${API_BASE_URL}/clienti?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
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
