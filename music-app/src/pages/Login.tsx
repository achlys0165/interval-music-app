import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App';
import { 
  Shield, 
  Music as MusicIcon, 
  Loader2, 
  Mail, 
  Lock, 
  ChevronRight 
} from 'lucide-react';

const Login: React.FC = () => {
  const { login, loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const success = await login(email, password);
      if (!success) {
        setError('Invalid credentials. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'An error occurred during Google sign-in.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background blobs for subtle aesthetic */}
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
          <p className="text-white/40 text-xs tracking-[0.2em] uppercase font-bold">TOP - Music Ministry </p>
        </div>

        <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          
          <h2 className="text-xl font-bold mb-8 text-center italic tracking-tight">System Authentication</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-black ml-1">Email Address</label>
              <div className="relative group/input">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-white transition-colors" size={18} />
                <input 
                  type="email" 
                  autoFocus
                  placeholder="name@ministry.com"
                  className="w-full bg-black border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-white/30 focus:bg-white/[0.02] outline-none transition-all placeholder:text-white/10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading || googleLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-black ml-1">Password</label>
              <div className="relative group/input">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-white transition-colors" size={18} />
                <input 
                  type="password" 
                  placeholder="••••••••"
                  className="w-full bg-black border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-white/30 focus:bg-white/[0.02] outline-none transition-all placeholder:text-white/10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || googleLoading}
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[11px] font-bold uppercase tracking-wider text-center animate-in fade-in slide-in-from-top-2 duration-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
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

          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-white/5"></div>
            <span className="text-[9px] text-white/20 font-black uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-white/5"></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            className="w-full flex items-center justify-center gap-3 py-4 bg-black border border-white/10 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-white/5 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                <div className="w-5 h-5 flex items-center justify-center border border-white/40 rounded-sm text-[10px] leading-none mr-1">G</div>
                Continue with Google
              </>
            )}
          </button>

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
               {loading || googleLoading ? 'Authenticating Signature' : 'Authorized Personnel Only'}
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