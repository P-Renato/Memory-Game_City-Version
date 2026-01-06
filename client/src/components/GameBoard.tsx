// client/src/components/GameBoard.tsx - FOCUSED MULTIPLAYER FIX
'use client';
import { useLanguage } from "../context/useLanguage";
import styles from '../lib/ui/home.module.css';
import { getImagePath } from "../lib/utils/gameHelpers";
import { cityByLanguage } from "../lib/db";
import { useAuth } from "../context/useAuth";
import { useGame } from "../context/useGame";
import type { GameRoom } from "../types/index";
import { useEffect, useState, useCallback } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import { useMemoryGame } from "../hooks/useMemoryGame";
// import { apiClient } from "../lib/api-client";

interface GameBoardProps {
  room?: GameRoom;
  isMultiplayer?: boolean;
  onGameUpdate?: (room: GameRoom) => void;
}

export default function GameBoard({ room: propRoom, isMultiplayer = false, onGameUpdate }: GameBoardProps) {
  const { gameLanguage } = useLanguage();
  const { user } = useAuth();
  const { playAudio } = useGame();

  const { gameState: singlePlayerState, handleCardClick: handleSinglePlayerClick } = useMemoryGame(gameLanguage);
  
  // Get room from WebSocket messages or prop
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(propRoom || null);
  const { isConnected, sendMessage, messages } = useWebSocket(currentRoom?.id);
  const [isFlipping, setIsFlipping] = useState(false);
  
  // Update room when prop changes
  useEffect(() => {
    if (propRoom) {
      setCurrentRoom(propRoom);
    }
  }, [propRoom]);
  
  // Handle WebSocket messages - FIXED TURN MANAGEMENT
  useEffect(() => {
    if (messages.length === 0) return;
    
    const lastMessage = messages[messages.length - 1];
    
    console.log('📨 WebSocket message:', lastMessage.type);
    
    switch (lastMessage.type) {
      case 'GAME_UPDATE':
        if (lastMessage.data?.room) {
          console.log('🔄 Game state updated');
          const updatedRoom = lastMessage.data.room;
          setCurrentRoom(updatedRoom);
          onGameUpdate?.(updatedRoom);
          
          // Check if we need to flip cards back (no match)
          // if (updatedRoom.gameState?.flippedCards?.length === 0 && 
          //     lastMessage.data.action === 'FLIP_CARD' &&
          //     lastMessage.data.playerId !== user?.id) {
          //   // Another player flipped cards that didn't match
          //   // The server already cleared flippedCards, we need to wait and flip back
          //   setTimeout(() => {
          //     console.log('⏰ Flipping cards back after no match');
          //   }, 1000);
          // }
          if (lastMessage.data.action === 'CARD_FLIPPED' && 
              lastMessage.data.cardIndex !== undefined &&
              updatedRoom.gameState?.cards?.[lastMessage.data.cardIndex] &&
              lastMessage.data.playerId !== user?.id) {
            
            const flippedCard = updatedRoom.gameState.cards[lastMessage.data.cardIndex];
            console.log(`🔊 Playing audio for opponent's card: ${flippedCard.city}`);
            
            // Use playAudio from GameContext
            playAudio(flippedCard.city, gameLanguage);
          }
        }
        break;
        
      case 'TURN_CHANGED':
        if (lastMessage.data?.room) {
          console.log('🔄 Turn changed to:', lastMessage.data.newPlayerId);
          setCurrentRoom(lastMessage.data.room);
          onGameUpdate?.(lastMessage.data.room);
        }
        break;
        
      case 'CARD_MATCHED':
        if (lastMessage.data?.room) {
          console.log('✅ Cards matched!');
          setCurrentRoom(lastMessage.data.room);
          onGameUpdate?.(lastMessage.data.room);
        }
        break;
        
      case 'ERROR':
        console.error('WebSocket error:', lastMessage.data?.error);
        break;
    }
  }, [messages, onGameUpdate, user?.id, playAudio, gameLanguage]);
  
  // Join room via WebSocket when connected
  useEffect(() => {
    if (isConnected && currentRoom?.id && !currentRoom.gameState?.cards) {
      console.log('🔄 Joining room via WebSocket');
      sendMessage('JOIN_ROOM', { roomId: currentRoom.id });
    }
  }, [isConnected, currentRoom?.id, currentRoom?.gameState?.cards, sendMessage]);
  
  // Handle multiplayer card click - FIXED TURN LOGIC
  const handleMultiplayerCardClick = useCallback(async (index: number) => {
    if (!isMultiplayer || !currentRoom || !user) {
      handleSinglePlayerClick(index);
      return;
    }
    
    // Game state checks
    if (currentRoom.status !== 'playing') {
      console.log("⏳ Game hasn't started yet!");
      return;
    }
    
    if (currentRoom.gameState?.currentTurn !== user.id) {
      console.log("⏳ Not your turn! Current turn:", currentRoom.gameState?.currentTurn);
      return;
    }
    
    const serverCard = currentRoom.gameState?.cards?.[index];
    if (!serverCard) {
      console.log("Card not found on server");
      return;
    }
    
    if (serverCard.flipped || serverCard.matched) {
      console.log("Card already flipped or matched");
      return;
    }
    
    if (isFlipping) return;
    
    setIsFlipping(true);
    
    try {
      console.log(`🎮 Flipping card ${index}`);
      
      // Count currently flipped cards
      const currentFlippedCount = currentRoom.gameState?.flippedCards?.length || 0;
      
      // Send flip message to WebSocket
      sendMessage('FLIP_CARD', { 
        cardIndex: index,
        currentFlippedCount
      });
      
      // Optimistically update local state
      const optimisticRoom = { ...currentRoom };
      if (optimisticRoom.gameState?.cards) {
        optimisticRoom.gameState.cards[index] = {
          ...optimisticRoom.gameState.cards[index],
          flipped: true
        };
        setCurrentRoom(optimisticRoom);
      }
      
    } catch (error) {
      console.error('Error flipping card:', error);
    } finally {
      setIsFlipping(false);
    }
  }, [isMultiplayer, currentRoom, user, handleSinglePlayerClick, isFlipping, sendMessage, playAudio, gameLanguage]);
  
  // Get translated city name
  // const getTranslatedCityName = (cityKey: string): string => {
  //   const langData = cityByLanguage[gameLanguage as keyof typeof cityByLanguage];
  //   if (langData && langData.items && cityKey in langData.items) {
  //   return langData.items[cityKey as keyof typeof langData.items];
  // }
  // return cityKey;
  // };
  const getTranslatedCityName = useCallback((cityKey: string): string => {
    const langData = cityByLanguage[gameLanguage as keyof typeof cityByLanguage];
    
    if (langData && langData.items) {
      // Type-safe check
      const items = langData.items as Record<string, string>;
      if (cityKey in items) {
        return items[cityKey];
      }
    }
    return cityKey;
  }, [gameLanguage]);

  // Use appropriate card data
  const displayCards = isMultiplayer && currentRoom?.gameState?.cards 
    ? currentRoom.gameState.cards
    : singlePlayerState.cards;
  
  // Check if game is complete
  const displayIsGameComplete = isMultiplayer
    ? currentRoom?.gameState?.isGameComplete || false
    : singlePlayerState.isGameComplete;
  
  if (displayIsGameComplete) {
    return (
      <div className={styles.results}>
        <h2>🎉 Game Complete! 🎉</h2>
        {isMultiplayer && currentRoom && user && (
          <div className={styles.multiplayerResults}>
            <h3>Final Scores:</h3>
            {currentRoom.players.map(player => (
              <div key={player.userId} className={styles.playerScore}>
                <span>{player.username}:</span>
                <strong>{player.score} points</strong>
                {player.userId === user.id && <span> (You)</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className={styles.gameContainer}>
      {/* Multiplayer Status Bar */}
      {isMultiplayer && currentRoom && user && (
        <div className={styles.multiplayerStatus}>
          <div className={styles.roomInfo}>
            <span className={styles.roomName}>{currentRoom.name}</span>
            <span className={`${styles.statusBadge} ${styles[currentRoom.status]}`}>
              {currentRoom.status.toUpperCase()}
            </span>
            <span className={styles.websocketStatus}>
              {isConnected ? '✅ WS' : '❌ WS'}
            </span>
          </div>
          
          <div className={styles.playersInfo}>
            {currentRoom.status === 'playing' && (
              <div className={styles.turnInfo}>
                <span className={currentRoom.gameState?.currentTurn === user.id ? styles.yourTurn : ''}>
                  {currentRoom.gameState?.currentTurn === user.id 
                    ? "🎮 YOUR TURN" 
                    : `${currentRoom.players.find(p => p.userId === currentRoom.gameState?.currentTurn)?.username || 'Someone'}'s turn`}
                </span>
              </div>
            )}
          </div>
          
          <div className={styles.scores}>
            {currentRoom.players.map(player => (
              <div 
                key={player.userId} 
                className={`${styles.playerScore} ${player.userId === user.id ? styles.currentPlayer : ''}`}
              >
                <span>{player.username}:</span>
                <strong>{player.score}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Game Board */}
      <section 
        className={styles.boardTable}
        style={{ backgroundImage: "url(/images/bg_city-memory_game.png)" }}
      >
        {displayCards.map((card, index) => {
          // Determine if card can be clicked
          let canClick = true;
          
          if (isMultiplayer && currentRoom) {
            canClick = currentRoom.status === 'playing' && 
                      currentRoom.gameState?.currentTurn === user?.id && 
                      !card.flipped && 
                      !card.matched &&
                      !isFlipping;
          } else {
            canClick = !singlePlayerState.lockBoard && 
                      !card.flipped && 
                      !card.matched;
          }
          
          return (
            <div
              key={card.id}
              className={`${styles.card} ${card.flipped || card.matched ? styles.flipped : ""} ${!canClick ? styles.disabled : ''}`}
              onClick={() => {
                if (isMultiplayer) {
                  handleMultiplayerCardClick(index);
                } else {
                  handleSinglePlayerClick(index);
                }
              }}
            >
              <div className={styles.cardInner}>
                <div className={styles.cardFront} />
                <div
                  className={styles.cardBack}
                  style={{
                    backgroundImage: `url(${getImagePath(card.city)})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <p className={styles.cityName}>{getTranslatedCityName(card.city)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}