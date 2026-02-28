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
  created_at: string;
}

// Setlists - Flexible Category System
export type SetlistCategory = 'Worship' | 'Choir' | 'Special' | 'Prelude' | 'Offertory' | 'Communion' | 'Recessional' | 'Postlude';

export interface SetlistSongItem {
  song_id: string;
  category_for_service: SetlistCategory;
  order: number;
}

export interface Setlist {
  id: string;
  date: string;
  song_ids: string[] | SetlistSongItem[];
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