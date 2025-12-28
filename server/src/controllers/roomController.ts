import type { Request, Response, NextFunction } from "express";
import type { AuthRequest } from "../middlawares/authMiddleware";
import { RoomService } from "../services/roomService";
import type { CreateRoomRequest, GamePlayer } from "../types/types";
import { getRoomsCollection } from "../db";


export const getAvailableRooms = async (req: Request, res: Response) => {
  try {
    const rooms = await RoomService.getAvailableRooms();
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
    
    if (!userId || !username) {
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
    
    if (room.status !== 'waiting') {
      return res.status(400).json({
        success: false,
        error: 'Room is not accepting new players'
      });
    }
    
    if (room.players.length >= room.maxPlayers) {
      return res.status(400).json({
        success: false,
        error: 'Room is full'
      });
    }
    
    // Check if already in room
    if (room.players.some((p: GamePlayer) => p.userId === userId)) {
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
}