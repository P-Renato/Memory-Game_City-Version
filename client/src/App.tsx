import Header from './components/Header'
import './App.css'
import GameBoard from './components/GameBoard'
import styles from './lib/ui/home.module.css'

function App() {

  return (
    <div className={styles.gameContainer}>
      <Header />
      <main className={styles.mainContent}>
        <GameBoard />
      </main>
    </div>
  )
}

export default App
