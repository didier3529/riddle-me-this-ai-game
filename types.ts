
export interface RiddleData {
  riddle: string;
  answer: string;
  clues: string[];
}

export interface PlayerScore {
  player1: number;
  player2: number;
}

export enum GameState {
  NotStarted = 'NotStarted',
  Playing = 'Playing',
  GameOver = 'GameOver',
}

export interface AIServiceError {
  message: string;
}

export interface AnswerEvaluation {
  isCorrect: boolean;
  // Feedback message will be constructed client-side
}
    