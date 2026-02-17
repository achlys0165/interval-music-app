
export enum UserRole {
  ADMIN = 'ADMIN',
  MUSICIAN = 'MUSICIAN'
}

export enum ScheduleStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  instrument?: string;
}

export interface Song {
  id: string;
  title: string;
  originalKey: string;
  category: 'Choir' | 'Worship' | 'Special';
  tempo?: string;
  lyrics?: string;
  referenceUrl?: string;
}

export interface Setlist {
  id: string;
  date: string;
  songIds: string[];
  theme?: string;
}

export interface Schedule {
  id: string;
  date: string;
  musicianId: string;
  role: string;
  status: ScheduleStatus;
  songIds: string[];
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  date: string;
  read: boolean;
}
