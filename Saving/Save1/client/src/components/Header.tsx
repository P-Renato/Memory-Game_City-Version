
import { useState } from 'react';
import { useLanguage } from '../context/useLanguage';
import { useAuth } from '../context/useAuth';
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

type Language = keyof typeof cityByLanguage;

type AuthMode = 'login' | 'register';

export default function Header() {
  const { gameLanguage, setGameLanguage } = useLanguage();
  const navigate = useNavigate();
  const { user, isAuthenticated, login, logout, loading } = useAuth();
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


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    try {
      await login(loginData);
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
      const response = await fetch('http://localhost:3001/api/users/register', {
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
      alert('Room created but data is incomplete. Please check console.');
      return;
    }    // For now, just show an alert
    alert(`Room "${room.name}" created successfully!`);
    navigate(`/game/${room.id}`);
    
  };

  const handleLanguageChange = (lang: string) => {
      if (isValidLanguage(lang)) {
        setGameLanguage(lang); 
      }
    };

    const joinRoomsList = () => {
      console.log("Joining rooms list: ")
      navigate('/rooms')
    }
  

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        {/* Language Selector */}
        <div className={styles.languageSection}>
          <span className={styles.languageLabel}>Language: </span>
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

        {/* Auth Section */}
        <div className={styles.authSection}>
          {loading ? (
            <div>Loading...</div>
          ) : isAuthenticated ? (
          <div className={styles.userInfo}>
            <span>Welcome, {user?.username}! 👋</span>
            <button onClick={joinRoomsList} className={styles.createRoomBtn}>
              Join Rooms
            </button>
            <button 
              onClick={() => setShowRoomCreation(true)}
              className={styles.createRoomBtn}
            >
              Create Room
            </button>
            <button onClick={logout} className={styles.logoutBtn}>
              Logout
            </button>
          </div>
          ) : (
            <div className={styles.guestInfo}>
              <button 
                onClick={() => setShowAuth(true)}
                className={styles.loginBtn}
              >
                Login / Register
              </button>
            </div>
          )}
        </div>
      </div>

      <RoomCreationModal 
        isOpen={showRoomCreation}
        onClose={() => setShowRoomCreation(false)}
        onRoomCreated={handleRoomCreated}
      />

      {/* Auth Modal */}
      {showAuth && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button 
              className={styles.modalClose}
              onClick={closeModal}
            >
              ×
            </button>
            
            <h3>{authMode === 'login' ? 'Login' : 'Create Account'}</h3>
            
            {authError && (
              <div className={styles.errorMessage}>{authError}</div>
            )}
            
            
            {/* Login Form */}
            {authMode === 'login' && (
              <form onSubmit={handleLogin}>
                <input
                  type="text"
                  placeholder="Username or Email"
                  value={loginData.login}
                  onChange={(e) => setLoginData({
                    ...loginData, 
                    login: e.target.value
                  })}
                  required
                  className={styles.authInput}
                />
                
                <input
                  type="password"
                  placeholder="Password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({
                    ...loginData, 
                    password: e.target.value
                  })}
                  required
                  className={styles.authInput}
                />
                
                <button type="submit" disabled={loading} className={styles.authButton}>
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>
            )}
            
            {/* Register Form */}
            {authMode === 'register' && (
              <form onSubmit={handleRegister}>
                <input
                  type="text"
                  placeholder="Username"
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
                  placeholder="Password"
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
                  placeholder="Confirm Password"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({
                    ...registerData, 
                    confirmPassword: e.target.value
                  })}
                  required
                  className={styles.authInput}
                />
                
                <button type="submit" disabled={loading} className={styles.authButton}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
            )}
            
            {/* Switch between login/register */}
            <p className={styles.authSwitch}>
              {authMode === 'login' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button type="button" onClick={switchToRegister} className={styles.linkButton}>
                    Register here!
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button type="button" onClick={switchToLogin} className={styles.linkButton}>
                    Login here!
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