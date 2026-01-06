import type { Request, Response, NextFunction } from "express";
import type { AuthRequest } from "../middlawares/authMiddleware";
import { RoomService } from "../services/roomService";
import type { CreateRoomRequest, GamePlayer, GameRoom } from "../types/types";
import { getRoomsCollection } from "../db";
import { initializeCards, handleCardMatch, type Card } from '../../../client/src/lib/utils/cardLogic'
import type strict from "assert/strict";

let webSocketServer: any;

// Function to set WebSocket server (called from index.ts)
export function setWebSocketServer(wsServer: any) {
  webSocketServer = wsServer;
}

export const getAvailableRooms = async (req: Request, res: Response) => {
  try {
    const rooms = await RoomService.getAvailableRooms();

    console.log('📊 Rooms returned:', {
      count: rooms.length,
      rooms: rooms.map(r => ({ id: r.id, name: r.name, players: r.players?.length }))
    });

    res.json({
      success: true,
      rooms
    });
  } catch (error) {
    console.error('Error fetching available rooms:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rooms'
    });
  }
}

export const getRooms = async (req: Request, res: Response) => {
  try {
    console.log('📋 Fetching available rooms for user:', (req as AuthRequest).user?.userId);
    
    const rooms = await RoomService.getAllRooms();

    
    
    res.json({
      success: true,
      rooms
    });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rooms'
    });
  }
}

export const createRoom = async (req: Request, res: Response) => {
  try {
    console.log('📝 Creating room - Authenticated user:', (req as AuthRequest).user?.userId);
    
    const { name, maxPlayers, language, isPrivate, userId, username }: CreateRoomRequest = req.body;
    
    // Validate input
    if (!name || !maxPlayers || !language || !userId || !username) {
      return res.status(400).json({
        success: false,
        error: 'Name, maxPlayers, language, userId, and username are required'
      });
    }
    
    // Validate that the authenticated user matches the request userId
    if ((req as AuthRequest).user?.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'User ID mismatch'
      });
    }
    
    // Validate maxPlayers (2-4)
    if (maxPlayers < 2 || maxPlayers > 4) {
      return res.status(400).json({
        success: false,
        error: 'maxPlayers must be between 2 and 4'
      });
    }
    
    // Create the room
    const room = await RoomService.createRoom({
      name,
      maxPlayers,
      language,
      isPrivate: isPrivate || false,
      userId,
      username
    });
    
    console.log('✅ Room created:', room.id);
    
    res.status(201).json({
      success: true,
      room
    });
    
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create room'
    });
  }
}

export const getRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const room = await RoomService.getRoomById(id);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }
    
    res.json({
      success: true,
      room
    });
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch room'
    });
  }
}

export const joinRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as AuthRequest).user?.userId;
    const username = (req as AuthRequest).user?.username;

    console.log('👤 Attempting to join room:', {
      roomId: id,
      userId,
      username
    });
    
    if (!userId || !username) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    
    const room = await RoomService.getRoomById(id);
    
    if (!room) {
      console.log('❌ Room not found:', id);
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }

    console.log('📊 Room found:', {
      id: room.id,
      name: room.name,
      status: room.status,
      players: room.players.length,
      maxPlayers: room.maxPlayers
    });
    // Check if player is already in the room
    const existingPlayer = room.players.find((p: GamePlayer) => p.userId === userId);
    if (existingPlayer) {
      console.log('✅ Player already in room. Allowing rejoin:', userId);
      // Player is already in the room - this is a rejoin
      // Return the current room state
      return res.json({
        success: true,
        room,
        message: 'Rejoined existing room'
      });
    }
    
    if (room.status !== 'waiting') {
      console.log('❌ Room not accepting players. Status:', room.status);
      return res.status(400).json({
        success: false,
        error: 'Room is not accepting new players'
      });
    }
    
    if (room.players.length >= room.maxPlayers) {
      console.log('❌ Room is full:', room.players.length, '/', room.maxPlayers);
      return res.status(400).json({
        success: false,
        error: 'Room is full'
      });
    }
    
    // Check if already in room
    if (room.players.some((p: GamePlayer) => p.userId === userId)) {
      console.log('⚠️ Player already in room:', userId);
      return res.status(400).json({
        success: false,
        error: 'You are already in this room'
      });
    }
    
    // Add player to room
    const newPlayer = {
      userId,
      username,
      score: 0,
      isReady: false,
      isHost: false
    };
    
    room.players.push(newPlayer);
    
    const roomsCollection = getRoomsCollection(); 
    await roomsCollection.updateOne(
      { id },
      { $push: { players: newPlayer } }
    );
    
    res.json({
      success: true,
      room
    });
    
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to join room'
    });
  }
}

