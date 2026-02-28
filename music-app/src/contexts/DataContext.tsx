import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { turso } from '../lib/turso';
import { Song, Schedule, Setlist, Notification, ScheduleStatus } from '../types';
import { useAuth } from './AuthContext';

interface DataContextType {
  songs: Song[];
  schedules: Schedule[];
  setlists: Setlist[];
  notifications: Notification[];
  loading: boolean;
  addSong: (song: Omit<Song, 'id' | 'created_at'>) => Promise<void>;
  assignMusician: (assignment: { musician_id: string; date: string; role: string }) => Promise<void>;
  updateScheduleStatus: (scheduleId: string, status: ScheduleStatus) => Promise<void>;
  updateSetlist: (setlist: { date: string; song_ids: string[] }) => Promise<void>;
  markNotificationsRead: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  const [songs, setSongs] = useState<Song[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSongs = useCallback(async () => {
    try {
      const { rows } = await turso.execute({
        sql: 'SELECT * FROM songs ORDER BY created_at DESC'
      });
      
      const typedSongs: Song[] = rows.map((row: any) => ({
        id: row.id,
        title: row.title,
        original_key: row.original_key,
        category: row.category,
        lyrics: row.lyrics,
        reference_url: row.reference_url,
        tempo: row.tempo,
        created_at: row.created_at
      }));
      
      setSongs(typedSongs);
    } catch (error) {
      console.error('Error fetching songs:', error);
    }
  }, []);

  const fetchSchedules = useCallback(async () => {
    try {
      const { rows } = await turso.execute({
        sql: `
          SELECT s.*, u.name as musician_name, u.instrument 
          FROM schedules s
          LEFT JOIN users u ON s.musician_id = u.id
          ORDER BY s.date ASC
        `
      });
      
      // Match your actual Schedule type with song_ids
      const transformedRows: Schedule[] = rows.map((row: any) => ({
        id: row.id,
        musician_id: row.musician_id,
        date: row.date,
        role: row.role,
        status: row.status,
        song_ids: row.song_ids ? JSON.parse(row.song_ids) : [], // Add this if your type requires it
        created_at: row.created_at,
        musician: row.musician_name ? {
          id: row.musician_id,
          name: row.musician_name,
          instrument: row.instrument
        } : undefined
      }));
      
      setSchedules(transformedRows);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  }, []);

  const fetchSetlists = useCallback(async () => {
    try {
      const { rows } = await turso.execute({
        sql: 'SELECT * FROM setlists ORDER BY date DESC'
      });
      
      const typedSetlists: Setlist[] = rows.map((row: any) => ({
        id: row.id,
        date: row.date,
        song_ids: row.song_ids ? JSON.parse(row.song_ids) : [],
        created_at: row.created_at
      }));
      
      setSetlists(typedSetlists);
    } catch (error) {
      console.error('Error fetching setlists:', error);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { rows } = await turso.execute({
        sql: 'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
        args: [user.id]
      });
      
      // Match your actual Notification type with 'type' property
      const typedNotifications: Notification[] = rows.map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        message: row.message,
        type: row.type || 'info', // Add default type if missing
        read: Boolean(row.read),
        created_at: row.created_at
      }));
      
      setNotifications(typedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [user]);

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      await Promise.all([
        fetchSongs(),
        fetchSchedules(),
        fetchSetlists(),
        fetchNotifications()
      ]);
      setLoading(false);
    };
    
    if (user) {
      loadAllData();
    }
  }, [user, fetchSongs, fetchSchedules, fetchSetlists, fetchNotifications]);

  const refreshData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchSongs(),
      fetchSchedules(),
      fetchSetlists(),
      fetchNotifications()
    ]);
    setLoading(false);
  }, [fetchSongs, fetchSchedules, fetchSetlists, fetchNotifications]);

  const addSong = async (songData: Omit<Song, 'id' | 'created_at'>) => {
    try {
      const id = 'song-' + Date.now();
      await turso.execute({
        sql: `INSERT INTO songs (id, title, original_key, category, lyrics, reference_url, tempo, created_at) 
              VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        args: [
          id,
          songData.title,
          songData.original_key,
          songData.category,
          songData.lyrics || '',
          songData.reference_url || '',
          songData.tempo || ''
        ]
      });
      
      const { rows: users } = await turso.execute({
        sql: 'SELECT id FROM users'
      });
      
      for (const u of users) {
        await turso.execute({
          sql: `INSERT INTO notifications (id, user_id, message, type, read, created_at) 
                VALUES (?, ?, ?, ?, ?, datetime('now'))`,
          args: [
            'notif-' + Date.now() + '-' + (u as any).id,
            (u as any).id,
            `New song added: ${songData.title}`,
            'song',
            false
          ]
        });
      }
      
      await fetchSongs();
      await fetchNotifications();
    } catch (error) {
      console.error('Error adding song:', error);
      throw error;
    }
  };

  const assignMusician = async (assignment: { musician_id: string; date: string; role: string }) => {
    try {
      const { rows: existing } = await turso.execute({
        sql: 'SELECT id FROM schedules WHERE date = ? AND role = ?',
        args: [assignment.date, assignment.role]
      });
      
      if (existing.length > 0) {
        throw new Error(`Position ${assignment.role} is already filled for this date`);
      }
      
      const id = 'sched-' + Date.now();
      await turso.execute({
        sql: `INSERT INTO schedules (id, musician_id, date, role, status, created_at) 
              VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        args: [
          id,
          assignment.musician_id,
          assignment.date,
          assignment.role,
          ScheduleStatus.PENDING
        ]
      });
      
      await turso.execute({
        sql: `INSERT INTO notifications (id, user_id, message, type, read, created_at) 
              VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        args: [
          'notif-' + Date.now(),
          assignment.musician_id,
          `You have been assigned as ${assignment.role} on ${assignment.date}`,
          'schedule',
          false
        ]
      });
      
      await fetchSchedules();
      await fetchNotifications();
    } catch (error) {
      console.error('Error assigning musician:', error);
      throw error;
    }
  };

  const updateScheduleStatus = async (scheduleId: string, status: ScheduleStatus) => {
    try {
      await turso.execute({
        sql: 'UPDATE schedules SET status = ? WHERE id = ?',
        args: [status, scheduleId]
      });
      
      const { rows } = await turso.execute({
        sql: `SELECT s.*, u.name as musician_name FROM schedules s 
              JOIN users u ON s.musician_id = u.id 
              WHERE s.id = ?`,
        args: [scheduleId]
      });
      
      const schedule = rows[0] as any;
      
      const { rows: admins } = await turso.execute({
        sql: 'SELECT id FROM users WHERE role = ?',
        args: ['admin']
      });
      
      for (const admin of admins) {
        await turso.execute({
          sql: `INSERT INTO notifications (id, user_id, message, type, read, created_at) 
                VALUES (?, ?, ?, ?, ?, datetime('now'))`,
          args: [
            'notif-' + Date.now(),
            (admin as any).id,
            `${schedule.musician_name} ${status} the assignment for ${schedule.role} on ${schedule.date}`,
            'schedule',
            false
          ]
        });
      }
      
      await fetchSchedules();
      await fetchNotifications();
    } catch (error) {
      console.error('Error updating schedule status:', error);
      throw error;
    }
  };

  const updateSetlist = async (setlistData: { date: string; song_ids: string[] }) => {
    try {
      const { rows: existing } = await turso.execute({
        sql: 'SELECT id FROM setlists WHERE date = ?',
        args: [setlistData.date]
      });
      
      const songIdsJson = JSON.stringify(setlistData.song_ids);
      
      if (existing.length > 0) {
        await turso.execute({
          sql: 'UPDATE setlists SET song_ids = ? WHERE date = ?',
          args: [songIdsJson, setlistData.date]
        });
      } else {
        await turso.execute({
          sql: `INSERT INTO setlists (id, date, song_ids, created_at) 
                VALUES (?, ?, ?, datetime('now'))`,
          args: [
            'setlist-' + Date.now(),
            setlistData.date,
            songIdsJson
          ]
        });
      }
      
      await fetchSetlists();
    } catch (error) {
      console.error('Error updating setlist:', error);
      throw error;
    }
  };

  const markNotificationsRead = async () => {
    if (!user) return;
    try {
      await turso.execute({
        sql: 'UPDATE notifications SET read = ? WHERE user_id = ? AND read = ?',
        args: [true, user.id, false]
      });
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking notifications read:', error);
    }
  };

  const value: DataContextType = {
    songs,
    schedules,
    setlists,
    notifications,
    loading,
    addSong,
    assignMusician,
    updateScheduleStatus,
    updateSetlist,
    markNotificationsRead,
    refreshData
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};