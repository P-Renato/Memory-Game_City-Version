// pages/GamePage.tsx - CORRECTED VERSION
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../context/useGame';
import { useHeader } from '../context/useHeader';
import { useLanguage } from '../context/useLanguage';
import Header from '../components/Header';
import GameBoard from '../components/GameBoard';
import styles from '../lib/ui/home.module.css';
import { getUITranslation } from '../lib/translations/uiTranslations';
import type { GameRoom } from '../types';

export default function GamePage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { gameLanguage } = useLanguage();
  const { 
    currentRoom, 
    setCurrentRoom, 
    joinRoom, 
    isLoading, 
    error 
  } = useGame();

  const { setCurrentRoom: setHeaderRoom } = useHeader();

  useEffect(() => {
    const loadGameRoom = async () => {
      if (!roomId) {
        console.error('No roomId in URL');
        navigate('/rooms');
        return;
      }

      console.log('🎮 GamePage loading room:', roomId);
      
      localStorage.setItem('currentRoomId', roomId);
      sessionStorage.setItem('currentRoomId', roomId);
      
      const success = await joinRoom(roomId);
      
      if (!success) {
        console.error('Failed to join room');
        navigate('/rooms');
      }
      if(success && currentRoom){
        setHeaderRoom(currentRoom)
      }
    };
    
    if (roomId) {
      loadGameRoom();
    }

    // Cleanup when component unmounts
    return () => {
      setHeaderRoom(null);
    };
  }, [roomId, joinRoom, navigate, setHeaderRoom]);

  // Update header when currentRoom changes
  useEffect(() => {
    if (currentRoom) {
      setHeaderRoom(currentRoom);
    }
  }, [currentRoom, setHeaderRoom]);

  const handleRoomUpdate = (updatedRoom: GameRoom) => {
    console.log('🔄 Room updated in GamePage');
    setCurrentRoom(updatedRoom);
    setHeaderRoom(updatedRoom); // Update header too
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={styles.gamePageContainer}>
        <Header />
        <div className={styles.loadingContainer}>
          <h2>{getUITranslation(gameLanguage, 'loading')}</h2>
          <p>{getUITranslation(gameLanguage, 'joiningGame') || 'Please wait while we connect you to the game.'}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.gamePageContainer}>
        <Header />
        <div className={styles.errorContainer}>
          <h2>{getUITranslation(gameLanguage, 'errorJoiningRoom') || 'Error Joining Room'}</h2>
          <p>{error}</p>
          <button 
            onClick={() => navigate('/rooms')}
            className={styles.backButton}
          >
            {getUITranslation(gameLanguage, 'backToRooms') || 'Back to Rooms'}
          </button>
        </div>
      </div>
    );
  }

  // No room state
  if (!currentRoom) {
    return (
      <div className={styles.gamePageContainer}>
        <Header />
        <div className={styles.loadingContainer}>
          <p>{getUITranslation(gameLanguage, 'loadingRoomData') || 'Loading room data...'}</p>
        </div>
      </div>
    );
  }

  // Success - render GameBoard
  return (
    <div className={styles.gamePageContainer}>
      <GameBoard 
        room={currentRoom}  // Use currentRoom directly
        isMultiplayer={true}
        onGameUpdate={handleRoomUpdate}
      />
    </div>
  );
}