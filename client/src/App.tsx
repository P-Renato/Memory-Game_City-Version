import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import GameBoard from './components/GameBoard';
import RoomsListPage from './pages/RoomsListPage';
import GameSubheader from './components/GameSubheader';
import { AuthProvider } from './context/AuthContext';
import './App.css';
import styles from './lib/ui/home.module.css';

function App() {
  return (
    <Router>
      <AuthProvider>
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
                element={<GameBoard isMultiplayer={true} />} 
              />
              
              {/* Create room page - you might want to create this */}
              <Route path="/create-room" element={
                <div className={styles.createRoomPage}>
                  <h2>Create Room</h2>
                  {/* You can put your RoomCreationModal content here or redirect to modal */}
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
      </AuthProvider>
    </Router>
  );
}

export default App;