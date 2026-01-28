// client/src/context/GameContext.tsx
import { createContext, useState, useCallback, type ReactNode } from 'react';
import type { Card, GameRoom } from '../types/index';
import { apiClient } from '../lib/api-client';
import { playAudio as playAudioFromCache } from '../lib/audioCache';
import type { Language } from '../lib/utils/languageHelper';

interface GameContextType {
  // Multiplayer room state
  currentRoom: GameRoom | null;
  setCurrentRoom: (room: GameRoom | null) => void;
  
  // Local game state (for single player or visual sync)
  localCards: Card[];
  setLocalCards: (cards: Card[]) => void;
  matchedPairs: number;
  setMatchedPairs: (pairs: number) => void;
  
  // Audio
  // audioCache: Record<string, HTMLAudioElement> | null;
  // loadAudioCache: () => Promise<void>;
  playAudio: (cityKey: string, language: Language) => void;
  
  // Room actions
  joinRoom: (roomId: string) => Promise<boolean>;
  leaveRoom: () => void;
  startGame: () => Promise<boolean>;
  flipCard: (cardIndex: number) => Promise<boolean>;
  
  // Status
  isLoading: boolean;
  error: string | null;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);
  const [localCards, setLocalCards] = useState<Card[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  // const [audioCache, setAudioCache] = useState<Record<string, HTMLAudioElement> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load audio cache
  // const loadAudioCache = useCallback(async () => {

  //   console.log('Loading audio cache...');
  // }, []);

  // Play audio in specific language
  // const playAudio = useCallback((cityKey: string, language: string) => {
  //   if (!audioCache) return;
    
  //   // You'll implement this based on your audio structure
  //   const audioKey = `${cityKey}_${language}`;
  //   const audio = audioCache[audioKey];
  const playAudio = useCallback((cityKey: string, language: Language) => {
    playAudioFromCache(cityKey, language);
  }, []);
    
  //   if (audio) {
  //     const audioClone = audio.cloneNode() as HTMLAudioElement;
  //     audioClone.currentTime = 0;
  //     audioClone.play().catch(console.warn);
  //   }
  // }, [audioCache]);

  // Join a room
  const joinRoom = useCallback(async (roomId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await apiClient.joinRoom(roomId);
      
      if (result.success && result.room) {
        setCurrentRoom(result.room);
        return true;
      }
      
      throw new Error(result.error || 'Failed to join room');
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Leave current room
  const leaveRoom = useCallback(() => {
    setCurrentRoom(null);
    setLocalCards([]);
    setMatchedPairs(0);
  }, []);

  // Start game (host only)
  const startGame = useCallback(async (): Promise<boolean> => {
    if (!currentRoom) return false;
    
    setIsLoading(true);
    setError(null);
    
    try {
       const result = await apiClient.startGame(currentRoom.id);
      
      if (result.success && result.room) {
        setCurrentRoom(result.room);
        
        // Sync local cards with server cards
        if (result.room.gameState?.cards) {
          setLocalCards(result.room.gameState.cards);
        }
        
        return true;
      }
      
      throw new Error(result.error || 'Failed to start game');
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentRoom]);

  // Flip a card
  const flipCard = useCallback(async (cardIndex: number): Promise<boolean> => {
    if (!currentRoom) return false;
    
    try {
      const result = await apiClient.sendGameAction(currentRoom.id, 'FLIP_CARD', cardIndex);
      
      if (result.success && result.room) {
        setCurrentRoom(result.room);
        
        // Update local cards immediately for responsiveness
        if (result.room.gameState?.cards) {
          setLocalCards(result.room.gameState.cards);
          setMatchedPairs(result.room.gameState.matchedPairs || 0);
        }
        
        return true;
      }
      
      throw new Error(result.error || 'Failed to flip card');
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  }, [currentRoom]);

  const value: GameContextType = {
    currentRoom,
    setCurrentRoom,
    localCards,
    setLocalCards,
    matchedPairs,
    setMatchedPairs,
    // audioCache,
    // loadAudioCache,
    playAudio,
    joinRoom,
    leaveRoom,
    startGame,
    flipCard,
    isLoading,
    error
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export { GameContext }