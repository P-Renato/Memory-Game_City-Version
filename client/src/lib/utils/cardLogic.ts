import { cityByLanguage } from "../db";

export interface Card {
  id: number;
  city: string;
  flipped: boolean;
  matched: boolean;
}

export interface MatchResult {
  updatedCards: Card[];
  matchedPairs: number;
  isGameComplete: boolean;
}

export function initializeCards(language: string, cardCount?: number): Card[] {
  const languageData = cityByLanguage[language as keyof typeof cityByLanguage];
  const cities = Object.keys(languageData.items);
  
  // If cardCount is provided, limit the number of cities
  let selectedCities = cities;
  if (cardCount && cardCount < cities.length) {
    selectedCities = cities.slice(0, cardCount);
    console.log("Selected Cities: ", selectedCities)
  }
  
  const duplicated = [...cities, ...cities];
  const shuffled = duplicated.sort(() => Math.random() - 0.5);
  
  
  return shuffled.map((city, i) => ({ 
    id: i, 
    city, 
    flipped: false, 
    matched: false 
  }));
}

export function handleCardMatch(cards: Card[], firstCardIndex: number, secondCardIndex: number): MatchResult {
  const isMatch = cards[firstCardIndex].city === cards[secondCardIndex].city;
  
  if (isMatch) {
    const updatedCards = cards.map((card, i) =>
      i === firstCardIndex || i === secondCardIndex
        ? { ...card, matched: true }
        : card
    );
    
    const newMatchedPairs = updatedCards.filter(card => card.matched).length / 2;
    const isGameComplete = newMatchedPairs === cards.length / 2;
    
    return {
      updatedCards,
      matchedPairs: newMatchedPairs,
      isGameComplete
    };
  } else {
    const updatedCards = cards.map((card, i) =>
      i === firstCardIndex || i === secondCardIndex
        ? { ...card, flipped: false }
        : card
    );
    
    return {
      updatedCards,
      matchedPairs: cards.filter(card => card.matched).length / 2,
      isGameComplete: false
    };
  }
}