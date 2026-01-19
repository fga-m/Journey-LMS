
import React, { useState } from 'react';

interface AuthFormProps {
  onLogin: (username: string) => boolean;
  onRegister: (name: string, username: string, email: string) => void;
  onBack: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onLogin, onRegister, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', username: '', email: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      if (isLogin) {
        const success = onLogin(formData.username);
        if (!success) {
          setError('User not found. Try "jsmith" or "aleee".');
          setLoading(false);
        }
      } else {
        if (!formData.name || !formData.username || !formData.email) {
          setError('Please fill in all fields.');
          setLoading(false);
          return;
        }
        onRegister(formData.name, formData.username, formData.email);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl shadow-blue-100 overflow-hidden border border-slate-100 p-12">
        <button onClick={onBack} className="mb-10 text-slate-400 hover:text-slate-900 transition-colors flex items-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          <span className="text-xs font-black uppercase tracking-widest">Back</span>
        </button>

        <div className="mb-10 text-center">
          <h2 className="text-4xl font-black tracking-tight text-slate-900 mb-2">
            {isLogin ? 'Welcome Back' : 'Start Your Journey'}
          </h2>
          <p className="text-slate-500 font-medium">
            {isLogin ? 'Log in to continue your ministry training.' : 'Create an account to join your ministry team.'}
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest animate-shake">
            {error}
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
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
          )}
          
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Username</label>
            <input 
              required
              type="text" 
              placeholder="e.g. jsmith" 
              className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm font-semibold"
              value={formData.username}
              onChange={e => setFormData({...formData, username: e.target.value})}
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
              <input 
                required
                type="email" 
                placeholder="john@example.com" 
                className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm font-semibold"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
          )}

          <button 
            disabled={loading}
            type="submit" 
            className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
            ) : (
              isLogin ? 'Log In' : 'Create Account'
            )}
          </button>
        </form>

        <div className="mt-10 pt-10 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-400 font-medium">
            {isLogin ? "Don't have an account yet?" : "Already have an account?"}
            <button 
              onClick={() => setIsLogin(!isLogin)}
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
