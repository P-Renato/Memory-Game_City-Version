import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { apiClient } from '../lib/api-client';
import type { GameRoom } from '../types';
// import '../styles/RoomsList.css';


export default function RoomsListPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRooms = async () => {
    try {
      console.log('🔄 Fetching rooms...');
      console.log('User:', user?.username);
      console.log('Token from localStorage:', localStorage.getItem('token')?.substring(0, 20) + '...');
      setLoading(true);
      const response = await apiClient.getRoomsList();

      console.log('📡 API Response:', response);
      console.log('Rooms received:', response.rooms);
      if (response.success) {
        setRooms(response.rooms || []);
      } else {
        setError(response.error || 'Failed to load rooms');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error fetching rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    // Refresh rooms every 10 seconds
    const interval = setInterval(fetchRooms, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleJoinRoom = async (roomId: string) => {
    if (!user || !token) {
      alert('Please login to join a room');
      return;
    }

    try {
      // First check if room is available
      const room = rooms.find(r => r.id === roomId);
      if (room?.isFull) {
        alert('Room is full!');
        return;
      }

      console.log('Joining room:', roomId);
      const response = await apiClient.joinRoom(roomId);
      
      if (response.success && response.room) {
      console.log('✅ Joined room:', response.room.id);
      navigate(`/game/${roomId}`);
    } else {
      alert(response.error || 'Failed to join room');
    }
    } catch (err) {
      console.error('Error joining room:', err);
      alert('Failed to join room');
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

  if (loading && rooms.length === 0) {
    return (
      <div className="rooms-container">
        <div className="loading">Loading rooms...</div>
      </div>
    );
  }

  return (
    <div className="rooms-container">
      <div className="rooms-header">
        <h1>Available Rooms</h1>
        <button 
          className="create-room-btn"
          onClick={handleCreateRoom}
        >
          Create New Room
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {rooms.length === 0 ? (
        <div className="no-rooms">
          <p>No rooms available. Be the first to create one!</p>
          <button 
            className="create-room-btn"
            onClick={handleCreateRoom}
          >
            Create Room
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
                    {room.status.toUpperCase()}
                  </span>
                </div>
                
                <div className="room-info">
                  <div className="players-info">
                    <span className="players-count">
                      👥 {room.playerCount}/{room.maxPlayers}
                    </span>
                    {room.isFull && <span className="full-badge">FULL</span>}
                  </div>
                  
                  <div className="room-details">
                    <span>Language: {room.settings.language.toUpperCase()}</span>
                    <span>{room.settings.isPrivate ? '🔒 Private' : '🌐 Public'}</span>
                  </div>
                  
                  <div className="host-info">
                    Host: {room.players.find((p) => p.isHost)?.username || 'Unknown'}
                    {isYourRoom && <span className="you-badge"> (You)</span>}
                  </div>
                </div>
                
                <div className="room-actions">
                  {isInRoom ? (
                    <button
                      className="join-btn in-room"
                      onClick={() => navigate(`/game/${room.id}`)}
                    >
                      {isYourRoom ? 'Enter Your Room' : 'Rejoin Room'}
                    </button>
                  ) : room.isFull ? (
                    <button className="join-btn disabled" disabled>
                      Room Full
                    </button>
                  ) : (
                    <button
                      className="join-btn"
                      onClick={() => handleJoinRoom(room.id)}
                    >
                      Join Room
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