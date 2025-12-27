// components/RoomCreationModal.tsx - FIXED VERSION
'use client';
import { useState } from 'react';
import type { GameRoom } from '../types/index';
import { useAuth } from '../context/useAuth'; 
import styles from '../lib/ui/home.module.css';

interface RoomCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated: (room: GameRoom) => void;
}

export default function RoomCreationModal({ 
  isOpen, 
  onClose, 
  onRoomCreated,
}: RoomCreationModalProps) {
  const { user, token } = useAuth(); 
  const [roomData, setRoomData] = useState({
    name: '',
    maxPlayers: 4,
    language: 'en',
    isPrivate: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !token) {
      setError('You must be logged in to create a room');
      return;
    }

    if (!roomData.name.trim()) {
      setError('Room name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('📤 Creating room with data:', {
        ...roomData,
        userId: user.id,
        username: user.username
      });

      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, 
        },
        body: JSON.stringify({
          ...roomData,
          userId: user.id,
          username: user.username
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create room');
      }

      console.log('✅ Room created response:', result);
      
      if (result.success && result.room) {
        onRoomCreated(result.room);
        onClose();
        // Clear form
        setRoomData({
          name: '',
          maxPlayers: 4,
          language: 'en',
          isPrivate: false
        });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('❌ Error creating room:', error);
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose}>×</button>
        
        <h3>Create New Room</h3>
        
        {error && (
          <div className={styles.errorMessage}>{error}</div>
        )}
        
        {!user ? (
          <div className={styles.authRequired}>
            <p>You must be logged in to create a room.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="roomName">Room Name</label>
              <input
                id="roomName"
                type="text"
                placeholder="Enter room name"
                value={roomData.name}
                onChange={(e) => setRoomData({ ...roomData, name: e.target.value })}
                required
                className={styles.formInput}
                disabled={loading}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="maxPlayers">Max Players (2-4)</label>
              <select
                id="maxPlayers"
                value={roomData.maxPlayers}
                onChange={(e) => setRoomData({ ...roomData, maxPlayers: parseInt(e.target.value) })}
                className={styles.formSelect}
                disabled={loading}
              >
                <option value={2}>2 Players</option>
                <option value={3}>3 Players</option>
                <option value={4}>4 Players</option>
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="language">Game Language</label>
              <select
                id="language"
                value={roomData.language}
                onChange={(e) => setRoomData({ ...roomData, language: e.target.value })}
                className={styles.formSelect}
                disabled={loading}
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="pt">Português</option>
                <option value="cs">Čeština</option>
                <option value="de">Deutsch</option>
                <option value="ja">日本語</option>
                <option value="ar">العربية</option>
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={roomData.isPrivate}
                  onChange={(e) => setRoomData({ ...roomData, isPrivate: e.target.checked })}
                  disabled={loading}
                />
                Private Room (Requires invite)
              </label>
            </div>
            
            <div className={styles.formFooter}>
              <button
                type="button"
                onClick={onClose}
                className={styles.cancelButton}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !user}
                className={styles.submitButton}
              >
                {loading ? 'Creating...' : 'Create Room'}
              </button>
            </div>
          </form>
        )}
        
        <div className={styles.userInfo}>
          <p>Creating room as: <strong>{user?.username || 'Not logged in'}</strong></p>
        </div>
      </div>
    </div>
  );
}