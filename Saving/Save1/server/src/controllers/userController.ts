import type { Request, Response, NextFunction } from "express";
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { generateToken, verifyToken } from "../utils/auth";
import type { RegisterRequest, LoginRequest } from "../types/types";
import { connectToDatabase, getUsersCollection } from "../db";

dotenv.config();

export const registerUser = async ( req: Request, res: Response, next: NextFunction) => {
    try {
    console.log('Registration attempt:', req.body);
    
    const { username, email, password }: RegisterRequest = req.body;

    // 1. Validate input
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username, email, and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters'
      });
    }

    // 2. Connect to database
    await connectToDatabase();
    const users = getUsersCollection();

    // 3. Check if user already exists
    const existingUser = await users.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({
          success: false,
          error: 'Email already registered'
        });
      } else {
        return res.status(400).json({
          success: false,
          error: 'Username already taken'
        });
      }
    }

    // 4. Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 5. Create user document
    const newUser = {
      username,
      email,
      passwordHash,
      createdAt: new Date(),
      stats: {
        gamesPlayed: 0,
        wins: 0,
        bestScore: 0
      }
    };

    // 6. Save to database
    const result = await users.insertOne(newUser);
    console.log('User created with ID:', result.insertedId);

    // 7. Generate JWT token
    const token = generateToken(
      {
        userId: result.insertedId.toString(),
        email: newUser.email,
        username: newUser.username
      }
    );

    // 8. Return success response
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: result.insertedId.toString(),
        username: newUser.username,
        email: newUser.email
      },
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during registration'
    });
  }
}

export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
    console.log('Login attempt:', req.body);
    
    const { login, password }: LoginRequest = req.body;

    // 1. Validate input
    if (!login || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // 2. Connect to database
    await connectToDatabase();
    const users = getUsersCollection();

    // 3. Find user by email
    const user = await users.findOne({ 
        $or: [
            { email: login },
            { username: login }
        ]
     });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // 4. Check password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // 5. Generate JWT token
    const token = generateToken(
      {
        userId: user._id.toString(),
        email: user.email,
        username: user.username
      }
    );

    // 6. Return success response
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        stats: user.stats
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during login'
    });
  }
}