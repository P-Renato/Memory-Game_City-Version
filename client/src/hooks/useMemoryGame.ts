
import { useState, useEffect, useCallback } from "react";
import { type Card, handleCardMatch } from "../lib/utils/cardLogic";
import { loadAudioCache } from "../lib/utils/audioHelpers";
import { initializeCards } from "../lib/utils/cardLogic";
import type { AudioCache } from "../lib/audioCache";
import { cityByLanguage } from "../lib/db"; 
import type { Language } from "../lib/utils/languageHelper";

type LanguageKey = keyof typeof cityByLanguage;
export interface GameState {
  cards: Card[];
  firstCard: number | null;
  secondCard: number | null;
  lockBoard: boolean;
  audioCache: AudioCache | null;
  matchedPairs: number;
  isGameComplete: boolean;
}

export function useMemoryGame(language: Language) {
  const [gameState, setGameState] = useState<GameState>({
    cards: [],
    firstCard: null,
    secondCard: null,
    lockBoard: false,
    audioCache: null,
    matchedPairs: 0,
    isGameComplete: false
  });

  // Initialize cards when language changes
  useEffect(() => {
    const timer = setTimeout(() => {
      const newCards = initializeCards(language);
      setGameState(prev => ({ ...prev, cards: newCards }));
    }, 0);

    return () => clearTimeout(timer);
  }, [language]);

  // Load audio cache
  useEffect(() => {
    loadAudioCache().then(audioCache => {
      setGameState(prev => ({ ...prev, audioCache }));
    });
  }, []);

  // Reset turn helper
  const resetTurn = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      firstCard: null,
      secondCard: null,
      lockBoard: false
    }));
  }, []);

  // Handle card click logic
  const handleCardClick = useCallback((cardIndex: number) => {
    const { cards, firstCard, lockBoard, audioCache } = gameState;
    
    if (lockBoard) return;

    const card = cards[cardIndex];
    if (card.flipped || card.matched) return;

    // Play audio
    if (audioCache && audioCache[language as LanguageKey]?.[card.city]) {
      const languageCache = audioCache[language as LanguageKey];
      if (languageCache && languageCache[card.city]) {
        const originalAudio = languageCache[card.city];
        const audio = originalAudio.cloneNode() as HTMLAudioElement;
        audio.currentTime = 0;
        audio.play().catch(error => {
          console.warn('Audio play failed:', error);
        });
      }
    }

    // Flip the card
    const newCards = cards.map((c, i) => 
      i === cardIndex ? { ...c, flipped: true } : c
    );

    setGameState(prev => ({ ...prev, cards: newCards }));

    if (firstCard === null) {
      setGameState(prev => ({ ...prev, firstCard: cardIndex }));
    } else {
      setGameState(prev => ({ 
        ...prev, 
        secondCard: cardIndex, 
        lockBoard: true 
      }));

      // Handle card matching
      setTimeout(() => {
        const result = handleCardMatch(newCards, firstCard, cardIndex);
        
        setGameState(prev => ({
          ...prev,
          cards: result.updatedCards,
          matchedPairs: result.matchedPairs,
          isGameComplete: result.isGameComplete
        }));
        
        resetTurn();
      }, cards[firstCard].city === cards[cardIndex].city ? 600 : 1000);
    }
  }, [gameState, language, resetTurn]);

  return {
    gameState,
    handleCardClick,
    resetTurn
  };
}