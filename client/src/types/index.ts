export interface User {
  id: string;
  username: string;
  email: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: { login: string; password: string }) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  token: string | null;
}

export interface Card {
  id: number;
  city: string;
  flipped: boolean;
  matched: boolean;
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

  flippedCards?: number[]; // Track indices of currently flipped cards
  lastMove?: {           // Track the last move made
    userId: string;
    cardIndex: number;
    cardId: number;      // Changed from string to number to match Card.id
    timestamp: number;
  } | null;
}

export interface GameRoom {
  // _id?: string;
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

export interface CurrentUser {
  id: string;
  username: string;
  email?: string;
}

export interface CreateRoomData {
  name: string;
  maxPlayers: number;
  language: string;
  isPrivate: boolean;
}

export interface JoinRoomData {
  roomId: string;
  userId: string;
}