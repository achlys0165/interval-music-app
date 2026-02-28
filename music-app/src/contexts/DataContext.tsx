import React, { createContext, useContext, useState, useEffect } from 'react';
import { turso, parseJsonArray } from '../lib/turso';
import { useAuth } from './AuthContext';
import { Song, Schedule, Setlist, Notification, ScheduleStatus } from '../types';

interface DataContextType {
  songs: Song[];
  schedules: Schedule[];
  setlists: Setlist[];
  notifications: Notification[];
  loading: boolean;
  refreshData: () => Promise<void>;
  addSong: (song: Partial<Song>) => Promise<void>;
  assignMusician: (assignment: Partial<Schedule>) => Promise<void>;
  updateScheduleStatus: (scheduleId: string, status: ScheduleStatus) => Promise<void>;
  updateSetlist: (setlist: Partial<Setlist>) => Promise<void>;
  markNotificationsRead: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user]);

  const refreshData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSongs(),
        fetchSchedules(),
        fetchSetlists(),
        fetchNotifications()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSongs = async () => {
    const { rows } = await turso.execute('SELECT * FROM songs ORDER BY created_at DESC');
    setSongs(rows as unknown as Song[]);
  };

  const fetchSchedules = async () => {
    const { rows } = await turso.execute(`
      SELECT s.*, u.name as musician_name, u.instrument as musician_instrument
      FROM schedules s
      LEFT JOIN users u ON s.musician_id = u.id
      ORDER BY s.date DESC
    `);
    
    const formattedSchedules: Schedule[] = rows.map((row: any) => ({
      id: row.id,
      date: row.date,
      musician_id: row.musician_id,
      musician: row.musician_name ? {
        id: row.musician_id,
        name: row.musician_name,
        instrument: row.musician_instrument
      } : undefined,
      role: row.role,
      status: row.status as ScheduleStatus,
      song_ids: parseJsonArray(row.song_ids),
      created_at: row.created_at
    }));

    setSchedules(formattedSchedules);
  };

  const fetchSetlists = async () => {
    const { rows } = await turso.execute('SELECT * FROM setlists ORDER BY date DESC');
    
    const formattedSetlists: Setlist[] = rows.map((row: any) => ({
      id: row.id,
      date: row.date,
      song_ids: parseJsonArray(row.song_ids),
      theme: row.theme,
      created_at: row.created_at
    }));

    setSetlists(formattedSetlists);
  };

  const fetchNotifications = async () => {
    if (!user) return;
    
    const { rows } = await turso.execute({
      sql: 'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      args: [user.id]
    });
    
    setNotifications(rows as unknown as Notification[]);
  };

  const addSong = async (song: Partial<Song>) => {
    if (!user) throw new Error('Not authenticated');

    const id = crypto.randomUUID();
    await turso.execute({
      sql: `INSERT INTO songs (id, title, original_key, category, tempo, lyrics, reference_url, created_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        song.title || '',
        song.original_key || 'C',
        song.category || 'Worship',
        song.tempo || '',
        song.lyrics || '',
        song.reference_url || '',
        user.id
      ]
    });

    await fetchSongs();
  };

  const assignMusician = async (assignment: Partial<Schedule>) => {
    const id = crypto.randomUUID();
    await turso.execute({
      sql: `INSERT INTO schedules (id, date, musician_id, role, status, song_ids) 
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        assignment.date || '',
        assignment.musician_id || '',
        assignment.role || '',
        ScheduleStatus.PENDING,
        JSON.stringify(assignment.song_ids || [])
      ]
    });

    if (assignment.musician_id) {
      await turso.execute({
        sql: `INSERT INTO notifications (id, user_id, message, type) 
              VALUES (?, ?, ?, ?)`,
        args: [
          crypto.randomUUID(),
          assignment.musician_id,
          `You have been assigned as ${assignment.role} on ${assignment.date}`,
          'assignment'
        ]
      });
    }

    await fetchSchedules();
    await fetchNotifications();
  };

  const updateScheduleStatus = async (scheduleId: string, status: ScheduleStatus) => {
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

    if (rows.length > 0) {
      const schedule = rows[0];
      const { rows: admins } = await turso.execute("SELECT id FROM users WHERE role = 'admin'");

      for (const admin of admins) {
        await turso.execute({
          sql: `INSERT INTO notifications (id, user_id, message, type) 
                VALUES (?, ?, ?, ?)`,
          args: [
            crypto.randomUUID(),
            admin.id as string,
            `${schedule.musician_name} has ${status} the assignment for ${schedule.role} on ${schedule.date}`,
            'status_update'
          ]
        });
      }
    }

    await fetchSchedules();
  };

  const updateSetlist = async (setlist: Partial<Setlist>) => {
    if (!setlist.date) return;

    const { rows } = await turso.execute({
      sql: 'SELECT id FROM setlists WHERE date = ?',
      args: [setlist.date]
    });

    if (rows.length > 0) {
      await turso.execute({
        sql: 'UPDATE setlists SET song_ids = ? WHERE date = ?',
        args: [JSON.stringify(setlist.song_ids || []), setlist.date]
      });
    } else {
      await turso.execute({
        sql: `INSERT INTO setlists (id, date, song_ids, theme) 
              VALUES (?, ?, ?, ?)`,
        args: [
          crypto.randomUUID(),
          setlist.date,
          JSON.stringify(setlist.song_ids || []),
          setlist.theme || ''
        ]
      });
    }

    await fetchSetlists();
  };

  const markNotificationsRead = async () => {
    if (!user) return;
    
    await turso.execute({
      sql: 'UPDATE notifications SET read = TRUE WHERE user_id = ?',
      args: [user.id]
    });

    await fetchNotifications();
  };

  return (
    <DataContext.Provider value={{
      songs,
      schedules,
      setlists,
      notifications,
      loading,
      refreshData,
      addSong,
      assignMusician,
      updateScheduleStatus,
      updateSetlist,
      markNotificationsRead
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};