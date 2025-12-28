// server/services/roomService.ts
import { getRoomsCollection } from '../db';

// In-memory store for ACTIVE rooms
const activeRooms = new Map<string, any>();

export class RoomService {
  // Create a new room
  static async createRoom(data: any): Promise<any> {
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const room = {
      id: roomId,
      name: data.name,
      host: data.userId,
      players: [{
        userId: data.userId,
        username: data.username,
        score: 0,
        isReady: true,
        isHost: true
      }],
      maxPlayers: Math.min(data.maxPlayers, 4),
      status: 'waiting',
      gameState: {
        cards: [],
        currentTurn: '',
        matchedPairs: 0,
        isGameComplete: false,
        flippedCards: [],
        lastMove: null
      },
      settings: {
        language: data.language,
        cardCount: 12,
        isPrivate: data.isPrivate || false
      },
      createdAt: new Date()
    };

    // Save to database
    const roomsCollection = await getRoomsCollection();
    await roomsCollection.insertOne(room);

    console.log('✅ Room created:', roomId);
    
    // Store in memory
    activeRooms.set(roomId, room);

    return room;
  }
  
  // 1. Get ALL rooms (for admin/viewing all)
  static async getAllRooms(): Promise<any[]> {
    const roomsCollection = await getRoomsCollection();
    const rooms = await roomsCollection
      .find()
      .sort({ createdAt: -1 })
      .toArray();
    
    return rooms.map(room => ({
      id: room.id,
      name: room.name,
      host: room.host,
      players: room.players || [],
      playerCount: room.players?.length || 0,
      maxPlayers: room.maxPlayers,
      status: room.status,
      settings: room.settings,
      createdAt: room.createdAt,
      isFull: (room.players?.length || 0) >= room.maxPlayers
    }));
  }

  // 2. Get ONLY available rooms (for joining - filters out full/playing rooms)
  static async getAvailableRooms(): Promise<any[]> {
    const roomsCollection = await getRoomsCollection();
    const rooms = await roomsCollection
      .find({ 
        status: 'waiting',
        // MongoDB query to filter out full rooms
        $expr: { $lt: [{ $size: "$players" }, "$maxPlayers"] }
      })
      .sort({ createdAt: -1 })
      .toArray();
    
    return rooms.map(room => ({
      id: room.id,
      name: room.name,
      host: room.host,
      players: room.players || [],
      playerCount: room.players?.length || 0,
      maxPlayers: room.maxPlayers,
      status: room.status,
      settings: room.settings,
      createdAt: room.createdAt,
      isFull: false // By definition, these aren't full
    }));
  }


  // Get room by ID
  static async getRoomById(roomId: string): Promise<any | null> {
    const roomsCollection = await getRoomsCollection();
    const room = await roomsCollection.findOne({ id: roomId });
    return room;
  }

  static getActiveRooms(): Map<string, any> {
    return activeRooms; // Return the in-memory Map
  }

  static async deleteRoom(roomId: string): Promise<boolean> {
    try {
      const roomsCollection = await getRoomsCollection();
      await roomsCollection.deleteOne({ id: roomId });
      
      // Also remove from memory
      activeRooms.delete(roomId);
      
      return true;
    } catch (error) {
      console.error('Error deleting room:', error);
      return false;
    }
  }
}