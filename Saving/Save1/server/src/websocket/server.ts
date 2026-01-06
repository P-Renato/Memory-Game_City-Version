// server/src/websocket/server.ts - UPDATED WITH GAME LOGIC
import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { verifyToken } from '../utils/auth';
import { getRoomsCollection } from '../db';
import type { Card } from '../types/types';

// Declare wss at module level
let wss: WebSocketServer;

interface WebSocketClient extends WebSocket {
  userId?: string;
  username?: string;
  roomId?: string;
  isAlive?: boolean;
}

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: Date;
}

// Game state manager
class GameManager {
  static async processCardFlip(roomId: string, userId: string, cardIndex: number) {
    const roomsCollection = getRoomsCollection();
    const room = await roomsCollection.findOne({ id: roomId });
    
    if (!room || room.status !== 'playing') {
      throw new Error('Game is not in progress');
    }
    
    // Check if it's player's turn
    if (room.gameState.currentTurn !== userId) {
      throw new Error('Not your turn');
    }
    
    const card = room.gameState.cards[cardIndex];
    if (!card || card.flipped || card.matched) {
      throw new Error('Invalid card');
    }
    
    // Flip the card
    const updatedCards = [...room.gameState.cards];
    updatedCards[cardIndex] = { ...card, flipped: true };
    
    // Add to flipped cards
    const currentFlipped = room.gameState.flippedCards || [];
    const updatedFlippedCards = [...currentFlipped, cardIndex];
    
    // Update game state
    const updatedGameState = {
      ...room.gameState,
      cards: updatedCards,
      flippedCards: updatedFlippedCards
    };
    
    // Check if we have 2 cards flipped
    if (updatedFlippedCards.length === 2) {
      const [firstIndex, secondIndex] = updatedFlippedCards;
      const firstCard = updatedCards[firstIndex];
      const secondCard = updatedCards[secondIndex];
      
      // Check for match
      if (firstCard.city === secondCard.city) {
        // MATCH FOUND
        updatedCards[firstIndex] = { ...firstCard, matched: true };
        updatedCards[secondIndex] = { ...secondCard, matched: true };
        
        // Update player score
        const playerIndex = room.players.findIndex(p => p.userId === userId);
        if (playerIndex !== -1) {
          room.players[playerIndex].score = (room.players[playerIndex].score || 0) + 1;
        }
        
        // Update matched pairs
        const matchedPairs = updatedCards.filter(c => c.matched).length / 2;
        
        // Check if game is complete
        const totalPairs = updatedCards.length / 2;
        const isGameComplete = matchedPairs === totalPairs;
        
        const finalGameState = {
          ...updatedGameState,
          cards: updatedCards,
          flippedCards: [], // Clear flipped cards after match
          matchedPairs,
          isGameComplete
        };
        
        if (isGameComplete) {
          room.status = 'finished';
        }
        
        // Save to database
        await roomsCollection.updateOne(
          { id: roomId },
          { 
            $set: { 
              gameState: finalGameState,
              players: room.players,
              status: room.status
            }
          }
        );
        
        return {
          ...room,
          gameState: finalGameState,
          matchResult: 'MATCH',
          playerGetsAnotherTurn: true // Player gets another turn after match
        };
        
      } else {
        // NO MATCH - Prepare for turn switch
        // Save current state (cards remain flipped)
        await roomsCollection.updateOne(
          { id: roomId },
          { 
            $set: { 
              gameState: updatedGameState
            }
          }
        );
        
        return {
          ...room,
          gameState: updatedGameState,
          matchResult: 'NO_MATCH',
          playerGetsAnotherTurn: false
        };
      }
    } else {
      // Only 1 card flipped - save state
      await roomsCollection.updateOne(
        { id: roomId },
        { 
          $set: { 
            gameState: updatedGameState
          }
        }
      );
      
      return {
        ...room,
        gameState: updatedGameState,
        matchResult: 'FLIPPED_ONE'
      };
    }
  }
  
