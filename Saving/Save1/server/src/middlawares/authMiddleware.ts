import type { Request, Response, NextFunction } from "express";
import { verifyToken, type TokenPayload } from "../utils/auth";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    username: string;
  };
}

export const checkAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'No token provided' 
      });
    }
    
    // Use your existing verifyToken function
    const decoded = verifyToken(token) as TokenPayload;
    (req as AuthRequest).user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ 
      success: false,
      error: 'Invalid or expired token' 
    });
  }
};