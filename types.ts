export interface GameStats {
  money: number;
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  reputation: number;
}

export interface InventoryItem {
  name: string;
  description: string;
  isKeyItem: boolean;
}

export interface GameState {
  locationName: string;
  weather: string;
  time: string;
  stats: GameStats;
  inventory: InventoryItem[];
  nearbyLocations: string[];
  characters: string[];
  sceneDescription: string;
  asciiArt: string;
  logs: string[];
}

export interface AIResponse {
  sceneDescription: string;
  locationName: string;
  weather: string;
  nearbyLocations: string[];
  characters: string[];
  statsChange: Partial<GameStats>;
  inventoryAdd?: InventoryItem[];
  inventoryRemove?: string[];
  logEntry: string;
  asciiArt: string;
  isSuspense: boolean;
}