  static async switchTurn(roomId: string) {
    const roomsCollection = getRoomsCollection();
    const room = await roomsCollection.findOne({ id: roomId });
    
    if (!room || room.status !== 'playing') return null;
    
    // Find current player index
    const currentPlayerIndex = room.players.findIndex(p => p.userId === room.gameState.currentTurn);
    if (currentPlayerIndex === -1) return null;
    
    // Move to next player
    const nextPlayerIndex = (currentPlayerIndex + 1) % room.players.length;
    const nextPlayer = room.players[nextPlayerIndex];
    
    // Flip back any unflipped cards
    const updatedCards = room.gameState.cards.map(card => 
      card.flipped && !card.matched ? { ...card, flipped: false } : card
    );
    
    const updatedGameState = {
      ...room.gameState,
      cards: updatedCards,
      currentTurn: nextPlayer.userId,
      flippedCards: []
    };
    
    // Save to database
    await roomsCollection.updateOne(
      { id: roomId },
      { 
        $set: { 
          gameState: updatedGameState
        }
      }
    );
    
    return {
      ...room,
      gameState: updatedGameState
    };
  }


  
  static async endTurn(roomId: string) {
    const roomsCollection = getRoomsCollection();
    const room = await roomsCollection.findOne({ id: roomId });
    
    if (!room || room.status !== 'playing') {
      return null;
    }
    
    // Find current player index
    const currentPlayerIndex = room.players.findIndex(p => p.userId === room.gameState.currentTurn);
    if (currentPlayerIndex === -1) return null;
    
    // Move to next player
    const nextPlayerIndex = (currentPlayerIndex + 1) % room.players.length;
    const nextPlayer = room.players[nextPlayerIndex];
    
    // Flip back any unflipped cards
    const updatedCards = room.gameState.cards.map((card: Card) => 
      card.flipped && !card.matched ? { ...card, flipped: false } : card
    );
    
    const updatedGameState = {
      ...room.gameState,
      cards: updatedCards,
      currentTurn: nextPlayer.userId,
      flippedCards: []
    };
    
    // Save to database
    await roomsCollection.updateOne(
      { id: roomId },
      { 
        $set: { 
          gameState: updatedGameState
        }
      }
    );
    
    return {
      ...room,
      gameState: updatedGameState
    };
  }
}

