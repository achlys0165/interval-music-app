import React, { createContext, useContext, useState, useEffect } from 'react';
import { turso } from '../lib/turso';
import bcrypt from 'bcryptjs';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  username: string;
  password: string;
  name: string;
  email?: string;
  instrument?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const sessionId = localStorage.getItem('himig_session');
      if (!sessionId) {
        setLoading(false);
        return;
      }

      const { rows } = await turso.execute({
        sql: `SELECT u.id, u.username, u.name, u.email, u.role, u.instrument 
              FROM users u 
              JOIN sessions s ON u.id = s.user_id 
              WHERE s.id = ? AND s.expires_at > datetime('now')`,
        args: [sessionId]
      });

      if (rows.length > 0) {
        setUser(rows[0] as unknown as User);
      } else {
        localStorage.removeItem('himig_session');
      }
    } catch (error) {
      console.error('Session check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const { rows } = await turso.execute({
        sql: 'SELECT * FROM users WHERE username = ?',
        args: [username.toLowerCase()]
      });

      if (rows.length === 0) return false;

      const dbUser = rows[0];
      const validPassword = await bcrypt.compare(password, dbUser.hashed_password as string);
      
      if (!validPassword) return false;

      const sessionId = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await turso.execute({
        sql: 'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)',
        args: [sessionId, dbUser.id, expiresAt.toISOString()]
      });

      localStorage.setItem('himig_session', sessionId);
      
      setUser({
        id: dbUser.id as string,
        username: dbUser.username as string,
        name: dbUser.name as string,
        email: dbUser.email as string,
        role: dbUser.role as 'admin' | 'musician',
        instrument: dbUser.instrument as string
      });

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      const { rows: existing } = await turso.execute({
        sql: 'SELECT id FROM users WHERE username = ?',
        args: [data.username.toLowerCase()]
      });

      if (existing.length > 0) {
        throw new Error('Username already exists');
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
      const userId = crypto.randomUUID();

      await turso.execute({
        sql: `INSERT INTO users (id, username, hashed_password, name, email, role, instrument) 
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          userId,
          data.username.toLowerCase(),
          hashedPassword,
          data.name,
          data.email || null,
          'musician',
          data.instrument || null
        ]
      });

      return true;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    const sessionId = localStorage.getItem('himig_session');
    if (sessionId) {
      await turso.execute({
        sql: 'DELETE FROM sessions WHERE id = ?',
        args: [sessionId]
      });
      localStorage.removeItem('himig_session');
    }
    setUser(null);
  };

  const refreshUser = async () => {
    if (!user) return;
    try {
      const { rows } = await turso.execute({
        sql: 'SELECT id, username, name, email, role, instrument FROM users WHERE id = ?',
        args: [user.id]
      });
      if (rows.length > 0) {
        setUser(rows[0] as unknown as User);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};