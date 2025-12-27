import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined in .env file');
}

const client = new MongoClient(process.env.MONGODB_URI);
let dbConnection: any = null;

export async function connectToDatabase() {
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

export function getUsersCollection() {
  if (!dbConnection) {
    throw new Error('Database not connected. Call connectToDatabase first.');
  }
  return dbConnection.collection('users');
}