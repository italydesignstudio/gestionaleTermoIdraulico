import axios, { AxiosResponse } from 'axios';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://gestionale-termoidraulico-api.onrender.com/api';

console.log('API_BASE_URL configurato:', API_BASE_URL);
console.log('Environment variables:', import.meta.env);

// Configurazione axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor per aggiungere token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor per gestire errori di autenticazione
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token scaduto o non valido
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      
      if (error.response?.data?.code === 'TOKEN_EXPIRED') {
        toast.error('Sessione scaduta. Effettua nuovamente il login.');
      } else if (error.response?.data?.code === 'INVALID_TOKEN') {
        toast.error('Token non valido. Effettua nuovamente il login.');
      }
      
      // Redirect al login (gestito dal contesto Auth)
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      toast.error('Non hai i permessi per eseguire questa operazione.');
    } else if (error.response?.status === 429) {
      toast.error('Troppe richieste. Riprova più tardi.');
    } else if (error.response?.status >= 500) {
      toast.error('Errore del server. Riprova più tardi.');
    } else if (error.code === 'NETWORK_ERROR') {
      toast.error('Errore di connessione. Verifica la tua connessione internet.');
    }
    
    return Promise.reject(error);
  }
);

export default api;
