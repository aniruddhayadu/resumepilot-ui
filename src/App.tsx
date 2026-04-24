import React, { useEffect, useState } from 'react';
import Dashboard from './Dashboard';
import { getGoogleLoginUrl, login, register } from './services/authService';
import { extractEmailFromToken } from './utils/jwt';
import { getUserEmail, setAuthSession, storageKeys } from './utils/storage';
import { ArrowRight, FileText, Shield, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [hasToken, setHasToken] = useState<boolean>(false);
  const [isLoginView, setIsLoginView] = useState<boolean>(true); 

  // Form State Variables
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Check for token from OAuth2 redirect or local storage.
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    const userNameFromUrl = params.get('userName');
    const storedToken = localStorage.getItem(storageKeys.token);

    if (tokenFromUrl) {
      const emailFromToken = extractEmailFromToken(tokenFromUrl) || getUserEmail();
      setAuthSession(tokenFromUrl, emailFromToken, userNameFromUrl || undefined);

      window.history.replaceState({}, document.title, "/"); 
      setHasToken(true);
    } 
    else if (storedToken) {
      setHasToken(true);
    }
  }, []);

  const handleGoogleLogin = (): void => {
    window.location.href = getGoogleLoginUrl();
  };

  const handleManualAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const data = isLoginView
        ? await login({ email, password })
        : await register({ fullName, email, password, phone });

      setAuthSession(data.token, email, data.fullName);
      
      setHasToken(true);
      
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Failed to connect to the server (8081). Please ensure Auth Service is running.',
      );
    }
  };

  if (hasToken) {
    return <Dashboard />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 text-slate-900 md:px-6 md:py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(91,92,255,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(15,118,110,0.16),_transparent_24%),linear-gradient(180deg,_#fbf8f2_0%,_#f2eadf_100%)]" />
      <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-indigo-400/10 blur-3xl" />
      <div className="absolute -right-16 bottom-8 h-72 w-72 rounded-full bg-teal-400/10 blur-3xl" />

      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-slate-950/92 p-8 text-white shadow-[0_30px_100px_rgba(15,23,42,0.28)] backdrop-blur-xl md:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(91,92,255,0.24),_transparent_36%),radial-gradient(circle_at_bottom_left,_rgba(15,118,110,0.2),_transparent_32%)]" />
          <div className="relative flex h-full flex-col justify-between gap-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-medium text-white/80">
                <Sparkles className="h-4 w-4 text-teal-300" />
                Beautiful resumes, one polished workspace
              </div>

              <div className="space-y-4">
                <h1 className="max-w-md font-['Space_Grotesk'] text-4xl leading-[1.02] font-bold tracking-tight md:text-5xl">
                  ResumePilot AI turns your profile into a sharp, modern story.
                </h1>
                <p className="max-w-xl text-base leading-7 text-slate-300 md:text-lg">
                  Build, preview, and export resumes from one elegant workspace. The experience is tuned for speed, clarity, and a premium feel.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                  <FileText className="mb-3 h-5 w-5 text-indigo-300" />
                  <div className="text-sm font-semibold">Structured content</div>
                  <div className="mt-1 text-sm text-slate-300">Keep every section tidy and export-ready.</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                  <Shield className="mb-3 h-5 w-5 text-teal-300" />
                  <div className="text-sm font-semibold">Protected sessions</div>
                  <div className="mt-1 text-sm text-slate-300">Resume data stays tied to your account.</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                  <ArrowRight className="mb-3 h-5 w-5 text-amber-300" />
                  <div className="text-sm font-semibold">Fast workflow</div>
                  <div className="mt-1 text-sm text-slate-300">Create, edit, preview, and download quickly.</div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 border-t border-white/10 pt-6 text-sm text-slate-300 sm:grid-cols-2">
              <div>
                <div className="text-white/90 font-semibold">Google OAuth supported</div>
                <div className="mt-1">Use a single sign-in flow or your email/password login.</div>
              </div>
              <div>
                <div className="text-white/90 font-semibold">Instant dashboard access</div>
                <div className="mt-1">Once authenticated, you land directly in your workspace.</div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/78 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-2xl md:p-8">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-teal-500 to-amber-400" />
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">ResumePilot</p>
              <h2 className="mt-2 font-['Space_Grotesk'] text-3xl font-bold text-slate-950">
                {isLoginView ? 'Welcome back' : 'Create your account'}
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">
                {isLoginView ? 'Sign in to continue managing your resumes.' : 'Set up your workspace and start building in minutes.'}
              </p>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Secure
            </span>
          </div>

          {errorMsg && (
            <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleManualAuth} className="space-y-4 text-left">
            {!isLoginView && (
              <>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="10 digits"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
              </>
            )}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={isLoginView ? '••••••••' : 'Min 8 chars, 1 special'}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>

            <button
              type="submit"
              className="group mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3.5 font-semibold text-white shadow-[0_18px_40px_rgba(15,23,42,0.2)] transition hover:-translate-y-0.5 hover:bg-indigo-600"
            >
              {isLoginView ? 'Sign In' : 'Create Account'}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-slate-400">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-semibold uppercase tracking-[0.28em]">Or</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="mr-3 h-5 w-5" alt="Google" />
            Continue with Google
          </button>

          <p className="mt-6 text-center text-sm text-slate-600">
            {isLoginView ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => { setIsLoginView(!isLoginView); setErrorMsg(''); }}
              className="font-semibold text-indigo-600 transition hover:text-indigo-700"
            >
              {isLoginView ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </section>
      </div>
    </div>
  );
};

export default App;