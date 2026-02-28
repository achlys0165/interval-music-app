import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Shield, 
  Music as MusicIcon, 
  Loader2, 
  UserCircle, 
  Lock, 
  ChevronRight 
} from 'lucide-react';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const success = await login(username, password);
      
      if (!success) {
        setError('Invalid credentials. Please try again.');
      }
      // Navigation happens automatically via useEffect above
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/5 blur-[120px] rounded-full"></div>

      <div className="max-w-md w-full z-10">
        <div className="text-center mb-10">
          <div className="inline-block p-4 bg-white/5 border border-white/10 rounded-2xl mb-6">
            <div className="w-12 h-12 bg-white flex items-center justify-center rounded-xl">
               <span className="text-black font-black text-3xl italic leading-none">H</span>
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tighter mb-2 italic">HIMIG</h1>
          <p className="text-white/40 text-xs tracking-[0.2em] uppercase font-bold">TOP - Music Ministry</p>
        </div>

        <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          
          <h2 className="text-xl font-bold mb-8 text-center italic tracking-tight">Music System</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-black ml-1">
                Username
              </label>
              <div className="relative group/input">
                <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-white transition-colors" size={18} />
                <input 
                  type="text" 
                  autoFocus
                  placeholder="johnsmith"
                  className="w-full bg-black border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-white/20 focus:border-white/30 focus:bg-white/[0.02] outline-none transition-all"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-black ml-1">
                Password
              </label>
              <div className="relative group/input">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-white transition-colors" size={18} />
                <input 
                  type="password" 
                  placeholder="••••••••"
                  className="w-full bg-black border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-white/20 focus:border-white/30 focus:bg-white/[0.02] outline-none transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[11px] font-bold uppercase tracking-wider text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-4 bg-white text-black rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-white/90 active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:cursor-not-allowed group/btn"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  Log In 
                  <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-[11px] text-white/30">
              Don't have an account?{' '}
              <Link to="/register" className="text-white hover:text-white/80 transition-colors font-bold">
                Create Account
              </Link>
            </p>
          </div>

          <div className="mt-10 flex flex-col items-center gap-4">
             <div className="w-12 h-px bg-white/5"></div>
             <p className="text-[9px] text-white/10 uppercase tracking-[0.4em] font-black">
               {loading ? 'Authenticating...' : 'Authorized Personnel Only'}
             </p>
          </div>
        </div>

        <div className="mt-8 text-center space-y-4">
           <div className="flex items-center justify-center gap-8 opacity-20 hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-2">
                <Shield size={12} />
                <span className="text-[9px] font-black uppercase tracking-widest">Secure Access</span>
              </div>
              <div className="flex items-center gap-2">
                <MusicIcon size={12} />
                <span className="text-[9px] font-black uppercase tracking-widest">Ministry Ready</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Login;