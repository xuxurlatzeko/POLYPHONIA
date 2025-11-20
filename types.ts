export enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard',
  EXTREME = 'Extreme'
}

export interface TriviaQuestion {
  id: string;
  question: string;
  options: string[]; // Array of 4 possible answers
  answer: string; // The correct string (must match one of options)
  context: string; // Fun fact or explanation
  difficulty: Difficulty;
  category: string; // e.g., "Members", "Discography", "Lore", "Lyrics"
}

export type FlashcardStatus = 'idle' | 'loading' | 'error' | 'success';

export interface HighScore {
  name: string;
  score: number;
  date: number;
}

export type GameState = 'welcome' | 'playing' | 'gameover';

export interface AppState {
  questions: TriviaQuestion[];
  currentIndex: number;
  status: FlashcardStatus;
  isFlipped: boolean;
  score: number;
  answered: boolean;
}