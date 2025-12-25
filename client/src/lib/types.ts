export type cities = {
    en: {
      language: string,
      code: string,
      items: {
        airplane: string;
        bank: string;
        bicycle: string;
        bridge: string;
        bus: string;
        car: string;
        castle: string;
        "fire-station": string;
        fountain: string;
        hospital: string;
        house: string;
        library: string;
        playground: string;
        "police-station": string;
        restaurant: string;
        school: string;
        street: string;
        subway: string;
        taxi: string;
        "traffic-light": string;
        train: string;
      }  
    },
    es: {
      language: string,
      code: string,
      items: {
        airplane: string;
        bank: string;
        bicycle: string;
        bridge: string;
        bus: string;
        car: string;
        castle: string;
        "fire-station": string;
        fountain: string;
        hospital: string;
        house: string;
        library: string;
        playground: string;
        "police-station": string;
        restaurant: string;
        school: string;
        street: string;
        subway: string;
        taxi: string;
        "traffic-light": string;
        train: string;
      }  
    },
    pt: {
      language: string,
      code: string,
      items: {
        airplane: string;
        bank: string;
        bicycle: string;
        bridge: string;
        bus: string;
        car: string;
        castle: string;
        "fire-station": string;
        fountain: string;
        hospital: string;
        house: string;
        library: string;
        playground: string;
        "police-station": string;
        restaurant: string;
        school: string;
        street: string;
        subway: string;
        taxi: string;
        "traffic-light": string;
        train: string;
      }  
    },
    cs: {
      language: string,
      code: string,
      items: {
        airplane: string;
        bank: string;
        bicycle: string;
        bridge: string;
        bus: string;
        car: string;
        castle: string;
        "fire-station": string;
        fountain: string;
        hospital: string;
        house: string;
        library: string;
        playground: string;
        "police-station": string;
        restaurant: string;
        school: string;
        street: string;
        subway: string;
        taxi: string;
        "traffic-light": string;
        train: string;
      }  
    },
    fr: {
      language: string,
      code: string,
      items: {
        airplane: string;
        bank: string;
        bicycle: string;
        bridge: string;
        bus: string;
        car: string;
        castle: string;
        "fire-station": string;
        fountain: string;
        hospital: string;
        house: string;
        library: string;
        playground: string;
        "police-station": string;
        restaurant: string;
        school: string;
        street: string;
        subway: string;
        taxi: string;
        "traffic-light": string;
        train: string;
      }  
    },
    de: {
      language: string,
      code: string,
      items: {
        airplane: string;
        bank: string;
        bicycle: string;
        bridge: string;
        bus: string;
        car: string;
        castle: string;
        "fire-station": string;
        fountain: string;
        hospital: string;
        house: string;
        library: string;
        playground: string;
        "police-station": string;
        restaurant: string;
        school: string;
        street: string;
        subway: string;
        taxi: string;
        "traffic-light": string;
        train: string;
      }  
    },
    ja:{
      language: string,
      code: string,
      items: {
        airplane: string;
        bank: string;
        bicycle: string;
        bridge: string;
        bus: string;
        car: string;
        castle: string;
        "fire-station": string;
        fountain: string;
        hospital: string;
        house: string;
        library: string;
        playground: string;
        "police-station": string;
        restaurant: string;
        school: string;
        street: string;
        subway: string;
        taxi: string;
        "traffic-light": string;
        train: string;
      }  
    },
    ar: {
      language: string,
      code: string,
      items: {
        airplane: string;
        bank: string;
        bicycle: string;
        bridge: string;
        bus: string;
        car: string;
        castle: string;
        "fire-station": string;
        fountain: string;
        hospital: string;
        house: string;
        library: string;
        playground: string;
        "police-station": string;
        restaurant: string;
        school: string;
        street: string;
        subway: string;
        taxi: string;
        "traffic-light": string;
        train: string;
      }  
    },
}

export interface Player {
  _id: string;
  name: string;
  email: string;
  password: string;
  totalGames: number;
  totalWins: number;
  totalScore: number;
  createdAt: Date;
}

export interface GameSession {
  _id?: string;
  players: {
    name: string;
    score: number;
  }[];
  winner: string;
  maxScore: number;
  playedAt: Date;
}