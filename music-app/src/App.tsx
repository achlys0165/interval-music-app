import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase, signInWithEmail, signInWithGoogle, signOut, subscribeToTable } from './lib/supabase';
import { User, UserRole, Song, Schedule, Notification, ScheduleStatus, Setlist } from './types';
import Login from './pages/Login';
import Register from './pages/Register';
import MusicianDashboard from './pages/MusicianDashboard';
import MusicianSchedule from './pages/MusicianSchedule';
import AdminDashboard from './pages/AdminDashboard';
import AdminSchedule from './pages/AdminSchedule';
import AdminSongs from './pages/AdminSongs';
import AdminPanel from './pages/AdminPanel';
import SetlistPage from './pages/SetlistPage';
import SearchPage from './pages/SearchPage';
import SettingsPage from './pages/SettingsPage';
import NotificationsPage from './pages/NotificationsPage';
import Layout from './components/Layout';

// Auth Context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

// Data Context
interface DataContextType {
  songs: Song[];
  schedules: Schedule[];
  setlists: Setlist[];
  notifications: Notification[];
  loading: boolean;
  addSong: (song: Omit<Song, 'id' | 'created_at'>) => Promise<void>;
  updateScheduleStatus: (id: string, status: ScheduleStatus) => Promise<void>;
  assignMusician: (data: Omit<Schedule, 'id' | 'status' | 'created_at'>) => Promise<void>;
  updateSetlist: (data: Omit<Setlist, 'id' | 'created_at'>) => Promise<void>;
  markNotificationsRead: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [songs, setSongs] = useState<Song[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Fetch user profile from Supabase
  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    
    return data as User;
  };

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    
    try {
      // Fetch songs
      const { data: songsData, error: songsError } = await supabase
        .from('songs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (songsError) throw songsError;
      setSongs(songsData || []);

      // Fetch schedules with musician details
      const { data: schedulesData, error: schedulesError } = await supabase
        .from('schedules')
        .select('*, musician:profiles(*)')
        .order('date', { ascending: true });
      
      if (schedulesError) throw schedulesError;
      setSchedules(schedulesData || []);

      // Fetch setlists
      const { data: setlistsData, error: setlistsError } = await supabase
        .from('setlists')
        .select('*')
        .order('date', { ascending: true });
      
      if (setlistsError) throw setlistsError;
      setSetlists(setlistsData || []);

      // Fetch notifications for current user
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (notificationsError) throw notificationsError;
      setNotifications(notificationsData || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  // Auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setUser(profile);
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });

    // Check initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setUser(profile);
      }
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch data when user changes
  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user, fetchAllData]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const unsubSongs = subscribeToTable('songs', () => fetchAllData());
    const unsubSchedules = subscribeToTable('schedules', () => fetchAllData());
    const unsubSetlists = subscribeToTable('setlists', () => fetchAllData());
    const unsubNotifications = subscribeToTable('notifications', () => fetchAllData());

    return () => {
      unsubSongs();
      unsubSchedules();
      unsubSetlists();
      unsubNotifications();
    };
  }, [user, fetchAllData]);

