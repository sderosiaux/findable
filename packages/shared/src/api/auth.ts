import { ApiClient } from './client';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User
} from './types';

export class AuthApi {
  constructor(private client: ApiClient) {}

  async login(credentials: LoginRequest) {
    return this.client.post<AuthResponse>('/auth/login', credentials);
  }

  async register(data: RegisterRequest) {
    return this.client.post<AuthResponse>('/auth/register', data);
  }

  async refreshToken(refreshToken: string) {
    return this.client.post<{ accessToken: string; refreshToken: string }>(
      '/auth/refresh',
      { refreshToken }
    );
  }

  async logout() {
    return this.client.post('/auth/logout');
  }

  async getCurrentUser() {
    return this.client.get<User>('/auth/me');
  }
}