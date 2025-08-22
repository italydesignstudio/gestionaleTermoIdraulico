import axios from 'axios';
import { PasswordInfo, PasswordInfoFormData } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://gestionale-termoidraulico-api.onrender.com/api';

const passwordInfoService = {
  getAll: async (): Promise<PasswordInfo[]> => {
    const token = localStorage.getItem('authToken');
    const response = await axios.get<{ passwordInfo: PasswordInfo[] }>(`${API_BASE_URL}/password-info`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return response.data.passwordInfo;
  },

  getById: async (id: number): Promise<PasswordInfo> => {
    const token = localStorage.getItem('authToken');
    const response = await axios.get<{ info: PasswordInfo }>(`${API_BASE_URL}/password-info/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return response.data.info;
  },

  create: async (info: PasswordInfoFormData): Promise<{ message: string; infoId: number }> => {
    const token = localStorage.getItem('authToken');
    const response = await axios.post<{ message: string; infoId: number }>(`${API_BASE_URL}/password-info`, info, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return response.data;
  },

  update: async (id: number, info: PasswordInfoFormData): Promise<{ message: string }> => {
    const token = localStorage.getItem('authToken');
    const response = await axios.put<{ message: string }>(`${API_BASE_URL}/password-info/${id}`, info, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    const token = localStorage.getItem('authToken');
    await axios.delete(`${API_BASE_URL}/password-info/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  reveal: async (id: number): Promise<{ valore: string }> => {
    const token = localStorage.getItem('authToken');
    const response = await axios.put<{ valore: string }>(`${API_BASE_URL}/password-info/${id}/reveal`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return response.data;
  }
};

export default passwordInfoService;
