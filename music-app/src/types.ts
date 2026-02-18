export enum UserRole {
  ADMIN = 'admin',
  MUSICIAN = 'musician'
}

export enum ScheduleStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected'
}

export interface User {
  id: string;
  username: string;
  name: string;
  email?: string;
  role: UserRole;
  instrument?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Song {
  id: string;
  title: string;
  original_key: string;
  category: 'Worship' | 'Choir' | 'Special';
  tempo?: string;
  reference_url?: string;
  lyrics?: string;
  created_by?: string;
  created_at?: string;
}

export interface Schedule {
  id: string;
  date: string;
  musician_id: string;
  role: string;
  status: ScheduleStatus;
  song_ids?: string[];
  created_at?: string;
  musician?: User;
}

export interface Setlist {
  id: string;
  date: string;
  song_ids: string[];
  theme?: string;
  created_at?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  date: string;
  read: boolean;
  created_at: string;
}