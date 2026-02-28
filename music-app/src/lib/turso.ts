import { createClient } from '@libsql/client';

const url = import.meta.env.VITE_TURSO_DATABASE_URL;
const authToken = import.meta.env.VITE_TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  throw new Error('Missing Turso environment variables');
}

export const turso = createClient({
  url,
  authToken
});

// Helper to parse JSON arrays from SQLite
export const parseJsonArray = (value: string | null): string[] => {
  if (!value) return [];
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
};