const login = async (email: string, password: string): Promise<boolean> => {
  console.log('Login attempt:', email);
  
  const { data, error } = await signInWithEmail(email, password);
  
  if (error) {
    console.error('Sign in error:', error.message);
    return false;
  }
  
  if (!data.user) {
    console.error('No user returned');
    return false;
  }
  
  console.log('Auth successful, user ID:', data.user.id);
  
  // Try to fetch profile from database first
  let profile = await fetchUserProfile(data.user.id);
  
  if (!profile) {
    console.log('No profile found in DB, creating from auth metadata...');
    
    // Get metadata safely - only full_name is guaranteed
    const userData = data.user.user_metadata as { full_name?: string };
    
    const newProfile: User = {
      id: data.user.id,
      email: data.user.email || email,
      name: userData?.full_name || email.split('@')[0],
      role: UserRole.MUSICIAN,
      instrument: '' // Default empty, not from metadata
    };
    
    // Try to insert profile
    const { error: insertError } = await supabase
      .from('profiles')
      .insert([{
        id: newProfile.id,
        name: newProfile.name,
        email: newProfile.email,
        role: newProfile.role,
        instrument: newProfile.instrument,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);
    
    if (insertError) {
      console.warn('Could not create profile in DB:', insertError.message);
    }
    
    profile = newProfile;
  }
  
  console.log('Setting user profile:', profile);
  setUser(profile);
  return true;
};

  const loginWithGoogle = async (): Promise<boolean> => {
    const { error } = await signInWithGoogle();
    return !error;
  };

  const logout = async () => {
    await signOut();
    setUser(null);
    setSongs([]);
    setSchedules([]);
    setSetlists([]);
    setNotifications([]);
  };

  const addSong = async (song: Omit<Song, 'id' | 'created_at'>) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('songs')
      .insert([{ ...song, created_by: user.id }]);
    
    if (error) throw error;
    await fetchAllData();
  };

  const updateScheduleStatus = async (id: string, status: ScheduleStatus) => {
    const { error } = await supabase
      .from('schedules')
      .update({ status })
      .eq('id', id);
    
    if (error) throw error;
    
    // Create notification for admin
    const schedule = schedules.find(s => s.id === id);
    if (schedule) {
      const adminUsers = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin');
      
      if (adminUsers.data) {
        await supabase.from('notifications').insert(
          adminUsers.data.map(admin => ({
            user_id: admin.id,
            message: `${user?.name} has ${status} the assignment for ${schedule.date} (${schedule.role}).`,
            read: false
          }))
        );
      }
    }
    
    await fetchAllData();
  };

  const assignMusician = async (data: Omit<Schedule, 'id' | 'status' | 'created_at'>) => {
    const { error } = await supabase
      .from('schedules')
      .insert([{ ...data, status: ScheduleStatus.PENDING }]);
    
    if (error) throw error;
    
    // Notify musician
    await supabase.from('notifications').insert([{
      user_id: data.musician_id,
      message: `You've been assigned as ${data.role} for ${data.date}.`,
      read: false
    }]);
    
    await fetchAllData();
  };

  const updateSetlist = async (data: Omit<Setlist, 'id' | 'created_at'>) => {
    const existing = setlists.find(s => s.date === data.date);
    
    if (existing) {
      const { error } = await supabase
        .from('setlists')
        .update({ song_ids: data.song_ids, theme: data.theme })
        .eq('id', existing.id);
      
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('setlists')
        .insert([data]);
      
      if (error) throw error;
    }
    
    await fetchAllData();
  };

  const markNotificationsRead = async () => {
    if (!user) return;
    
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);
    
    if (error) throw error;
    await fetchAllData();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading: authLoading, 
      login, 
      loginWithGoogle, 
      logout 
    }}>
      <DataContext.Provider value={{ 
        songs, 
        schedules, 
        setlists, 
        notifications, 
        loading: dataLoading,
        addSong, 
        updateScheduleStatus, 
        assignMusician, 
        updateSetlist, 
        markNotificationsRead,
        refreshData: fetchAllData
      }}>
        <HashRouter>
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
            <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
            <Route element={user ? <Layout /> : <Navigate to="/login" />}>
              <Route path="/setlist" element={<SetlistPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/settings" element={<SettingsPage />} />

              {user?.role === UserRole.ADMIN ? (
                <>
                  <Route path="/" element={<AdminDashboard />} />
                  <Route path="/schedule" element={<AdminSchedule />} />
                  <Route path="/admin-songs" element={<AdminSongs />} />
                  <Route path="/admin-panel" element={<AdminPanel />} />
                </>
              ) : (
                <>
                  <Route path="/" element={<MusicianDashboard />} />
                  <Route path="/schedule" element={<MusicianSchedule />} />
                </>
              )}
            </Route>
          </Routes>
        </HashRouter>
      </DataContext.Provider>
    </AuthContext.Provider>
  );
};

export default App;