export const deleteRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as AuthRequest).user?.userId;
    
    const room = await RoomService.getRoomById(id);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }
    
    // Check if user is the host
    if (room.host !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Only the host can delete the room'
      });
    }
    
    // Use the RoomService delete method
    const deleted = await RoomService.deleteRoom(id);
    
    if (!deleted) {
      throw new Error('Failed to delete room');
    }
    
    res.json({
      success: true,
      message: 'Room deleted'
    });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete room'
    });
  }
};

// Mark player as ready
export const playerReady = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as AuthRequest).user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    
    const room = await RoomService.getRoomById(id);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }
    
    // Find the player and toggle ready status
    const playerIndex = room.players.findIndex((p: GamePlayer) => p.userId === userId);
    
    if (playerIndex === -1) {
      return res.status(400).json({
        success: false,
        error: 'Player not in room'
      });
    }
    
    // Toggle ready status (if not host)
    if (!room.players[playerIndex].isHost) {
      room.players[playerIndex].isReady = !room.players[playerIndex].isReady;
    }
    
    // Update in database
    const roomsCollection = getRoomsCollection();
    await roomsCollection.updateOne(
      { id },
      { 
        $set: { 
          [`players.${playerIndex}.isReady`]: room.players[playerIndex].isReady
        }
      }
    );
    
    res.json({
      success: true,
      room
    });
    
  } catch (error) {
    console.error('Error toggling ready status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update ready status'
    });
  }
}

// Host starts the game
export const startGame = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as AuthRequest).user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    
    const room = await RoomService.getRoomById(id);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }
    
    // Check if user is host
    if (room.host !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Only host can start the game'
      });
    }
    
    // Check if at least 2 players
    if (room.players.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Need at least 2 players to start'
      });
    }
    
    // Check if all players (except host) are ready
    const allReady = room.players.every((p: GamePlayer) => p.isReady || p.isHost);
    if (!allReady) {
      return res.status(400).json({
        success: false,
        error: 'Not all players are ready'
      });
    }
    
    // Initialize game state
    const gameState = {
      cards: initializeCards(room.settings.language, room.settings.cardCount || 12),
      currentTurn: room.players[0].userId, // First player starts
      matchedPairs: 0,
      isGameComplete: false,
      flippedCards: [], // Array of currently flipped card indices
      lastMove: null
    };
    
    // Update room status
    const roomsCollection = getRoomsCollection();
    await roomsCollection.updateOne(
      { id },
      { 
        $set: { 
          status: 'playing',
          gameState: gameState
        }
      }
    );
    
    room.status = 'playing';
    room.gameState = gameState;
    
    console.log(`🎮 Game started in room ${room.name} with ${room.players.length} players`);
    
    res.json({
      success: true,
      room
    });
    
  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start game'
    });
  }
}

// Handle game actions (card flips, etc.)
export const gameAction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action, cardIndex, cardId } = req.body;
    const userId = (req as AuthRequest).user?.userId;
    const username = (req as AuthRequest).user?.username;

    console.log(`🎮 Game action: ${action} by ${username} in room ${id}`);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    
    const room: GameRoom = await RoomService.getRoomById(id);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }
    
    // Check if game is playing
    if (room.status !== 'playing') {
      return res.status(400).json({
        success: false,
        error: 'Game is not in progress'
      });
    }
    
    // Check if it's player's turn
    if (room.gameState?.currentTurn !== userId) {
      return res.status(400).json({
        success: false,
        error: 'Not your turn'
      });
    }
    
    // Handle different actions
    let updatedRoom = { ...room };

    if (webSocketServer) {
      // Notify all players in the room
      const userIds = room.players.map(p => p.userId);
      webSocketServer.broadcastToUsers(userIds, {
        type: 'GAME_UPDATE',
        data: {
          room: updatedRoom,
          action: 'CARD_FLIPPED',
          playerId: userId,
          cardIndex: cardIndex
        },
        timestamp: new Date()
      });
      console.log(`📢 Notified ${userIds.length} players via WebSocket`);
    }

    switch (action) {
      case 'FLIP_CARD':
        if (cardIndex === undefined || cardIndex < 0 || cardIndex >= room.gameState.cards.length) {
          return res.status(400).json({
            success: false,
            error: 'Invalid card index'
          });
        }
        
        updatedRoom = handleFlipCard(room, userId, cardIndex);
        
        // After flipping, if we have 2 cards and they don't match, end turn
        if (updatedRoom.gameState.flippedCards?.length === 0 && 
            room.gameState.flippedCards?.length === 2) {
          // This means checkForMatch was called and cards didn't match
          // We'll end the turn after a delay (handled by frontend)
        }
        break;
        
      case 'END_TURN':
        updatedRoom = endTurn(room);
        break;
        
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action'
        });
    }

    // Save to database
    const roomsCollection = getRoomsCollection();
    await roomsCollection.updateOne(
      { id },
      { $set: { 
        gameState: updatedRoom.gameState,
        players: updatedRoom.players 
      } }
    );
    
    console.log(`✅ Game state updated for room ${room.name}`);
    
    // For now, just return the room
    res.json({
      success: true,
      room: updatedRoom
    });
    
  } catch (error) {
    console.error('Error processing game action:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process game action'
    });
  }
}



