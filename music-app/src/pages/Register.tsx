import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Lock, 
  User, 
  Loader2, 
  ChevronRight, 
  ArrowLeft,
  CheckCircle,
  UserCircle,
  Music
} from 'lucide-react';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    instrument: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.username || !formData.password || !formData.confirmPassword) {
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
      await register({
        username: formData.username,
        password: formData.password,
        name: formData.name,
        email: formData.email,
        instrument: formData.instrument
      });

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
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-black ml-1">
                Full Name *
              </label>
              <div className="relative group/input">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-white transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="John Smith"
                  className="w-full bg-black border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-white/20 focus:border-white/30 focus:bg-white/[0.02] outline-none transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-black ml-1">
                Username *
              </label>
              <div className="relative group/input">
                <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-white transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="johnsmith"
                  className="w-full bg-black border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-white/20 focus:border-white/30 focus:bg-white/[0.02] outline-none transition-all"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value.toLowerCase().replace(/\s/g, '')})}
                  disabled={loading}
                  required
                />
              </div>
              <p className="text-[10px] text-white/30 ml-1">Used for login. No spaces.</p>
            </div>

            {/* Email (Optional) */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-black ml-1">
                Email <span className="text-white/20">(Optional)</span>
              </label>
              <div className="relative group/input">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-white transition-colors" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                </svg>
                <input 
                  type="email" 
                  placeholder="name@ministry.com"
                  className="w-full bg-black border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-white/20 focus:border-white/30 focus:bg-white/[0.02] outline-none transition-all"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  disabled={loading}
                />
              </div>
              <p className="text-[10px] text-white/30 ml-1">For notifications only.</p>
            </div>

            {/* Instrument - Custom Dropdown */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-black ml-1">
                Primary Instrument
              </label>
              <CustomSelect
                value={formData.instrument}
                onChange={(value) => setFormData({...formData, instrument: value})}
                options={[
                  { value: '', label: 'Select instrument...' },
                  { value: 'Drums', label: 'Drums' },
                  { value: 'Keys', label: 'Keys / Piano' },
                  { value: 'Synth', label: 'Synth' },
                  { value: 'Bass', label: 'Bass' },
                  { value: 'Rhythm Guitar', label: 'Rhythm Guitar' },
                  { value: 'Lead Guitar', label: 'Lead Guitar' },
                  { value: 'Other', label: 'Other' }
                ]}
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-black ml-1">
                Password *
              </label>
              <div className="relative group/input">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-white transition-colors" size={18} />
                <input 
                  type="password" 
                  placeholder="••••••••"
                  className="w-full bg-black border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-white/20 focus:border-white/30 focus:bg-white/[0.02] outline-none transition-all"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  disabled={loading}
                  required
                  minLength={6}
                />
              </div>
              <p className="text-[10px] text-white/30 ml-1">Minimum 6 characters</p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-black ml-1">
                Confirm Password *
              </label>
              <div className="relative group/input">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-white transition-colors" size={18} />
                <input 
                  type="password" 
                  placeholder="••••••••"
                  className="w-full bg-black border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-white/20 focus:border-white/30 focus:bg-white/[0.02] outline-none transition-all"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[11px] font-bold uppercase tracking-wider text-center">
                {error}
              </div>
            )}

            {/* Submit Button */}
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

// Custom Select Component
interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ value, onChange, options, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className="w-full bg-black border border-white/10 rounded-2xl py-4 pl-12 pr-10 text-sm text-left focus:border-white/30 focus:bg-white/[0.02] outline-none transition-all disabled:opacity-50"
        disabled={disabled}
      >
        <Music className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
        <span className={value ? 'text-white' : 'text-white/20'}>
          {options.find(opt => opt.value === value)?.label || options[0].label}
        </span>
        <svg 
          className={`absolute right-4 top-1/2 -translate-y-1/2 text-white/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          width="12" 
          height="12" 
          viewBox="0 0 12 12" 
          fill="none"
        >
          <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-2 bg-black border border-white/10 rounded-2xl overflow-hidden z-50 shadow-2xl">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 text-sm text-left transition-colors hover:bg-white/5 ${
                  value === option.value ? 'text-white bg-white/10' : 'text-white/60'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Register;