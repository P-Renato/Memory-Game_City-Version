// App.tsx - UPDATED
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import GameBoard from './components/GameBoard';
import RoomsListPage from './pages/RoomsListPage';
import GameSubheader from './components/GameSubheader';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { GameProvider } from './context/GameContext';
import './App.css';
import styles from './lib/ui/home.module.css';
import GamePage from './pages/GamePage';

function GamePageWrapper() {
  // We'll create a wrapper that fetches the room from URL
  return (
    <GamePage />
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <LanguageProvider>
          <GameProvider>
            <div className={styles.gameContainer}>
              <Header />
              
              {/* Conditionally show GameSubheader only on game pages */}
              <Routes>
                <Route path="/game/:roomId" element={<GameSubheader />} />
                <Route path="*" element={null} />
              </Routes>
              
              <main className={styles.mainContent}>
                <Routes>
                  <Route path="/" element={<GameBoard isMultiplayer={false} />} />
                  <Route path="/rooms" element={<RoomsListPage />} />
                  <Route 
                    path="/game/:roomId" 
                    element={<GamePageWrapper />} 
                  />
                  
                  {/* Create room page */}
                  <Route path="/create-room" element={
                    <div className={styles.createRoomPage}>
                      <h2>Create Room</h2>
                      <p>Redirecting to room creation modal...</p>
                    </div>
                  } />
                  
                  {/* 404 page */}
                  <Route path="*" element={
                    <div className={styles.notFound}>
                      <h2>404 - Page Not Found</h2>
                      <p>The page you're looking for doesn't exist.</p>
                    </div>
                  } />
                </Routes>
              </main>
            </div>
          </GameProvider>
        </LanguageProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;