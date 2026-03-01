// User & Authentication
export interface User {
  id: string;
  username: string;
  name: string;
  email?: string;
  role: 'admin' | 'musician';
  instrument?: string;
}

export enum UserRole {
  ADMIN = 'admin',
  MUSICIAN = 'musician'
}

// Songs
export interface Song {
  id: string;
  title: string;
  original_key: string;
  category: 'Worship' | 'Choir' | 'Special';
  tempo?: string;
  lyrics?: string;
  reference_url?: string;
  created_by?: string;
  created_at: string;
}

// Schedules
export enum ScheduleStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected'
}

export interface Schedule {
  id: string;
  date: string;
  musician_id: string;
  musician?: {
    id: string;
    name: string;
    instrument?: string;
  };
  role: string;
  status: ScheduleStatus;
  decline_reason?: string;
  created_at: string;
}

// Setlists
export interface Setlist {
  id: string;
  date: string;
  song_ids: string[];
  theme?: string;
  created_at: string;
}

// Notifications
export interface Notification {
  id: string;
  user_id: string;
  message: string;
  read: boolean;
  type: string;
  created_at: string;
}