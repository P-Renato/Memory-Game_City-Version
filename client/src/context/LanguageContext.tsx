import { createContext, useState, type ReactNode } from 'react';
import { 
  type Language, 
  DEFAULT_LANGUAGE,
  isValidLanguage 
} from '../lib/utils/languageHelper';

interface LanguageContextType {
  // UI Language (for interface text)
  uiLanguage: Language;
  setUILanguage: (lang: Language) => void;
  
  // Game Language (for card content)
  gameLanguage: Language;
  setGameLanguage: (lang: Language) => void;
  
  // Helper getter for backward compatibility
  language: Language; // Alias for gameLanguage
  currentUILanguage: Language; // Alias for uiLanguage
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [uiLanguage, setUILanguage] = useState<Language>(DEFAULT_LANGUAGE);
  const [gameLanguage, setGameLanguage] = useState<Language>(DEFAULT_LANGUAGE);

  const contextValue: LanguageContextType = {
    // Separate languages
    uiLanguage,
    setUILanguage: (lang: Language) => {
      if (isValidLanguage(lang)) {
        setUILanguage(lang);
      }
    },
    
    gameLanguage,
    setGameLanguage: (lang: Language) => {
      if (isValidLanguage(lang)) {
        setGameLanguage(lang);
      }
    },
    
    // Aliases for backward compatibility
    language: gameLanguage,
    currentUILanguage: uiLanguage,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export { LanguageContext };