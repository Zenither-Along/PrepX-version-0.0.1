import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { LogoFull, EyeIcon, EyeOffIcon } from './icons';

const AuthView: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();

  useEffect(() => {
    setUsernameError(null);
    setPasswordError(null);
    setApiError(null);
    setUsername('');
    setPassword('');
  }, [isLoginView]);

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (!isLoginView) {
      if (value.length > 0 && value.length < 3) {
        setUsernameError('Username must be at least 3 characters long.');
      } else {
        setUsernameError(null);
      }
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (!isLoginView) {
      if (value.length > 0 && value.length < 6) {
        setPasswordError('Password must be at least 6 characters long.');
      } else {
        setPasswordError(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!isLoginView) {
      handleUsernameChange(username);
      handlePasswordChange(password);
      if (username.length < 3 || password.length < 6) {
        return; 
      }
    }
    
    setIsLoading(true);
    
    const { success, message } = isLoginView 
        ? await login(username, password)
        : await register(username, password);
        
    if (!success) {
      setApiError(message);
    }
    
    setIsLoading(false);
  };

  const isRegisterDisabled = isLoading || !!usernameError || !!passwordError || !username || !password;

  return (
    <div className="flex items-center justify-center min-h-screen bg-brand-secondary p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
            <LogoFull className="mx-auto" />
            <p className="text-gray-600 mt-2">Your Personal Learning Architect</p>
        </div>
        <div className="bg-brand-primary p-8 rounded-lg shadow-md border border-brand-accent">
          <h2 className="text-2xl font-bold text-center text-brand-text mb-6">
            {isLoginView ? 'Sign In' : 'Create Account'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gray-800 focus:border-gray-800 sm:text-sm bg-brand-primary text-brand-text"
                aria-invalid={!!usernameError}
                aria-describedby="username-error"
              />
              {!isLoginView && usernameError && <p id="username-error" className="text-xs text-red-600 mt-1">{usernameError}</p>}
            </div>
            <div>
              <label htmlFor="password"className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  type={isPasswordVisible ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  required
                  className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gray-800 focus:border-gray-800 sm:text-sm bg-brand-primary text-brand-text"
                  aria-invalid={!!passwordError}
                  aria-describedby="password-error"
                />
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
                  aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                >
                  {isPasswordVisible ? (
                    <EyeOffIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {!isLoginView && passwordError && <p id="password-error" className="text-xs text-red-600 mt-1">{passwordError}</p>}
            </div>
            
            {apiError && <p className="text-sm text-red-600 text-center">{apiError}</p>}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoginView ? (isLoading || !username || !password) : isRegisterDisabled}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-brand-primary bg-brand-text hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800 disabled:bg-gray-400"
              >
                {isLoading ? 'Processing...' : (isLoginView ? 'Sign In' : 'Register')}
              </button>
            </div>
          </form>
          <p className="mt-6 text-center text-sm text-gray-600">
            {isLoginView ? "Don't have an account?" : 'Already have an account?'}
            <button onClick={() => setIsLoginView(!isLoginView)} className="font-medium text-gray-800 hover:text-gray-600 ml-1">
              {isLoginView ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthView;