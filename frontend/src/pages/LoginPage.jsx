import { useEffect, useState } from 'react';
import { Lock, ShieldCheck, UserPlus } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import AlertBanner from '../components/common/AlertBanner.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const INPUT_CLASS =
  'w-full rounded-md border border-codenap-borderStrong bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-codenap-steel focus:ring-1 focus:ring-codenap-steel/30';

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, loading, needsSetup, loginUser, setupInitialAdminAccount } = useAuth();

  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (needsSetup) {
      setMode('setup');
    } else {
      setMode('login');
    }
  }, [needsSetup]);

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  const activeMode = needsSetup ? mode : 'login';

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (activeMode === 'setup') {
        await setupInitialAdminAccount({ name: name.trim(), email: email.trim(), password });
      } else {
        await loginUser({ email: email.trim(), password });
      }
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-codenap-canvas px-4 py-12">
      <div className="w-full max-w-md overflow-hidden rounded-lg border border-codenap-borderStrong bg-white shadow-flat">
        <div className="border-b-2 border-codenap-steel bg-codenap-navy px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-white/20 bg-white/10 text-xs font-bold tracking-wider">
              CN
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight">
                Codenap IT Services Private Limited
              </h1>
              <p className="text-xs text-slate-300">Internal Payroll &amp; Receipt Admin</p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-7">
          {needsSetup ? (
            <div className="mb-5 flex rounded-md border border-codenap-border bg-codenap-canvas p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setMode('setup');
                  setError('');
                }}
                className={`flex-1 rounded py-1.5 transition ${
                  activeMode === 'setup'
                    ? 'bg-codenap-navy text-white'
                    : 'text-slate-600 hover:text-codenap-navy'
                }`}
              >
                First-Time Dev Setup
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className={`flex-1 rounded py-1.5 transition ${
                  activeMode === 'login'
                    ? 'bg-codenap-navy text-white'
                    : 'text-slate-600 hover:text-codenap-navy'
                }`}
              >
                Sign In
              </button>
            </div>
          ) : null}

          <div className="mb-5">
            <h2 className="text-lg font-bold text-codenap-navy">
              {activeMode === 'setup' ? 'Create Initial Admin Account' : 'Admin Portal Sign In'}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              {activeMode === 'setup'
                ? 'No users exist in this dev database yet. Create the primary admin account to begin.'
                : 'Sign in with your authorized HR or Admin credentials.'}
            </p>
          </div>

          {error ? (
            <div className="mb-4">
              <AlertBanner type="error" message={error} onDismiss={() => setError('')} />
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            {activeMode === 'setup' ? (
              <div>
                <label htmlFor="setup-name" className="mb-1 block text-xs font-semibold text-slate-700">
                  Full Name
                </label>
                <input
                  id="setup-name"
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="HR Admin"
                  className={INPUT_CLASS}
                />
              </div>
            ) : null}

            <div>
              <label htmlFor="auth-email" className="mb-1 block text-xs font-semibold text-slate-700">
                Work Email
              </label>
              <input
                id="auth-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="info@codenap.co.in"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label htmlFor="auth-password" className="mb-1 block text-xs font-semibold text-slate-700">
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                required
                minLength={activeMode === 'setup' ? 8 : 1}
                maxLength={128}
                autoComplete={activeMode === 'setup' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={activeMode === 'setup' ? 'Minimum 8 characters' : 'Enter your password'}
                className={INPUT_CLASS}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-md bg-codenap-navy px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-codenap-steel focus:outline-none focus:ring-2 focus:ring-codenap-steel focus:ring-offset-1 disabled:opacity-60"
            >
              {activeMode === 'setup' ? (
                <UserPlus className="h-3.5 w-3.5" />
              ) : (
                <Lock className="h-3.5 w-3.5" />
              )}
              <span>
                {submitting
                  ? 'Please wait...'
                  : activeMode === 'setup'
                    ? 'Create Admin & Enter Portal'
                    : 'Sign In'}
              </span>
            </button>
          </form>

          <div className="mt-5 flex items-center gap-2 border-t border-codenap-border pt-4 text-[11px] text-slate-500">
            <ShieldCheck className="h-4 w-4 shrink-0 text-codenap-steel" />
            <span>Protected internal admin system for Codenap IT Services Private Limited.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
