
export interface Card {
  id: number;           // Keep as number if that's what you're using
  city: string;
  flipped: boolean;
  matched: boolean;
  image?: string;       // Add if you need image paths
}

export interface GamePlayer {
  userId: string;
  username: string;
  score: number;
  isReady: boolean;
  isHost: boolean;
}

// Update GameState with missing properties:
export interface GameState {
  cards: Card[];
  currentTurn: string;
  matchedPairs: number;
  isGameComplete: boolean;
  flippedCards?: number[];
  lastMove?: {
    userId: string;
    cardIndex: number;
    cardId: number;     // Match your Card.id type (number)
    timestamp: number;
  } | null;
}

export interface GameRoom {
  id: string;
  name: string;
  host: string;
  players: GamePlayer[];
  playerCount: number;
  maxPlayers: number;
  gameState: GameState;
  status: 'waiting' | 'playing' | 'finished';
  settings: {
    language: string;
    cardCount: number;
    isPrivate: boolean;
  };
  isFull: boolean;
  createdAt: string;
}

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

export interface RoomServiceResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

// Add for WebSocket later
export interface WebSocketMessage {
  type: string;
  payload: unknown;
  roomId?: string;
  userId?: string;
}

export interface User {
  id: string;
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

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: { login: string; password: string }) => Promise<{
    success: boolean;
    user?: User;
    token?: string;
    error?: string;
  }>;
  logout: () => void;
  isAuthenticated: boolean;
  token: string | null;
}