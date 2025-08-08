
import React, { useState } from 'react';

interface AuthFormProps {
  onAuth: (username: string, password: string) => Promise<void>;
  authError: string | null;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onAuth, authError }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setIsLoading(true);
    await onAuth(username, password);
    setIsLoading(false);
  };

  return (
    <div className="w-full max-w-sm mx-auto bg-dark-card rounded-xl shadow-2xl p-8">
      <h2 className="text-3xl font-bold text-center text-light-text mb-2">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
      <p className="text-center text-medium-text mb-8">{isLogin ? 'Sign in to continue' : 'Join to start calling'}</p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="username" className="text-sm font-medium text-medium-text">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="mt-1 block w-full px-4 py-3 bg-dark-input border border-gray-600 rounded-lg text-light-text focus:ring-brand-secondary focus:border-brand-secondary"
            placeholder="your_username"
          />
        </div>
        <div>
          <label htmlFor="password"className="text-sm font-medium text-medium-text">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full px-4 py-3 bg-dark-input border border-gray-600 rounded-lg text-light-text focus:ring-brand-secondary focus:border-brand-secondary"
            placeholder="••••••••"
          />
        </div>
        {authError && <p className="text-sm text-red-400">{authError}</p>}
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-bg focus:ring-brand-secondary disabled:bg-gray-500"
          >
            {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </div>
      </form>
      
      <p className="mt-8 text-center text-sm text-medium-text">
        {isLogin ? "Don't have an account?" : 'Already have an account?'}
        <button onClick={() => setIsLogin(!isLogin)} className="font-medium text-brand-secondary hover:underline ml-2">
          {isLogin ? 'Sign up' : 'Sign in'}
        </button>
      </p>
    </div>
  );
};
