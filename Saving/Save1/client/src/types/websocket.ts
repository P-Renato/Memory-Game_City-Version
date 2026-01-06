
// client/src/types/websocket.ts
import type { GameRoom, GamePlayer } from './index';

export type WebSocketMessageType = 
  | 'JOIN_ROOM'
  | 'LEAVE_ROOM'
  | 'PLAYER_JOINED'
  | 'PLAYER_LEFT'
  | 'PLAYER_READY'
  | 'GAME_STARTED'
  | 'CARD_FLIPPED'
  | 'CARD_MATCHED'
  | 'TURN_CHANGED'
  | 'GAME_UPDATE'
  | 'ROOM_STATE'
  | 'GAME_OVER'
  | 'ERROR'
  | 'TEST'
  | 'TEST_RESPONSE'
  | 'FLIP_CARD'
  | 'END_TURN'
  | 'GET_ROOM_STATE';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  data: WebSocketData;
  timestamp: Date;
}

export interface WebSocketData {
  // For JOIN_ROOM
  roomId?: string;
  
  // For PLAYER_JOINED, PLAYER_LEFT
  player?: {
    userId: string;
    username: string;
  };
  
  // For CARD_FLIPPED, FLIP_CARD
  cardIndex?: number;
  previousFlippedCount?: number;
  
  // For GAME_UPDATE, TURN_CHANGED, ROOM_STATE
  room?: GameRoom;
  action?: string;
  playerId?: string;
  username?: string;
  
  // For ERROR
  error?: string;
  
  // For TEST messages
  message?: string;
  received?: any;
  
  // For END_TURN
  newPlayerId?: string;
  previousPlayerId?: string;
}

// Helper type guards
export function isRoomUpdate(message: WebSocketMessage): message is WebSocketMessage & { data: { room: GameRoom } } {
  return message.type === 'GAME_STARTED' || 
         message.type === 'CARD_FLIPPED' ||
         message.type === 'CARD_MATCHED' ||
         message.type === 'TURN_CHANGED' ||
         message.type === 'GAME_COMPLETE';
}

export function isChatMessage(message: WebSocketMessage): message is WebSocketMessage & { data: { message: string; userId: string; username: string } } {
  return message.type === 'CHAT_MESSAGE';
}

export function isPlayerUpdate(message: WebSocketMessage): message is WebSocketMessage & { data: { player: GamePlayer } } {
  return message.type === 'PLAYER_JOINED' || 
         message.type === 'PLAYER_LEFT' ||
         message.type === 'PLAYER_READY';
}