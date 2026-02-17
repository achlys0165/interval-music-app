import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Mail, 
  Lock, 
  User, 
  Loader2, 
  ChevronRight, 
  ArrowLeft,
  CheckCircle
} from 'lucide-react';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    instrument: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.email || !formData.password) {
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

    setLoading(true);
    setError(null);

    try {
      // 1. Sign up with Supabase Auth
      console.log('Creating auth user...'); // Debug
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
          }
        }
      });

      console.log('Auth response:', authData, authError); // Debug

      if (authError) throw authError;

      if (authData.user) {
        console.log('User created:', authData.user.id); // Debug
        
        // 2. Update profile with additional info
        if (formData.instrument) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ instrument: formData.instrument })
            .eq('id', authData.user.id);

          if (profileError) {
            console.error('Error saving instrument:', profileError);
          }
        }

        setSuccess(true);
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        throw new Error('User creation failed - no user returned');
      }
    } catch (err: any) {
      console.error('Registration error:', err); // Debug
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
            Welcome to Himig! Your account has been created successfully. 
            Redirecting to login...
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
};

export default Register;