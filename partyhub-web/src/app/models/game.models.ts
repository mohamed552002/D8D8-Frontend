export type Role = 'host' | 'player';

export interface Player {
  connectionId: string;
  nickname: string;
  isHost: boolean;
}

export interface Room {
  code: string;
  players: Player[];
  isFull: boolean;
  status: number;
}

export interface PlayerScoreDto {
  playerId: string;
  nickname: string;
  score: number;
  rank: number;
  lastScoreChange: number;
}

export interface QuestionDto {
  id: string;
  question: string;
  answer: string;
  category: string;
  hint?: string;
  difficulty?: string;
}


export interface PodiumPlayerDto {
  playerId: string;
  nickname: string;
  score: number;
  rank: number;
  correctCount: number;
  wrongCount: number;
}

export interface GameSummaryDto {
  winnerNickname: string;
  totalRoundsPlayed: number;
  leaderboard: PodiumPlayerDto[];
}

export interface GameSession {
  roomId: string;
  state: string | number;
  currentQuestion: string;
  currentAnswer?: string;
  currentQuestionDto?: QuestionDto;
  currentRound: {
    number: number;
    question: string;
    answer?: string;
  };
  buzzWinnerId: string | null;
  buzzWinnerName?: string | null;
  lockedOutPlayerIds?: string[];
  hasJudgedCurrentQuestion?: boolean;
  isAnswered?: boolean;
  secondsRemaining?: number;
  targetPoints?: number;
  answerTimeoutSeconds?: number;
  totalRounds?: number;
  isEnded?: boolean;
  winnerNickname?: string | null;
  scores?: Record<string, number>;
  lastScoreChanges?: Record<string, number>;
  correctCounts?: Record<string, number>;
  wrongCounts?: Record<string, number>;
  selectedCategory?: string;
}

