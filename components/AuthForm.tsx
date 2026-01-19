
import React, { useState } from 'react';
import { supabase } from '../supabase.ts';

interface AuthFormProps {
  onBack: () => void;
  initialMode?: 'login' | 'register';
}

const AuthForm: React.FC<AuthFormProps> = ({ onBack, initialMode = 'login' }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: 'volunteer' // Default role
            }
          }
        });
        if (signUpError) throw signUpError;
        setSuccess('Account created! Please check your email (and spam folder) for a confirmation link to activate your profile.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl shadow-blue-100 border border-slate-100 p-12">
        <button onClick={onBack} className="mb-10 text-slate-400 hover:text-slate-900 transition-colors flex items-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          <span className="text-xs font-black uppercase tracking-widest">Back</span>
        </button>

        <div className="mb-10 text-center">
          <h2 className="text-4xl font-black tracking-tight text-slate-900 mb-2">
            {isLogin ? 'Welcome Back' : 'Join the Journey'}
          </h2>
          <p className="text-slate-500 font-medium">
            {isLogin ? 'Secure access to your volunteer profile.' : 'Create an account to begin your training.'}
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-8 p-6 bg-green-50 border border-green-100 text-green-700 rounded-[2rem] text-sm font-medium leading-relaxed">
            <div className="flex items-center space-x-3 mb-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="font-black uppercase tracking-widest text-[10px]">Success</span>
            </div>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
              <input 
                required
                type="text" 
                placeholder="John Doe" 
                className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm font-semibold"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
            </div>
          )}
          
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
            <input 
              required
              type="email" 
              placeholder="name@email.com" 
              className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm font-semibold"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
            <input 
              required
              type="password" 
              placeholder="••••••••" 
              className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm font-semibold"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button 
            disabled={loading}
            type="submit" 
            className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              isLogin ? 'Log In' : 'Create Account'
            )}
          </button>
        </form>

        <div className="mt-10 pt-10 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-400 font-medium">
            {isLogin ? "Don't have an account yet?" : "Already have an account?"}
            <button 
              onClick={() => { setIsLogin(!isLogin); setSuccess(''); setError(''); }}
              className="ml-2 text-blue-600 font-bold hover:underline"
            >
              {isLogin ? 'Register Now' : 'Log In Here'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
