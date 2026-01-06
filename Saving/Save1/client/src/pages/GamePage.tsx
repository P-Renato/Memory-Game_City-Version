// pages/GamePage.tsx - CORRECTED
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../context/useGame';
import GameBoard from '../components/GameBoard';
import styles from '../lib/ui/home.module.css';
import type { GameRoom } from '../types';

export default function GamePage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { 
    currentRoom, 
    setCurrentRoom, 
    joinRoom, 
    isLoading, 
    error 
  } = useGame();

  useEffect(() => {
    const loadGameRoom = async () => {
      if (!roomId) {
        console.error('No roomId in URL');
        navigate('/rooms');
        return;
      }

      console.log('🎮 GamePage loading room:', roomId);
      
      // Save room ID to storage
      localStorage.setItem('currentRoomId', roomId);
      sessionStorage.setItem('currentRoomId', roomId);
      
      // Use the joinRoom function from context (which now uses apiClient)
      const success = await joinRoom(roomId);
      
      if (!success) {
        console.error('Failed to join room');
        navigate('/rooms');
      }
    };

    loadGameRoom();
  }, [roomId, joinRoom, navigate]);

  const handleRoomUpdate = (updatedRoom: GameRoom) => {
    console.log('🔄 Room updated in GamePage');
    setCurrentRoom(updatedRoom);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <h2>Joining Game Room...</h2>
        <p>Please wait while we connect you to the game.</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2>Error Joining Room</h2>
        <p>{error}</p>
        <button 
          onClick={() => navigate('/rooms')}
          className={styles.backButton}
        >
          Back to Rooms
        </button>
      </div>
    );
  }

  // No room state
  if (!currentRoom) {
    return (
      <div className={styles.loadingContainer}>
        <p>Loading room data...</p>
      </div>
    );
  }

  // Success - render GameBoard
  return (
    <GameBoard 
      room={currentRoom}
      isMultiplayer={true}
      onGameUpdate={handleRoomUpdate}
    />
  );
}