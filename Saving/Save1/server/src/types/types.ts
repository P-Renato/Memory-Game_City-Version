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

// JWT Payload
export interface JwtPayload {
  userId: string;
  email: string;
  username: string;
  iat?: number;
  exp?: number;
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

import type { 
  GameRoom, 
  GamePlayer, 
  GameState, 
  Card,
  CreateRoomRequest,
  CreateRoomResponse 
} from '../../../shared/types'; 

export type { 
  GameRoom, 
  GamePlayer, 
  GameState, 
  Card,
  CreateRoomRequest,
  CreateRoomResponse 
};