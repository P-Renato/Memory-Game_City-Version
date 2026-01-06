import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';
import type { GameRoom } from '../types/types';

dotenv.config();

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined in .env file');
}

const client = new MongoClient(process.env.MONGODB_URI);
let dbConnection: Db | null = null;

export async function connectToDatabase(): Promise<Db> {
  if (dbConnection) {
    return dbConnection;
  }

  try {
    await client.connect();
    const db = client.db('memory_game');
    dbConnection = db;
    console.log('✅ Connected to MongoDB');
    return db;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

export function getDB(): Db {
  if (!dbConnection) {
    throw new Error('Database not connected. Call connectToDatabase first.');
  }
  return dbConnection;
}

export const connectDB = connectToDatabase;

// ✅ Add back the missing function
export function getUsersCollection() {
  return getDB().collection('users');
}

// ✅ Also add a rooms collection helper
export function getRoomsCollection() {
  return getDB().collection<GameRoom>('rooms');
}

export const collections = {
  users: () => getDB().collection('users'),
  rooms: () => getDB().collection('rooms'),
  gameHistory: () => getDB().collection('game_history'),
};

export async function initializeCollections() {
  try {
    await connectToDatabase();
    
    const rooms = collections.rooms();
    await rooms.createIndex({ id: 1 }, { unique: true });
    await rooms.createIndex({ status: 1 });
    await rooms.createIndex({ createdAt: -1 });
    
    console.log('✅ Database collections initialized');
  } catch (error) {
    console.error('Error initializing collections:', error);
  }
}