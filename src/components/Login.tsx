import React, { useState } from 'react';
import { KeyRound, Mail, User as UserIcon, ShieldAlert, LogIn, UserPlus } from 'lucide-react';

interface LoginProps {
  isAgentPortal: boolean;
  onLoginSuccess: (user: any, token: string) => void;
  navigate: (to: string) => void;
  showToast: (msg: string) => void;
  isDarkMode?: boolean;
}

export default function Login({ isAgentPortal, onLoginSuccess, navigate, showToast, isDarkMode = false }: LoginProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [passcode, setPasscode] = useState('');
  const [role, setRole] = useState<'USER' | 'AGENT' | 'ADMIN'>(isAgentPortal ? 'AGENT' : 'USER');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister 
      ? { name, email, password, role: isAgentPortal ? role : 'USER', passcode }
      : { email, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      let data: any = {};
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const rawText = await response.text();
        try {
          data = JSON.parse(rawText);
        } catch {
          data = { error: `Server error (${response.status}). Please try again.` };
        }
      }

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed. Please check your credentials.');
      }

      onLoginSuccess(data.user, data.token);
      showToast(`Welcome back, ${data.user.name}!`);

      if (data.user.role === 'USER') {
        navigate('/user/dashboard');
      } else {
        navigate('/agent/dashboard');
      }

    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`max-w-md w-full mx-auto rounded-3xl border shadow-2xl p-8 space-y-6 transition-colors ${
      'bg-white/95 border-slate-200 text-slate-900 shadow-slate-200/50 dark:bg-slate-900/95 dark:border-slate-800 dark:text-slate-100 dark:shadow-slate-950/50'
    }`}>
      {/* Title Header */}
      <div className="text-center space-y-2">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg mb-2 text-white">
          <KeyRound className="h-6 w-6 text-white" />
        </div>
        <h2 className={`text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100`}>
          {isAgentPortal ? 'Operations Staff Portal' : 'Customer Support Portal'}
        </h2>
        <p className={`text-sm font-semibold tracking-wide text-slate-500 dark:text-slate-400`}>
          {isRegister ? 'Create Your Account' : 'Sign in to access your workspace'}
        </p>
      </div>

      {/* Error message card */}
      {errorMessage && (
        <div className="p-3.5 bg-rose-500/10 text-rose-400 text-sm font-semibold rounded-xl border border-rose-500/20 flex items-start gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Auth form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegister && (
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-600 dark:text-slate-300`}>
              Full Name
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jane Doe"
                className={`w-full text-sm rounded-xl border pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 font-semibold transition-all ${
                  'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500'
                }`}
              />
            </div>
          </div>
        )}

        <div>
          <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-600 dark:text-slate-300`}>
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. user@example.com"
              className={`w-full text-sm rounded-xl border pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 font-semibold transition-all ${
                'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500'
              }`}
            />
          </div>
        </div>

        <div>
          <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-600 dark:text-slate-300`}>
            Password
          </label>
          <div className="relative">
            <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full text-sm rounded-xl border pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 font-semibold transition-all ${
                'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500'
              }`}
            />
          </div>
        </div>

        {isAgentPortal && isRegister && (
          <div className={`space-y-4 pt-1 p-3.5 rounded-2xl border ${
            'bg-indigo-50/50 border-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-800/50'
          }`}>
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-600 dark:text-slate-300`}>
                Staff Role Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('AGENT')}
                  className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                    role === 'AGENT'
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
                  }`}
                >
                  Operations Agent
                </button>
                <button
                  type="button"
                  onClick={() => setRole('ADMIN')}
                  className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                    role === 'ADMIN'
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
                  }`}
                >
                  Administrator
                </button>
              </div>
            </div>

            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-600 dark:text-slate-300`}>
                Authorization Passcode
              </label>
              <input
                type="text"
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder={role === 'ADMIN' ? "adminpass123 or agentpass123" : "agentpass123 or adminpass123"}
                className={`w-full text-sm rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 font-bold transition-all ${
                  'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500'
                }`}
              />
              <p className={`text-xs font-medium mt-1.5 text-slate-500 dark:text-slate-400`}>
                Passcode: <code className="bg-indigo-500/20 px-1.5 py-0.5 rounded text-indigo-400 font-bold">{role === 'ADMIN' ? 'adminpass123' : 'agentpass123'}</code>
              </p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center space-x-2 cursor-pointer shadow-md disabled:opacity-50 mt-2"
        >
          {isLoading ? (
            <span>Authenticating...</span>
          ) : isRegister ? (
            <>
              <UserPlus className="h-4 w-4" />
              <span>Register Account</span>
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4" />
              <span>Sign In</span>
            </>
          )}
        </button>
      </form>

      {/* Account switch options */}
      <div className="flex flex-col items-center gap-2 pt-2 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setIsRegister(!isRegister)}
          className={`hover:underline cursor-pointer text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400`}
        >
          {isRegister ? 'Already have an account? Sign In' : 'Need an account? Register Here'}
        </button>

        <span className={'text-slate-300 dark:text-slate-700'}>•</span>

        <button
          type="button"
          onClick={() => {
            if (isAgentPortal) {
              navigate('/');
            } else {
              navigate('/agent/login');
            }
          }}
          className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline cursor-pointer"
        >
          {isAgentPortal ? '← Access Customer Support Portal' : 'Access Agent Operations Console →'}
        </button>
      </div>
    </div>
  );
}

