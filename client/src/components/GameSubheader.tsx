import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
// import '../styles/GameSubheader.css';

interface Player {
  userId: string;
  username: string;
  score: number;
  isReady: boolean;
  isHost: boolean;
}

interface RoomInfo {
  id: string;
  name: string;
  players: Player[];
  maxPlayers: number;
  status: 'waiting' | 'playing' | 'finished';
  settings: {
    language: string;
  };
}

export default function GameSubheader() {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) return;

    const fetchRoomInfo = async () => {
      try {
        // TODO: Fetch room info from API
        // For now, simulate with mock data
        const mockRoom: RoomInfo = {
          id: roomId,
          name: 'Test Room',
          players: [
            { userId: '1', username: 'Host', score: 0, isReady: true, isHost: true },
            { userId: user?.id || '2', username: user?.username || 'You', score: 0, isReady: false, isHost: false },
          ],
          maxPlayers: 4,
          status: 'waiting',
          settings: { language: 'en' }
        };
        setRoom(mockRoom);
      } catch (err) {
        console.error('Error fetching room info:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoomInfo();
    
    // TODO: Set up WebSocket for real-time updates
    const wsInterval = setInterval(fetchRoomInfo, 5000);
    return () => clearInterval(wsInterval);
  }, [roomId, user]);

  const handleReady = () => {
    // TODO: Send ready status to server
    console.log('Player ready');
  };

  const handleStartGame = () => {
    // TODO: Start game (host only)
    console.log('Starting game');
  };

  const handleLeaveRoom = () => {
    // TODO: Leave room
    console.log('Leaving room');
    window.location.href = '/rooms';
  };

  if (!roomId || loading) {
    return <div className="subheader loading">Loading room info...</div>;
  }

  const isHost = room?.players.some(p => p.userId === user?.id && p.isHost);
  const currentPlayer = room?.players.find(p => p.userId === user?.id);

  return (
    <div className="game-subheader">
      <div className="room-info-section">
        <h3>{room?.name}</h3>
        <div className="room-meta">
          <span className={`status-badge ${room?.status}`}>
            {room?.status.toUpperCase()}
          </span>
          <span>👥 {room?.players.length}/{room?.maxPlayers}</span>
          <span>🌐 {room?.settings.language.toUpperCase()}</span>
        </div>
      </div>

      <div className="players-section">
        <h4>Players:</h4>
        <div className="players-list">
          {room?.players.map(player => (
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
        {room?.status === 'waiting' && (
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
                disabled={!room.players.every(p => p.isReady || p.isHost)}
              >
                Start Game
              </button>
            )}
          </>
        )}
        
        <button className="leave-room-btn" onClick={handleLeaveRoom}>
          Leave Room
        </button>
      </div>
    </div>
  );
}