import type { GameRoom, GamePlayer } from "../types";

// client/src/lib/api-client.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: HeadersInit;

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Get token from localStorage if available
    const token = localStorage.getItem('token');
    console.log('🔑 Token in API client:', token ? 'Present' : 'Missing');
    const headers = {
      ...this.defaultHeaders,
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    console.log('📡 Making request to:', url);
    console.log('Headers:', { ...headers, Authorization: 'Bearer ***' });
    
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`
      }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // ===== AUTH METHODS =====
  async register(data: { username: string; email: string; password: string }) {
    return this.request<{
      success: boolean;
      user?: { id: string; username: string; email: string };
      token?: string;
      error?: string;
    }>('/api/users/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: { login: string; password: string }) {
    return this.request<{
      success: boolean;
      user?: { id: string; username: string; email: string; stats?: {gamesPlayed: number; wins: number; bestScore: number;}};
      token?: string;
      error?: string;
    }>('/api/users/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ===== ROOM METHODS =====
  async createRoom(data: {
    name: string;
    maxPlayers: number;
    language: string;
    isPrivate: boolean;
    userId: string;
    username: string;
  }) {
    return this.request<{
      success: boolean;
      room?: GameRoom;
      error?: string;
    }>('/api/rooms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // NEW: Get rooms list (joinable rooms)
  async getRoomsList() {
    return this.request<{
      success: boolean;
      rooms?: GameRoom[];
      error?: string;
    }>('/api/rooms/list'); 
  }

  // NEW: Join a room
  async joinRoom(roomId: string) {

    const token = localStorage.getItem('token');
    let userId = '';
  
  if (token) {
    try {
      // Simple way to extract user ID from JWT token
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.userId;
    } catch (error) {
      console.error('Failed to parse token:', error);
    }
  }
    return this.request<{
      success: boolean;
      room?: GameRoom;
      error?: string;
    }>(`/api/rooms/${roomId}/join`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  // NEW: Get specific room details
  async getRoom(roomId: string) {
    return this.request<{
      success: boolean;
      room?: GameRoom;
      error?: string;
    }>(`/api/rooms/${roomId}`);
  }

  // ===== PROFILE METHODS =====
  async getProfile() {
    return this.request<{
      success: boolean;
      user?: GamePlayer;
      error?: string;
    }>('/api/users/profile');
  }
  async markReady(roomId: string) {
  return this.request<{
    success: boolean;
    room?: GameRoom;
    error?: string;
  }>(`/api/rooms/${roomId}/ready`, {
    method: 'POST',
  });
}

async startGame(roomId: string) {
  return this.request<{
    success: boolean;
    room?: GameRoom;
    error?: string;
  }>(`/api/rooms/${roomId}/start`, {
    method: 'POST',
  });
}

async sendGameAction(roomId: string, action: string, cardIndex?: number, cardId?: string) {
  return this.request<{
    success: boolean;
    room?: GameRoom;
    error?: string;
  }>(`/api/rooms/${roomId}/action`, {
    method: 'POST',
    body: JSON.stringify({ action, cardIndex, cardId }),
  });
}
}

// Export a singleton instance
export const apiClient = new ApiClient();