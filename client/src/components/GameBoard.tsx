'use client';
import { useLanguage } from "../context/useLanguage";
import styles from '../lib/ui/home.module.css';
import { getImagePath } from "../lib/utils/gameHelpers";
import { useMemoryGame } from "../hooks/useMemoryGame";
import { useAuth } from "../context/useAuth";
import type { GameRoom } from "../types/index";
import { useEffect, useMemo } from "react";

interface GameBoardProps {
  room?: GameRoom;
  isMultiplayer?: boolean;
}

export default function GameBoard({ room, isMultiplayer = false }: GameBoardProps) {
  const { gameLanguage } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { gameState, handleCardClick } = useMemoryGame(gameLanguage);
  
  const localUser = useMemo(() => user, [user]);
  

  // Multiplayer logic
  useEffect(() => {
    if (isMultiplayer && room && localUser) {
      console.log("🎮 Multiplayer mode enabled for room:", room.id);
      console.log("👤 Current user ID:", localUser.id, "Username:", localUser.username);
      console.log("🔄 Game status:", room.status);
      
      // If game is playing, we might need to sync state from server
      if (room.status === 'playing' && room.gameState) {
        console.log("🃏 Server game state:", room.gameState);
      }
    } else if (isMultiplayer && room) {
      console.log("⏳ Waiting for user authentication...");
    }
  }, [isMultiplayer, room, localUser]);

  const handleMultiplayerCardClick = (index: number) => {
    if (!isMultiplayer || !room || !localUser) {
      // Single player mode
      handleCardClick(index);
      return;
    }

    // Multiplayer checks
    if (room.status !== 'playing') {
      console.log("⏳ Game hasn't started yet!");
      return;
    }

    if (room.gameState?.currentTurn !== localUser.id) {
      console.log("⏳ Not your turn! Current turn:", room.gameState?.currentTurn);
      return;
    }

    // TODO: Send card flip to server via WebSocket/API
    
    // For now, allow local click
    console.log(`🎮 Player ${localUser.username} flipped card ${index}`);
    handleCardClick(index);
    
    // After local flip, we should notify server
    // This will be replaced with WebSocket
    if (room.id) {
      fetch(`/api/rooms/${room.id}/game-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: localUser.id,
          action: 'FLIP_CARD',
          cardIndex: index,
          cardId: gameState.cards[index]?.id
        })
      }).catch(console.error);
    }
  };

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className={styles.loading}>
        <p>Loading user...</p>
      </div>
    );
  }

  // Show results when game is complete
  if (gameState.isGameComplete) {
    return (
      <div className={styles.results}>
        <h2>🎉 Game Complete! 🎉</h2>
        <p>You matched all {gameState.matchedPairs} pairs!</p>
        
        {isMultiplayer && room && localUser && (
          <div className={styles.multiplayerResults}>
            <h3>Final Scores:</h3>
            {room.players.map(player => (
              <div key={player.userId} className={styles.playerScore}>
                <span>{player.username}:</span>
                <strong>{player.score} points</strong>
                {player.userId === localUser.id && <span> (You)</span>}
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
      {isMultiplayer && room && localUser && (
        <div className={styles.multiplayerStatus}>
          <div className={styles.roomInfo}>
            <span className={styles.roomName}>{room.name}</span>
            <span className={`${styles.statusBadge} ${styles[room.status]}`}>
              {room.status.toUpperCase()}
            </span>
          </div>
          
          <div className={styles.playersInfo}>
            <span>Players: {room.players.length}/{room.maxPlayers}</span>
            {room.status === 'playing' && (
              <span className={styles.turnInfo}>
                {room.gameState?.currentTurn === localUser.id 
                  ? "🎮 YOUR TURN!" 
                  : `${room.players.find(p => p.userId === room.gameState?.currentTurn)?.username || 'Someone'}'s turn`}
              </span>
            )}
          </div>
          
          <div className={styles.scores}>
            {room.players.map(player => (
              <div 
                key={player.userId} 
                className={`${styles.playerScore} ${player.userId === localUser.id ? styles.currentPlayer : ''}`}
              >
                <span>{player.username}{player.userId === localUser.id ? ' (You)' : ''}:</span>
                <strong>{player.score}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Your existing game board */}
      <section 
        className={styles.boardTable}
        style={{ backgroundImage: "url(/images/bg_city-memory_game.png)" }}
      >
        {gameState.cards.map((card, index) => (
          <div
            key={card.id}
            className={`${styles.card} ${card.flipped ? styles.flipped : ""}`}
            onClick={() => handleMultiplayerCardClick(index)}
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
                <p>{/* We'll fix this text display next */}</p>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Game info */}
      <div className={styles.gameInfo}>
        <div className={styles.matchedPairs}>
          Matched Pairs: {gameState.matchedPairs}
        </div>
        {isMultiplayer && room?.status === 'waiting' && localUser && (
          <div className={styles.waitingMessage}>
            ⏳ Waiting for host to start the game...
            {room.players.some(p => p.isHost && p.userId === localUser.id) && 
              " (You are the host!)"}
          </div>
        )}
      </div>
    </div>
  );
}