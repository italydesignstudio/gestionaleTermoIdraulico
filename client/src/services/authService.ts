import api from './api';
import { 
  AuthResponse, 
  LoginFormData, 
  RegisterFormData, 
  User 
} from '../types';

class AuthService {
  async login(credentials: LoginFormData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/utenti/login', credentials);
    
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('currentUser', JSON.stringify(response.data.user));
    }
    
    return response.data;
  }

  async register(userData: RegisterFormData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/utenti/register', userData);
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await api.get<{ user: User }>('/utenti/me');
    return response.data.user;
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  }

  getCurrentUserFromStorage(): User | null {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUserFromStorage();
    return user?.ruolo === 'Amministratore';
  }

  async getUsers(): Promise<{ users: User[]; total: number }> {
    const response = await api.get<{ users: User[]; total: number }>('/utenti');
    return response.data;
  }

  async updateUserRole(userId: number, ruolo: 'Operatore' | 'Amministratore'): Promise<void> {
    await api.put(`/utenti/${userId}/ruolo`, { ruolo });
  }
}

export default new AuthService();
