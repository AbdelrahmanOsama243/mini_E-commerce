export interface User {
  id?: string;
  _id?: string; // MongoDB format
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
