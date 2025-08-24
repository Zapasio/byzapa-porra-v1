export type MatchResult = 'HOME' | 'AWAY' | 'DRAW' | null;

export interface Team {
  id: string;  // Lowercase como en DB (ej. "ala"), ajusta si usas uppercase local
  name: string;
  logo?: string;  // URL para imagen
  short?: string; // Abreviatura, ej. "Alavés"
}

export interface Matchday {
  seasonId: string;
  number: number;
  status: 'open' | 'locked' | 'processed';
}

export interface Match {
  id: string;
  seasonId: string;
  matchDayNumber: number;  // D mayús como en DB
  homeTeamId: string;     // Lowercase id
  awayTeamId: string;     // Lowercase id
  kickoff: any;           // Timestamp o ISO string
  result: MatchResult;
}

export interface Pick {
  id: string;
  userId: string;
  displayName: string;
  seasonId: string;
  matchDayNumber: number;  // D mayús
  teamId: string;          // Lowercase id
  createdAt: any;          // Timestamp
}

export interface LeaderboardItem {
  uid: string;
  displayName: string;
  points: number;
  played?: number;
  wins?: number;
}

export interface Leaderboard {
  id: string;
  items: LeaderboardItem[];
}

export interface User {
  id: string;
  isApproved?: boolean;
  picksCount?: number;
}

export interface AiExplanation {
  id: string;
  createdAt: any;
  matchDay: number;
  text: string;
  user: string;
}

export interface AppConfig {
  seasonId: string;      // ej. '2025-26'
  matchdayNumber: number; // Jornada actual
}