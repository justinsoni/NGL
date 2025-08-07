
export type Position = 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward';
export type UserRole = 'user' | 'admin' | 'coach' | 'manager' | 'player';
export type GroupName = 'A' | 'B' | 'C' | 'D';
export type RegistrationStatus = 'pending' | 'approved' | 'rejected';
export type NotificationType = 'account_created' | 'registration_approved' | 'registration_rejected';

export interface Player {
  id: number;
  name: string;
  email: string;
  phone: string;
  dob: string;
  position: Position;
  nationality: string;
  flag: string;
  club: string;
  clubLogo: string;
  previousClub: string;
  leaguesPlayed: string[];
  imageUrl: string;
  identityCardUrl: string; // New field for player identity/card
  bio: string;
  isVerified: boolean; // New field to track verification status
  addedBy: number; // ID of the manager who added this player
  stats: {
    matches: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
  };
}

export interface CreatedUser {
  id: number;
  email: string;
  password: string;
  role: UserRole;
  clubId?: number;
  clubName?: string;
  addedBy?: number; // ID of the user who created this account
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface PlayerRegistration {
  id: number;
  name: string;
  email: string;
  phone: string;
  dob: string;
  position: Position;
  nationality: string;
  previousClub: string;
  leaguesPlayed: string[];
  imageUrl: string;
  identityCardUrl: string;
  bio: string;
  status: RegistrationStatus;
  clubId: number;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: number;
  rejectionReason?: string;
}

export interface EmailNotification {
  id: number;
  to: string;
  subject: string;
  body: string;
  type: NotificationType;
  sentAt: string;
  userId?: number;
}

export interface Club {
  id: number;
  name: string;
  logo: string;
  founded?: string;
  stadium?: string;
}

export interface Match {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  date: string;
  kickoff?: string;
  stage: string;
  status: 'upcoming' | 'live' | 'finished';
  homeLogo?: string;
  awayLogo?: string;
  venue?: string;
  group?: string;
}

export interface TableEntry {
  id: number;
  pos: number;
  club: string;
  logo: string;
  p: number; // played
  w: number; // won
  d: number; // drawn
  l: number; // lost
  gf: number; // goals for
  ga: number; // goals against
  gd: number; // goal difference
  pts: number; // points
  form?: string[];
  matchHistory?: any[];
}

export interface LeaderStat {
  statUnit: string;
  leaderboard: Array<{
    playerId: number;
    playerName: string;
    value: number;
    club: string;
    clubLogo: string;
  }>;
}

export interface ClubVideo {
  id: number;
  title: string;
  url: string;
  thumbnail: string;
}

