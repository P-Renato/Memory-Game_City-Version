export interface User {
  _id?: any;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  stats?: {
    gamesPlayed: number;
    wins: number;
    bestScore: number;
  };
}

export interface LoginRequest {
    login: {
        email?: string;
        username?: string;
    }
    password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: {
    id: string;
    username: string;
    email: string;
  };
  token?: string;
  error?: string;
}