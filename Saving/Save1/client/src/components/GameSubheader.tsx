import { useEffect, useState } from 'react';
import { useLanguage } from '../context/useLanguage';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { apiClient } from '../lib/api-client';
import type { GameRoom } from '../types/index';
import { getLanguageWithFlag } from '../lib/utils/languageHelper';
// import '../styles/GameSubheader.css';


export default function GameSubheader() {
  const {  gameLanguage } = useLanguage();
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRoomInfo = async () => {
    if (!roomId || !user) return;

      try {
       setLoading(true);
       const response = await apiClient.getRoom(roomId);

       if(response.success && response.room){
        setRoom(response.room);
       } else {
            setError(response.error || 'Failed to load room');
            console.error('Room fetch error:', response.error);
       }
      } catch (err) {
        console.error('Error fetching room info:', err);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
    if (!roomId) {
      navigate('/rooms'); 
      return;
    }

    fetchRoomInfo();
    
    // TODO: Set up WebSocket for real-time updates
    const wsInterval = setInterval(fetchRoomInfo, 5000);
    return () => clearInterval(wsInterval);
  }, [roomId, user, navigate]);


  const handleReady = async () => {
    if (!roomId || !user) return;

    try {
    console.log('Player ready', user?.id);
    const response = await apiClient.markReady(roomId);
    
    if (response.success && response.room) {
      setRoom(response.room);
    } else {
      alert(response.error || 'Failed to update ready status');
    }
  } catch (error) {
    console.error("Error setting ready: ", error);
    alert('Failed to update ready status');
  }
  };

  const handleStartGame = async () => {
    if (!roomId || !user) return;

  try {
    console.log('Starting game');
    const response = await apiClient.startGame(roomId);
    
    if (response.success && response.room) {
      setRoom(response.room);
      alert('Game started!');
    } else {
      alert(response.error || 'Failed to start game');
    }
  } catch (error) {
    console.error("Error starting game: ", error);
    alert('Failed to start game');
  }
  };

  const handleLeaveRoom = async () => {
    if (!roomId || !user) return;

    try {
        console.log('Leaving room');
        await fetchRoomInfo();
        navigate('/')
    } catch (error) {
        console.error("Error starting game: ", error)
    }
  };


  if (loading) {
    return <div className="subheader loading">Loading room info...</div>;
  }

  if (error || !room) {
    return (
      <div className="subheader error">
        <p>Error: {error || 'Room not found'}</p>
        <button onClick={() => navigate('/rooms')}>Back to Rooms</button>
      </div>
    );
  }

    const isHost = room.host === user?.id;
    const currentPlayer = room.players.find(p => p.userId === user?.id);
    const allReady = room.players.every(p => p.isReady || p.isHost);

  return (
    <div className="game-subheader">
      <div className="room-info-section">
        <h3>{room.name}</h3>
        <div className="room-meta">
          <span className={`status-badge ${room.status}`}>
            {room.status.toUpperCase()}
          </span>
          <span>👥 {room.players.length}/{room.maxPlayers}</span>
          <div className="language-info">
            <span>Game: {getLanguageWithFlag(gameLanguage)}</span>
        </div>
          {room.settings.isPrivate && <span>🔒 Private</span>}
        </div>
      </div>

      <div className="players-section">
        <h4>Players:</h4>
        <div className="players-list">
          {room.players.map(player => (
            <div 
              key={player.userId} 
              className={`player-card ${player.userId === user?.id ? 'you' : ''} ${player.isHost ? 'host' : ''}`}
            >
              <span className="player-name">
                {player.username}
                {player.userId === user?.id && ' (You)'}
                {player.isHost && ' 👑'}
              </span>
              <span className={`ready-status ${player.isReady ? 'ready' : 'not-ready'}`}>
                {player.isReady ? '✅ Ready' : '⏳ Not Ready'}
              </span>
              <span className="player-score">Score: {player.score}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="actions-section">
        {room.status === 'waiting' && (
          <>
            {!isHost && (
              <button 
                className={`ready-btn ${currentPlayer?.isReady ? 'ready' : ''}`}
                onClick={handleReady}
              >
                {currentPlayer?.isReady ? '✅ Ready' : 'Mark Ready'}
              </button>
            )}
            
            {isHost && room.players.length > 1 && (
              <button 
                className="start-game-btn"
                onClick={handleStartGame}
                disabled={!allReady}
              >
                Start Game
              </button>
            )}
          </>
        )}
        
        {room.status === 'playing' && (
          <div className="game-status">
            <span>Game in progress!</span>
            <span>Turn: {room.gameState.currentTurn === user?.id ? 'Your turn!' : 'Waiting...'}</span>
          </div>
        )}
        
        <button className="leave-room-btn" onClick={handleLeaveRoom}>
          Leave Room
        </button>
      </div>
    </div>
  );
}