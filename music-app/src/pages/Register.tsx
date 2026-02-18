import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUpWithUsername } from '../lib/supabase';
import { UserRole } from '../types';
import { 
  Mail, 
  Lock, 
  User, 
  Loader2, 
  ChevronRight, 
  ArrowLeft,
  CheckCircle,
  UserCircle
} from 'lucide-react';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',  // Real email - only stored in profiles table
    instrument: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.username || !formData.email || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Creating user with username:', formData.username);
      console.log('Real email (for profiles only):', formData.email);
      
      const { data: authData, error: authError } = await signUpWithUsername(
        formData.username,
        formData.password,
        formData.email,  // Real email - goes to profiles table only
        {
          full_name: formData.name,
          instrument: formData.instrument
        }
      );

      console.log('Auth response:', authData, authError);

      if (authError) throw authError;
      
      if (!authData.user) {
        throw new Error('User creation failed');
      }

      console.log('User created successfully with fake auth email:', authData.user.email);
      console.log('Real email stored in profiles table only');
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="inline-block p-4 bg-green-500/10 border border-green-500/20 rounded-full mb-6">
            <CheckCircle className="text-green-500" size={48} />
          </div>
          <h1 className="text-3xl font-black italic tracking-tighter mb-4">Account Created!</h1>
          <p className="text-white/40 mb-8">
            Welcome to Himig! You can now log in with your username and password.
          </p>
          <Link 
            to="/login" 
            className="inline-flex items-center gap-2 text-white hover:text-white/80 transition-colors"
          >
            <ArrowLeft size={18} /> Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/5 blur-[120px] rounded-full"></div>

      <div className="max-w-md w-full z-10">
        <div className="mb-8">
          <Link 
            to="/login" 
            className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} /> Back to Login
          </Link>
        </div>

        <div className="text-center mb-10">
          <div className="inline-block p-4 bg-white/5 border border-white/10 rounded-2xl mb-6">
            <div className="w-12 h-12 bg-white flex items-center justify-center rounded-xl">
               <span className="text-black font-black text-3xl italic leading-none">H</span>
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tighter mb-2 italic">Join Himig</h1>
          <p className="text-white/40 text-xs tracking-[0.2em] uppercase font-bold">Create your ministry account</p>
        </div>

        <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          
          <h2 className="text-xl font-bold mb-8 text-center italic tracking-tight">Registration</h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-black ml-1">
                Full Name *
              </label>
              <div className="relative group/input">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-white transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="John Smith"
                  className="w-full bg-black border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-white/30 focus:bg-white/[0.02] outline-none transition-all placeholder:text-white/10"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-black ml-1">
                Username *
              </label>
              <div className="relative group/input">
                <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-white transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="johnsmith"
                  className="w-full bg-black border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-white/30 focus:bg-white/[0.02] outline-none transition-all placeholder:text-white/10"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value.toLowerCase().replace(/\s/g, '')})}
                  disabled={loading}
                  required
                />
              </div>
              <p className="text-[10px] text-white/20 ml-1">Used for login. No spaces.</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-black ml-1">
                Email * (Stored privately)
              </label>
              <div className="relative group/input">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-white transition-colors" size={18} />
                <input 
                  type="email" 
                  placeholder="name@ministry.com"
                  className="w-full bg-black border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-white/30 focus:bg-white/[0.02] outline-none transition-all placeholder:text-white/10"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  disabled={loading}
                  required
                />
              </div>
              <p className="text-[10px] text-green-400/60 ml-1">✓ Only stored in our database, not in authentication</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-black ml-1">
                Primary Instrument
              </label>
              <div className="relative group/input">
                <select 
                  className="w-full bg-black border border-white/10 rounded-2xl py-4 pl-4 pr-4 text-sm focus:border-white/30 focus:bg-white/[0.02] outline-none transition-all text-white/60"
                  value={formData.instrument}
                  onChange={(e) => setFormData({...formData, instrument: e.target.value})}
                  disabled={loading}
                >
                  <option value="">Select instrument...</option>
                  <option value="Vocals">Vocals</option>
                  <option value="Keys">Keys / Piano</option>
                  <option value="Guitar">Guitar</option>
                  <option value="Bass">Bass</option>
                  <option value="Drums">Drums</option>
                  <option value="Violin">Violin</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-black ml-1">
                Password *
              </label>
              <div className="relative group/input">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-white transition-colors" size={18} />
                <input 
                  type="password" 
                  placeholder="••••••••"
                  className="w-full bg-black border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-white/30 focus:bg-white/[0.02] outline-none transition-all placeholder:text-white/10"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  disabled={loading}
                  required
                  minLength={6}
                />
              </div>
              <p className="text-[10px] text-white/20 ml-1">Minimum 6 characters</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-black ml-1">
                Confirm Password *
              </label>
              <div className="relative group/input">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-white transition-colors" size={18} />
                <input 
                  type="password" 
                  placeholder="••••••••"
                  className="w-full bg-black border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-white/30 focus:bg-white/[0.02] outline-none transition-all placeholder:text-white/10"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  disabled={loading}
                  required
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
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-4 bg-white text-black rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-white/90 active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:cursor-not-allowed group/btn mt-6"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  Create Account
                  <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-[11px] text-white/30">
              Already have an account?{' '}
              <Link to="/login" className="text-white hover:text-white/80 transition-colors font-bold">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;