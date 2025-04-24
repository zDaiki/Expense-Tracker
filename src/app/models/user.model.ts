export interface User {
  id: number;
  email: string;
  username: string;
  password?: string;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  token: string;
}