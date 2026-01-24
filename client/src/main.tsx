import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './context/AuthContext.tsx'
import { LanguageProvider } from './context/LanguageContext.tsx'
import { GameProvider } from './context/GameContext.tsx'
import './index.css'
import App from './App.tsx'
import { HeaderProvider } from './context/HeaderContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <LanguageProvider>
        <GameProvider>
          <HeaderProvider>
            <App />
          </HeaderProvider>
        </GameProvider>
      </LanguageProvider>
    </AuthProvider>
  </StrictMode>,
)
