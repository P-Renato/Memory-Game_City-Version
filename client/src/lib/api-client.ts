import type { GameRoom, GamePlayer } from "../types";

// client/src/lib/api-client.ts
const API_BASE_URL = 'http://localhost:3001';

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
    const headers = {
      ...this.defaultHeaders,
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };
    
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

  async login(data: { email: string; password: string }) {
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
    }>('/api/rooms/available');  // Changed from '/list' to '/available'
  }

  // NEW: Join a room
  async joinRoom(roomId: string) {
    return this.request<{
      success: boolean;
      room?: GameRoom;
      error?: string;
    }>(`/api/rooms/${roomId}/join`, {
      method: 'POST',
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
}

// Export a singleton instance
export const apiClient = new ApiClient();