// components/Header.tsx - COMPLETE VERSION WITH LOBBY
import { useState, useEffect } from 'react';
import { useLanguage } from '../context/useLanguage';
import { useAuth } from '../context/useAuth';
import { useHeader } from '../context/useHeader';
import { useCurrentRoomId } from '../hooks/useCurrentRoomId';
import { useLocation } from 'react-router-dom'; 
import { cityByLanguage } from '../lib/db';
import styles from '../lib/ui/home.module.css';
import RoomCreationModal from './RoomCreationModal';
import type { GameRoom } from '../types/index'; 
import { 
  AVAILABLE_LANGUAGES,
  getLanguageWithFlag, 
  isValidLanguage 
} from '../lib/utils/languageHelper';
import { useNavigate } from 'react-router-dom';
import { getUITranslation } from '../lib/translations/uiTranslations';
import { apiClient } from '../lib/api-client';
import { useWebSocket } from '../hooks/useWebSocket';

type Language = keyof typeof cityByLanguage;
type AuthMode = 'login' | 'register';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';


export default function Header() {
  const { gameLanguage, setGameLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const roomId  = useCurrentRoomId();
  const { user, isAuthenticated, login, logout, loading } = useAuth();
  const { currentRoom, setCurrentRoom } = useHeader();

    useEffect(() => {
    console.log('📍 Header Debug:');
    console.log('roomId:', roomId);
    console.log('location.pathname:', location.pathname);
    console.log('currentRoom:', currentRoom);
    console.log('currentRoom?.status:', currentRoom?.status);
    console.log('isInGamePage:', location.pathname.includes('/game/'));
  }, [roomId, location.pathname, currentRoom]);

  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [loginData, setLoginData] = useState({ login: '', password: '' });
  const [registerData, setRegisterData] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    confirmPassword: '' 
  });
  const [authError, setAuthError] = useState('');
  const [showRoomCreation, setShowRoomCreation] = useState(false);
  const [leavingRoom, setLeavingRoom] = useState(false);
  
  // Add state for room lobby
  const [roomLobby, setRoomLobby] = useState<GameRoom | null>(null);
  const [lobbyLoading, setLobbyLoading] = useState(false);
  
  // Use WebSocket for real-time lobby updates
  const { isConnected, sendMessage, messages } = useWebSocket(roomId ? roomId : undefined);
  
  // Check if we're in a multiplayer game lobby (waiting room)
  const isInGameLobby = location.pathname.includes('/game/') && roomId;
  
  // Check if we're in a playing game
  const isInPlayingGame = isInGameLobby && currentRoom?.status === 'playing';
  
  // Check if we should show multiplayer status (when game is playing)
  const showMultiplayerStatus = isInPlayingGame && currentRoom && user;
  
  // Check if we should show lobby (when waiting for players)
  const showGameLobby = isInGameLobby && currentRoom?.status === 'waiting';

  // Fetch room lobby info
  const fetchRoomLobby = async () => {
    if (!roomId || !user) return;
    
    try {
      setLobbyLoading(true);
      const response = await apiClient.getRoom(roomId);
      
      if (response.success && response.room) {
        setRoomLobby(response.room);
        setCurrentRoom(response.room); // Also update header context
      }
    } catch (error) {
      console.error('Error fetching room lobby:', error);
    } finally {
      setLobbyLoading(false);
    }
  };

  // Handle WebSocket messages for lobby updates
  useEffect(() => {
    if (messages.length === 0) return;
    
    const lastMessage = messages[messages.length - 1];
    
    switch (lastMessage.type) {
      case 'ROOM_UPDATED':
      case 'PLAYER_JOINED':
      case 'PLAYER_LEFT':
      case 'PLAYER_READY':
        if (lastMessage.data?.room) {
          setRoomLobby(lastMessage.data.room);
          setCurrentRoom(lastMessage.data.room);
        }
        break;
    }
  }, [messages, setCurrentRoom]);

  // Fetch lobby when entering a game room
  useEffect(() => {
    if (isInGameLobby && user) {
      fetchRoomLobby();
      
      // Join room via WebSocket
      if (isConnected && roomId) {
        sendMessage('JOIN_ROOM', { roomId });
      }
    }
  }, [isInGameLobby, user, roomId, isConnected, sendMessage]);

  // Get the current player whose turn it is
  const getCurrentPlayerName = () => {
    if (!currentRoom?.gameState?.currentTurn) return '';
    
    const currentPlayer = currentRoom.players.find(p => p.userId === currentRoom.gameState?.currentTurn);
    return currentPlayer?.username || '';
  };

  // Handle player ready
  const handleReady = async () => {
    if (!roomId || !user || !roomLobby) return;
    
    try {
      const response = await apiClient.markReady(roomId);
      
      if (response.success && response.room) {
        setRoomLobby(response.room);
        setCurrentRoom(response.room);
        // Notify via WebSocket
        sendMessage('PLAYER_READY', { roomId });
      } else {
        alert(response.error || getUITranslation(gameLanguage, 'failedToUpdateReady'));
      }
    } catch (error) {
      console.error('Error setting ready:', error);
      alert(getUITranslation(gameLanguage, 'failedToUpdateReady'));
    }
  };

  // Handle start game (host only)
  const handleStartGame = async () => {
    if (!roomId || !user || !roomLobby) return;
    
    try {
      const response = await apiClient.startGame(roomId);
      
      if (response.success && response.room) {
        setRoomLobby(response.room);
        setCurrentRoom(response.room);
        // Notify via WebSocket
        sendMessage('GAME_STARTED', { roomId });
      } else {
        alert(response.error || getUITranslation(gameLanguage, 'failedToStartGame'));
      }
    } catch (error) {
      console.error('Error starting game:', error);
      alert(getUITranslation(gameLanguage, 'failedToStartGame'));
    }
  };

  const handleLeaveRoom = async () => {
    if (leavingRoom) return;
    
    setLeavingRoom(true);
    
    try {
      // Clear the room from header context
      setCurrentRoom(null);
      setRoomLobby(null);
      
      // Navigate to home (single player)
      navigate('/');
      
      // Optional: Notify server
      if (roomId && user?.id) {
        try {
          await fetch(`${API_BASE_URL}/api/rooms/${roomId}/leave`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            },
            body: JSON.stringify({ userId: user.id }),
          });
        } catch (error) {
          console.warn('Could not notify server about leaving room:', error);
        }
      }
    } catch (error) {
      console.error('Error leaving room:', error);
    } finally {
      setTimeout(() => {
        setLeavingRoom(false);
      }, 100);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    try {
      const response = await login(loginData);
      if (!response.success) {
      setAuthError(response.error || 'Login failed');
      return;
    }
      setShowAuth(false);
      setLoginData({ login: '', password: '' });
    } catch (error) {
      setAuthError((error as Error).message);
    }
  };
  

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    // Basic validation
    if (registerData.password !== registerData.confirmPassword) {
      setAuthError('Passwords do not match');
      return;
    }

    if (registerData.password.length < 6) {
      setAuthError('Password must be at least 6 characters');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: registerData.username,
          email: registerData.email,
          password: registerData.password
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const result = await response.json();
      console.log("Result: ", result)
      
      // Auto-login after successful registration
      await login({ 
        login: registerData.username, 
        password: registerData.password 
      });
      
      setShowAuth(false);
      setRegisterData({ username: '', email: '', password: '', confirmPassword: '' });
    } catch (error) {
      setAuthError((error as Error).message);
    }
  };

  const switchToRegister = () => {
    setAuthMode('register');
    setAuthError('');
  };

  const switchToLogin = () => {
    setAuthMode('login');
    setAuthError('');
  };

  const closeModal = () => {
    setShowAuth(false);
    setAuthMode('login');
    setAuthError('');
    setLoginData({ login: '', password: '' });
    setRegisterData({ username: '', email: '', password: '', confirmPassword: '' });
  };

  const handleRoomCreated = (room: GameRoom) => {
    console.log('Room created:', room);
    if (!room || !room.name) {
      console.error('❌ Room data is invalid:', room);
      alert(getUITranslation(gameLanguage, 'roomDataIncomplete'));
      return;
    }
    alert(getUITranslation(gameLanguage, 'roomCreatedSuccess', { roomName: room.name }));
    navigate(`/game/${room.id}`);
  };

  const handleLanguageChange = (lang: string) => {
    if (isValidLanguage(lang)) {
      setGameLanguage(lang); 
    }
  };

  const joinRoomsList = () => {
    console.log("Joining rooms list: ");
    navigate('/rooms');
  };

  // Calculate if all players are ready
  const allPlayersReady = roomLobby?.players.every(p => p.isReady || p.isHost) || false;
  const isHost = roomLobby?.host === user?.id;
  const currentPlayer = roomLobby?.players.find(p => p.userId === user?.id);

  return (
    <header className={styles.header}>
      {/* Main Header Content - ALWAYS SHOWS */}
      <div className={styles.headerContent}>
        {/* Left Section: Language Selector */}
        <div className={styles.languageSection}>
          <select 
            value={gameLanguage} 
            onChange={(e) => handleLanguageChange(e.target.value as Language)}
            className={styles.languageSelect}
          >
            {AVAILABLE_LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {getLanguageWithFlag(lang)}
              </option>
            ))}
          </select>
        </div>

        {/* Right Section: Auth + Room Controls */}
        <div className={styles.authSection}>
          {loading ? (
            <div>{getUITranslation(gameLanguage, 'loading')}</div>
          ) : isAuthenticated ? (
            <div className={styles.userInfo}>
              <span>{getUITranslation(gameLanguage, 'welcome', { username: user?.username || '' })}</span>
              
              {/* Show different buttons based on current state */}
              {isInGameLobby ? (
                // IN GAME LOBBY OR PLAYING GAME: Show Leave Room button
                <button 
                  onClick={handleLeaveRoom}
                  className={styles.leaveRoomBtn}
                  disabled={leavingRoom}
                >
                  {leavingRoom 
                    ? getUITranslation(gameLanguage, 'leaving') 
                    : getUITranslation(gameLanguage, 'leaveRoom')}
                </button>
              ) : (
                // NOT in game: Show Create Room and Join Rooms buttons
                <>
                  <button onClick={joinRoomsList} className={styles.navButton}>
                    {getUITranslation(gameLanguage, 'joinRooms')}
                  </button>
                  <button 
                    onClick={() => setShowRoomCreation(true)}
                    className={styles.createRoomBtn}
                  >
                    {getUITranslation(gameLanguage, 'createRoom')}
                  </button>
                </>
              )}
              
              {/* Always show Logout */}
              <button onClick={logout} className={styles.logoutBtn} data-cy="logout-btn">
                {getUITranslation(gameLanguage, 'logout')}
              </button>
            </div>
          ) : (
            <div className={styles.guestInfo}>
              <button 
                data-cy="login-open-btn"
                onClick={() => setShowAuth(true)}
                className={styles.loginBtn}
              >
                {getUITranslation(gameLanguage, 'loginRegister')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* GAME LOBBY SECTION - Shows when in waiting room */}
      {showGameLobby && roomLobby && (
        <div className={styles.gameLobby}>
          <div className={styles.lobbyInfo}>
            <h4>{roomLobby.name}</h4>
            <div className={styles.lobbyMeta}>
              <span className={`${styles.statusBadge} ${styles.waiting}`}>
                {getUITranslation(gameLanguage, 'roomStatusWaiting')}
              </span>
              <span>👥 {roomLobby.players.length}/{roomLobby.maxPlayers}</span>
              {roomLobby.settings.isPrivate && (
                <span>🔒 {getUITranslation(gameLanguage, 'privateRoom')}</span>
              )}
            </div>
          </div>

          <div className={styles.playersReady}>
            <div className={styles.playersList}>
              {roomLobby.players.map(player => (
                <div 
                  key={player.userId} 
                  className={`${styles.playerReadyItem} ${player.userId === user?.id ? styles.you : ''}`}
                >
                  <span className={styles.playerName}>
                    {player.username}
                    {player.userId === user?.id && getUITranslation(gameLanguage, 'youLabelShort')}
                    {player.isHost && ' 👑'}
                  </span>
                  <span className={`${styles.readyStatus} ${player.isReady ? styles.ready : styles.notReady}`}>
                    {player.isReady 
                      ? '✅ ' + getUITranslation(gameLanguage, 'ready')
                      : '⏳ ' + getUITranslation(gameLanguage, 'notReady')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.lobbyActions}>
            {!isHost ? (
              <button 
                className={`${styles.readyBtn} ${currentPlayer?.isReady ? styles.ready : ''}`}
                onClick={handleReady}
                disabled={lobbyLoading}
              >
                {currentPlayer?.isReady 
                  ? '✅ ' + getUITranslation(gameLanguage, 'ready')
                  : getUITranslation(gameLanguage, 'markReady')}
              </button>
            ) : (
              <button 
                className={styles.startGameBtn}
                onClick={handleStartGame}
                disabled={!allPlayersReady || roomLobby.players.length < 2 || lobbyLoading}
              >
                {getUITranslation(gameLanguage, 'startGame')}
                {!allPlayersReady && ` (${getUITranslation(gameLanguage, 'roomStatusWaiting')})`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* MULTIPLAYER STATUS BAR - Shows when game is playing */}
      {showMultiplayerStatus && (
        <div className={styles.multiplayerStatus}>
          <div className={styles.roomInfo}>
            <span className={styles.roomName}>{currentRoom.name} </span>
            <span className={`${styles.statusBadge} ${styles[currentRoom.status]}`}>
              {currentRoom.status === 'waiting' 
                ? getUITranslation(gameLanguage, 'roomStatusWaiting')
                : currentRoom.status === 'playing'
                ? getUITranslation(gameLanguage, 'roomStatusPlaying')
                : getUITranslation(gameLanguage, 'roomStatusFinished')}
            </span>
          </div>
          
          <div className={styles.playersInfo}>
            {currentRoom.status === 'playing' && currentRoom.gameState?.currentTurn && (
              <div className={styles.turnInfo}>
                <span className={currentRoom.gameState?.currentTurn === user?.id ? styles.yourTurn : ''}>
                  {currentRoom.gameState?.currentTurn === user?.id 
                    ? getUITranslation(gameLanguage, 'yourTurn')
                    : getUITranslation(gameLanguage, 'playersTurn', { 
                        player: getCurrentPlayerName() || 'Someone' 
                      })}
                </span>
              </div>
            )}
          </div>
          
          <div className={styles.scores}>
            {currentRoom.players.map(player => (
              <div 
                key={player.userId} 
                className={`${styles.playerScore} ${player.userId === user?.id ? styles.currentPlayer : ''}`}
              >
                <span>{player.username}:</span>
                <strong>{player.score}</strong>
                {player.userId === user?.id && (
                  <span className={styles.youLabel}>{getUITranslation(gameLanguage, 'you')}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <RoomCreationModal 
        isOpen={showRoomCreation}
        onClose={() => setShowRoomCreation(false)}
        onRoomCreated={handleRoomCreated}
        language={gameLanguage}
      />

      {/* Auth Modal */}
      {showAuth && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button 
              className={styles.modalClose}
              onClick={closeModal}
            >
              {getUITranslation(gameLanguage, 'close')}
            </button>
            
            <h3>{getUITranslation(gameLanguage, authMode === 'login' ? 'login' : 'createAccount')}</h3>
            
            {authError && (
              <div data-cy="login-error" className={styles.errorMessage}>
                {authError}
              </div>
            )}

            
            {/* Login Form */}
            {authMode === 'login' && (
              <form onSubmit={handleLogin}>
                <input
                  type="text"
                  placeholder={getUITranslation(gameLanguage, 'usernameOrEmail')}
                  value={loginData.login}
                  data-cy="login-username"
                  onChange={(e) => setLoginData({
                    ...loginData, 
                    login: e.target.value
                  })}
                  required
                  className={styles.authInput}
                />
                
                <input
                  type="password"
                  placeholder={getUITranslation(gameLanguage, 'password')}
                  value={loginData.password}
                  data-cy="login-password"
                  onChange={(e) => setLoginData({
                    ...loginData, 
                    password: e.target.value
                  })}
                  required
                  className={styles.authInput}
                />
                
                <button type="submit" data-cy="login-submit" disabled={loading} className={styles.authButton}>
                  {loading ? getUITranslation(gameLanguage, 'loggingIn') : getUITranslation(gameLanguage, 'login')}
                </button>
              </form>
            )}
            
            {/* Register Form */}
            {authMode === 'register' && (
              <form onSubmit={handleRegister}>
                <input
                  type="text"
                  data-cy="register-username"
                  placeholder={getUITranslation(gameLanguage, 'usernameOrEmail')}
                  value={registerData.username}
                  onChange={(e) => setRegisterData({
                    ...registerData, 
                    username: e.target.value
                  })}
                  required
                  className={styles.authInput}
                />
                
                <input
                  type="email"
                  placeholder="Email"
                  data-cy="register-email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({
                    ...registerData, 
                    email: e.target.value
                  })}
                  required
                  className={styles.authInput}
                />
                
                <input
                  type="password"
                  data-cy="register-password"
                  placeholder={getUITranslation(gameLanguage, 'password')}
                  value={registerData.password}
                  onChange={(e) => setRegisterData({
                    ...registerData, 
                    password: e.target.value
                  })}
                  required
                  className={styles.authInput}
                />
                
                <input
                  type="password"
                  data-cy="register-confirmPassword"
                  placeholder={getUITranslation(gameLanguage, 'confirmPassword')}
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({
                    ...registerData, 
                    confirmPassword: e.target.value
                  })}
                  required
                  className={styles.authInput}
                />
                
                <button type="submit" disabled={loading} data-cy="register-submit" className={styles.authButton}>
                  {loading 
                    ? getUITranslation(gameLanguage, 'creatingAccount') 
                    : getUITranslation(gameLanguage, 'createAccount')}
                </button>
              </form>
            )}
            
            {/* Switch between login/register */}
            <p className={styles.authSwitch}>
              {authMode === 'login' ? (
                <>
                  {getUITranslation(gameLanguage, 'noAccount')}{' '}
                  <button type="button" onClick={switchToRegister} className={styles.linkButton} data-cy="switch-to-register">
                    {getUITranslation(gameLanguage, 'registerHere')}
                  </button>
                </>
              ) : (
                <>
                  {getUITranslation(gameLanguage, 'haveAccount')}{' '}
                  <button type="button" onClick={switchToLogin} className={styles.linkButton} data-cy="switch-to-login">
                    {getUITranslation(gameLanguage, 'loginHere')}                                                                                                                                                                                                                                                                                                                                                                                                                             
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </header>
  );
}