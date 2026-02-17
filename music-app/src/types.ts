// ============================================
// UPDATED TYPES - Snake case to match Supabase
// ============================================

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
  name: string;
  email: string;
  role: UserRole;
  instrument?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Song {
  id: string;
  title: string;
  original_key: string;        // Changed from originalKey
  category: 'Worship' | 'Choir' | 'Special';
  tempo?: string;
  reference_url?: string;      // Changed from referenceUrl
  lyrics?: string;
  created_by?: string;         // Changed from createdBy
  created_at?: string;
}

export interface Schedule {
  id: string;
  date: string;
  musician_id: string;         // Changed from musicianId
  role: string;
  status: ScheduleStatus;
  song_ids?: string[];         // Changed from songIds
  created_at?: string;
  // Joined data from Supabase
  musician?: User;             // This comes from the join in queries
}

export interface Setlist {
  id: string;
  date: string;
  song_ids: string[];          // Changed from songIds
  theme?: string;
  created_at?: string;
}

export interface Notification {
  id: string;
  user_id: string;             // Changed from userId
  message: string;
  read: boolean;
  created_at: string;          // Changed from date
}