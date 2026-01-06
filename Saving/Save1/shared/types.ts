// shared/types.ts

// Card interface - using number for id since that's what you have
export interface Card {
  id: number;
  city: string;
  flipped: boolean;
  matched: boolean;
  image?: string;
}

export interface GamePlayer {
  userId: string;
  username: string;
  score: number;
  isReady: boolean;
  isHost: boolean;
}

export interface GameState {
  cards: Card[];
  currentTurn: string;
  matchedPairs: number;
  isGameComplete: boolean;
  flippedCards?: number[];
  lastMove?: {
    userId: string;
    cardIndex: number;
    cardId: number;
    timestamp: number;
  } | null;
}

export interface GameRoom {
  id: string;
  name: string;
  host: string;
  players: GamePlayer[];
  maxPlayers: number;
  status: 'waiting' | 'playing' | 'finished';
  gameState: GameState;
  settings: {
    language: string;
    cardCount: number;
    isPrivate: boolean;
  };
  createdAt: Date;
  updatedAt?: Date;
}

// API Request/Response types
export interface CreateRoomRequest {
  name: string;
  maxPlayers: number;
  language: string;
  isPrivate: boolean;
  userId: string;
  username: string;
}

export interface CreateRoomResponse {
  success: boolean;
  room?: GameRoom;
  error?: string;
}

export interface GetRoomsResponse {
  success: boolean;
  rooms?: GameRoom[];
  error?: string;
}

// Auth types
export interface User {
  id: string;
  username: string;
  email: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}