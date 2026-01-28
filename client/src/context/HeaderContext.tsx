import { createContext, useState, type ReactNode } from 'react';
import type { GameRoom } from '../types';

interface HeaderContextType {
  currentRoom: GameRoom | null;
  setCurrentRoom: (room: GameRoom | null) => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export function HeaderProvider({ children }: { children: ReactNode }) {
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);

  return (
    <HeaderContext.Provider value={{ currentRoom, setCurrentRoom }}>
      {children}
    </HeaderContext.Provider>
  );
}

export { HeaderContext }