export function createWebSocketServer(server: Server) {
  wss = new WebSocketServer({ 
    server,
    path: '/ws'
  });

  console.log('🔌 WebSocket server created at /ws');

  // Heartbeat to keep connections alive
  const interval = setInterval(() => {
    wss.clients.forEach((ws: WebSocketClient) => {
      if (ws.isAlive === false) {
        console.log('💔 Terminating dead connection');
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('connection', (ws: WebSocketClient, request) => {
    console.log('🔌 New WebSocket connection attempt');
    
    let token: string | null = null;
    
    if (request.url) {
      try {
        const fullUrl = new URL(request.url, `http://${request.headers.host}`);
        token = fullUrl.searchParams.get('token');
        
        if (!token && request.url.includes('token=')) {
          const match = request.url.match(/token=([^&]+)/);
          token = match ? match[1] : null;
        }
      } catch (error) {
        const match = request.url.match(/[?&]token=([^&]+)/);
        token = match ? match[1] : null;
      }
    }
    
    if (!token) {
      console.log('❌ No token provided, closing connection');
      ws.close(1008, 'No token provided');
      return;
    }

    try {
      const decoded = verifyToken(token);
      ws.userId = decoded.userId;
      ws.username = decoded.username;
      console.log(`✅ WebSocket authenticated for user: ${decoded.username} (${decoded.userId})`);
    } catch (error) {
      console.log('❌ Invalid token:', error);
      ws.close(1008, 'Invalid token');
      return;
    }

    // Setup message handler
    ws.on('message', async (data: string) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        await handleWebSocketMessage(ws, message);
      } catch (error) {
        console.error('❌ WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'ERROR',
          data: { error: 'Invalid message format' },
          timestamp: new Date()
        }));
      }
    });

    // Setup pong handler for heartbeat
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Handle close
    ws.on('close', (code, reason) => {
      console.log(`🔌 WebSocket closed: ${ws.username} (${ws.userId})`);
      
      if (ws.roomId && ws.userId) {
        broadcastToRoom(ws.roomId, {
          type: 'PLAYER_LEFT',
          data: { 
            userId: ws.userId, 
            username: ws.username 
          },
          timestamp: new Date()
        });
      }
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });

    console.log(`✅ WebSocket connection established for ${ws.username}`);
  });

  // Cleanup on server close
  wss.on('close', () => {
    clearInterval(interval);
    console.log('🔌 WebSocket server closed');
  });

  return wss;
}

async function handleWebSocketMessage(ws: WebSocketClient, message: WebSocketMessage) {
  const { type, data } = message;
  
  switch (type) {
    case 'JOIN_ROOM':
      if (!data?.roomId) {
        ws.send(JSON.stringify({
          type: 'ERROR',
          data: { error: 'Missing roomId' },
          timestamp: new Date()
        }));
        return;
      }
      
      ws.roomId = data.roomId;
      console.log(`👤 ${ws.username} joined room ${data.roomId}`);
      
      // Send current room state
      const roomsCollection = getRoomsCollection();
      const room = await roomsCollection.findOne({ id: data.roomId });
      
      if (room) {
        ws.send(JSON.stringify({
          type: 'ROOM_STATE',
          data: { room },
          timestamp: new Date()
        }));
      }
      
      // Notify others
      broadcastToRoom(data.roomId, {
        type: 'PLAYER_JOINED',
        data: { 
          userId: ws.userId, 
          username: ws.username 
        },
        timestamp: new Date()
      });
      break;
      
    if (!ws.roomId || !ws.userId) return;
      
      try {
        const result = await GameManager.processCardFlip(
          ws.roomId, 
          ws.userId, 
          data.cardIndex
        );
        
        // Broadcast the card flip
        broadcastToRoom(ws.roomId, {
          type: 'GAME_UPDATE',
          data: {
            room: result,
            action: 'CARD_FLIPPED',
            playerId: ws.userId,
            username: ws.username,
            cardIndex: data.cardIndex,
            matchResult: result.matchResult
          },
          timestamp: new Date()
        });
        
        // If no match and we have 2 cards flipped, switch turns after delay
        if (result.matchResult === 'NO_MATCH') {
          console.log('⏰ Scheduling turn switch in 2 seconds...');
          
          setTimeout(async () => {
            const turnSwitchedRoom = await GameManager.switchTurn(ws.roomId!);
            if (turnSwitchedRoom) {
              broadcastToRoom(ws.roomId!, {
                type: 'TURN_CHANGED',
                data: {
                  room: turnSwitchedRoom,
                  previousPlayerId: ws.userId,
                  newPlayerId: turnSwitchedRoom.gameState.currentTurn,
                  reason: 'NO_MATCH'
                },
                timestamp: new Date()
              });
            }
          }, 2000); // 2 second delay to show cards
        }
        
        // If match, player gets another turn - no turn switch needed
        if (result.matchResult === 'MATCH') {
          broadcastToRoom(ws.roomId, {
            type: 'CARD_MATCHED',
            data: {
              room: result,
              playerId: ws.userId,
              username: ws.username,
              points: 1
            },
            timestamp: new Date()
          });
        }
        
      } catch (error) {
        console.error('Error processing card flip:', error);
        ws.send(JSON.stringify({
          type: 'ERROR',
          data: { error: (error as Error).message },
          timestamp: new Date()
        }));
      }
      break;
      
    case 'END_TURN':
      if (!ws.roomId) {
        return;
      }
      
      try {
        const updatedRoom = await GameManager.endTurn(ws.roomId);
        if (updatedRoom) {
          broadcastToRoom(ws.roomId, {
            type: 'TURN_CHANGED',
            data: { 
              room: updatedRoom,
              previousPlayerId: ws.userId,
              newPlayerId: updatedRoom.gameState.currentTurn
            },
            timestamp: new Date()
          });
        }
      } catch (error) {
        console.error('Error ending turn:', error);
      }
      break;
      
    case 'TEST':
      ws.send(JSON.stringify({
        type: 'TEST_RESPONSE',
        data: { message: 'Test successful', received: data },
        timestamp: new Date()
      }));
      break;
      
    default:
      console.warn(`⚠️ Unknown message type: ${type}`);
  }
}

function broadcastToRoom(roomId: string, message: any) {
  if (!wss) {
    console.error('❌ Cannot broadcast: wss not initialized');
    return;
  }
  
  let sentCount = 0;
  wss.clients.forEach((client: WebSocketClient) => {
    if (client.roomId === roomId && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
      sentCount++;
    }
  });
  
  if (sentCount > 0) {
    console.log(`📤 Sent ${message.type} to ${sentCount} clients in room ${roomId}`);
  }
}

// Export for use in controllers
export { wss, broadcastToRoom };