function handleFlipCard(room: any, userId: string, cardIndex: number): any {
  const { gameState } = room;
  const card = gameState.cards[cardIndex];
  
  console.log(`🃏 Flipping card ${cardIndex}: ${card.city} (matched: ${card.matched}, flipped: ${card.flipped})`);
  
  // Can't flip already matched or flipped cards
  if (card.matched || card.flipped) {
    console.log(`❌ Card ${cardIndex} already ${card.matched ? 'matched' : 'flipped'}`);
    return room;
  }
  
  // Flip the card
  const updatedCards = [...gameState.cards];
  updatedCards[cardIndex] = { ...card, flipped: true };
  
  // Add to flipped cards
  const updatedFlippedCards = [...gameState.flippedCards, cardIndex];
  
  const updatedGameState = {
    ...gameState,
    cards: updatedCards,
    flippedCards: updatedFlippedCards,
    lastMove: {
      playerId: userId,
      cardIndex,
      timestamp: new Date()
    }
  };
  
  console.log(`✅ Card ${cardIndex} flipped. Total flipped: ${updatedFlippedCards.length}`);
  
  // Check if we have 2 cards flipped
  if (updatedFlippedCards.length === 2) {
    console.log(`🎯 Checking for match between cards ${updatedFlippedCards[0]} and ${updatedFlippedCards[1]}`);
    return checkForMatch({ ...room, gameState: updatedGameState });
  }
  
  return { ...room, gameState: updatedGameState };
}

// Update the checkForMatch function
function checkForMatch(room: any): any {
  const { gameState, players } = room;
  const [firstIndex, secondIndex] = gameState.flippedCards;
  
  if (firstIndex === undefined || secondIndex === undefined) {
    return room;
  }
  
  const firstCard = gameState.cards[firstIndex];
  const secondCard = gameState.cards[secondIndex];
  
  const isMatch = firstCard.city === secondCard.city;
  
  console.log(`🔍 Cards match? ${isMatch} (${firstCard.city} vs ${secondCard.city})`);
  
  let updatedCards = [...gameState.cards];
  let updatedPlayers = [...players];
  
  if (isMatch) {
    // Mark cards as matched
    updatedCards[firstIndex] = { ...firstCard, matched: true, flipped: true };
    updatedCards[secondIndex] = { ...secondCard, matched: true, flipped: true };
    
    // Update score for current player
    const playerIndex = updatedPlayers.findIndex(p => p.userId === gameState.currentTurn);
    if (playerIndex !== -1) {
      updatedPlayers[playerIndex] = {
        ...updatedPlayers[playerIndex],
        score: (updatedPlayers[playerIndex].score || 0) + 1
      };
    }
    
    // Update matched pairs count
    const matchedPairs = updatedCards.filter(card => card.matched).length / 2;
    
    // Check if game is complete
    const totalPairs = updatedCards.length / 2;
    const isGameComplete = matchedPairs === totalPairs;
    
    const updatedGameState = {
      ...gameState,
      cards: updatedCards,
      matchedPairs,
      isGameComplete,
      flippedCards: [] // Clear flipped cards after match
    };
    
    
    if (isGameComplete) {
      console.log(`🏆 Game complete in room ${room.name}!`);
      // Game ends - no turn switching needed
      return {
        ...room,
        players: updatedPlayers,
        gameState: updatedGameState
      };
    }
    
    // Player gets another turn after a match
    return {
      ...room,
      players: updatedPlayers,
      gameState: updatedGameState
    };
    
  } else {
    // No match - prepare for turn switch
    console.log(`❌ No match. Switching turn...`);
    const updatedGameState = {
      ...gameState,
      flippedCards: [] // Clear flipped cards, they'll be flipped back when turn ends
    };
    
    return { ...room, gameState: updatedGameState };
  }
}

// Update the endTurn function
function endTurn(room: any): any {
  const { gameState, players } = room;
  
  // Find current player index
  const currentPlayerIndex = players.findIndex((p: any) => p.userId === gameState.currentTurn);
  
  // Move to next player
  const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
  const nextPlayer = players[nextPlayerIndex];
  
  console.log(`🔄 Switching turn from ${players[currentPlayerIndex]?.username} to ${nextPlayer.username}`);
  
  // Flip back any unflipped cards
  const updatedCards = gameState.cards.map((card: Card) => 
    card.flipped && !card.matched ? { ...card, flipped: false } : card
  );
  
  const updatedGameState = {
    ...gameState,
    cards: updatedCards,
    currentTurn: nextPlayer.userId,
    currentTurnIndex: nextPlayerIndex,
    flippedCards: []
  };
  
  return { ...room, gameState: updatedGameState };
}