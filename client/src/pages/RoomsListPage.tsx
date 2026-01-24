// RoomsListPage.tsx - UPDATED WITH TRANSLATIONS
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useLanguage } from '../context/useLanguage'; // ADD THIS IMPORT
import { apiClient } from '../lib/api-client';
import { getUITranslation } from '../lib/translations/uiTranslations'; // ADD THIS IMPORT
import type { GameRoom } from '../types';
// import '../styles/RoomsList.css';

export default function RoomsListPage() {
  const { user, token } = useAuth();
  const { gameLanguage } = useLanguage(); // ADD THIS
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRooms = async () => {
    try {
      console.log('🔄 Fetching rooms...');
      setLoading(true);
      const response = await apiClient.getRoomsList();

      console.log('📡 API Response:', response);
      console.log('Rooms received:', response.rooms);
      if (response.success) {
        setRooms(response.rooms || []);
      } else {
        setError(response.error || getUITranslation(gameLanguage, 'networkError'));
      }
    } catch (err) {
      setError(getUITranslation(gameLanguage, 'networkError'));
      console.error('Error fetching rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleJoinRoom = async (roomId: string) => {
    if (!user || !token) {
      alert(getUITranslation(gameLanguage, 'pleaseLogin'));
      return;
    }

    try {
      const room = rooms.find(r => r.id === roomId);
      if (room?.isFull) {
        alert(getUITranslation(gameLanguage, 'roomFull'));
        return;
      }

      console.log('Joining room:', roomId);
      const response = await apiClient.joinRoom(roomId);
      
      if (response.success && response.room) {
        console.log('✅ Joined room:', response.room.id);
        navigate(`/game/${roomId}`);
      } else {
        alert(response.error || getUITranslation(gameLanguage, 'failedToJoin'));
      }
    } catch (err) {
      console.error('Error joining room:', err);
      alert(getUITranslation(gameLanguage, 'failedToJoin'));
    }
  };

  const handleCreateRoom = () => {
    navigate('/create-room');
  };

  const getPlayerStatus = (room: GameRoom) => {
    if (!user) return 'not-logged-in';
    
    const isHost = room.host === user.id;
    const isPlayer = room.players.some(p => p.userId === user.id);
    
    if (isHost) return 'host';
    if (isPlayer) return 'player';
    return 'not-joined';
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'waiting': return getUITranslation(gameLanguage, 'roomStatusWaiting');
      case 'playing': return getUITranslation(gameLanguage, 'roomStatusPlaying');
      case 'finished': return getUITranslation(gameLanguage, 'roomStatusFinished');
      default: return status.toUpperCase();
    }
  };

  if (loading && rooms.length === 0) {
    return (
      <div className="rooms-container">
        <div className="loading">{getUITranslation(gameLanguage, 'loadingRooms')}</div>
      </div>
    );
  }

  return (
    <div className="rooms-container">
      <div className="rooms-header">
        <h1>{getUITranslation(gameLanguage, 'availableRooms')}</h1>
        <button 
          className="create-room-btn"
          onClick={handleCreateRoom}
        >
          {getUITranslation(gameLanguage, 'createNewRoom')}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {rooms.length === 0 ? (
        <div className="no-rooms">
          <p>{getUITranslation(gameLanguage, 'noRoomsAvailable')}</p>
          <p>{getUITranslation(gameLanguage, 'beFirstToCreate')}</p>
          <button 
            className="create-room-btn"
            onClick={handleCreateRoom}
          >
            {getUITranslation(gameLanguage, 'createNewRoom')}
          </button>
        </div>
      ) : (
        <div className="rooms-grid">
          {rooms.map(room => {
            const playerStatus = getPlayerStatus(room);
            const isYourRoom = playerStatus === 'host';
            const isInRoom = playerStatus === 'player' || isYourRoom;
            
            return (
              <div key={room.id} className="room-card">
                <div className="room-header">
                  <h3>{room.name}</h3>
                  <span className={`status-badge ${room.status}`}>
                    {getStatusText(room.status)}
                  </span>
                </div>
                
                <div className="room-info">
                  <div className="players-info">
                    <span className="players-count">
                      👥 {room.playerCount}/{room.maxPlayers}
                    </span>
                    {room.isFull && (
                      <span className="full-badge">
                        {getUITranslation(gameLanguage, 'full')}
                      </span>
                    )}
                  </div>
                  
                  <div className="room-details">
                    <span>
                      {getUITranslation(gameLanguage, 'language')}: {room.settings.language.toUpperCase()}
                    </span>
                    <span>
                      {room.settings.isPrivate 
                        ? '🔒 ' + getUITranslation(gameLanguage, 'privateRoom')
                        : '🌐 ' + getUITranslation(gameLanguage, 'public')}
                    </span>
                  </div>
                  
                  <div className="host-info">
                    {getUITranslation(gameLanguage, 'host')}: {room.players.find((p) => p.isHost)?.username || 'Unknown'}
                    {isYourRoom && (
                      <span className="you-badge">
                        {getUITranslation(gameLanguage, 'youLabelShort')}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="room-actions">
                  {isInRoom ? (
                    <button
                      className="join-btn in-room"
                      onClick={() => navigate(`/game/${room.id}`)}
                    >
                      {isYourRoom 
                        ? getUITranslation(gameLanguage, 'enterYourRoom')
                        : getUITranslation(gameLanguage, 'rejoinRoom')}
                    </button>
                  ) : room.isFull ? (
                    <button className="join-btn disabled" disabled>
                      {getUITranslation(gameLanguage, 'roomFull')}
                    </button>
                  ) : (
                    <button
                      className="join-btn"
                      onClick={() => handleJoinRoom(room.id)}
                    >
                      {getUITranslation(gameLanguage, 'joinRoom')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}