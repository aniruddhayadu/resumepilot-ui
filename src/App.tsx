import React, { useEffect, useState } from 'react';
import Dashboard from './Dashboard'; 
import PublicAts from './pages/PublicAts'; 
import AdminDashboard from './pages/AdminDashboard'; 
import TemplateGallery from './components/TemplateGallery';
import { getGoogleLoginUrl, login, register, forgotPassword, verifyOtp } from './api'; 
import { extractEmailFromToken } from './utils/jwt';
import { getUserEmail, setAuthSession, storageKeys, clearSession } from './utils/storage';
import { ArrowRight, Sparkles, Target, LayoutTemplate, ShieldCheck } from 'lucide-react';

const App: React.FC = () => {
  const [hasToken, setHasToken] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string | null>(localStorage.getItem('userRole') || 'USER');
  const [currentView, setCurrentView] = useState<'login' | 'register' | 'forgot' | 'public-ats' | 'admin' | 'public-templates'>('login');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  
  const [otp, setOtp] = useState('');
  const [isOtpView, setIsOtpView] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState(''); 
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tkn = params.get('token');
    const uName = params.get('userName');
    const storedTkn = localStorage.getItem(storageKeys.token);
    const storedRole = localStorage.getItem('userRole');

    if (tkn) {
      const extEmail = extractEmailFromToken(tkn) || getUserEmail();
      setAuthSession(tkn, extEmail, uName || undefined);
      window.history.replaceState({}, document.title, "/"); 
      const role = extEmail === 'aniruddha9131@gmail.com' ? 'ADMIN' : 'USER';
      localStorage.setItem('userRole', role);
      setUserRole(role);
      setHasToken(true);
    } 
    else if (storedTkn) {
      setHasToken(true);
      const role = !storedRole || storedRole === 'FREE' ? 'USER' : storedRole;
      localStorage.setItem('userRole', role);
      setUserRole(role);
    }
  }, []);

  const handleGoogleLogin = (): void => { window.location.href = getGoogleLoginUrl(); };

  const handleManualAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(''); setSuccessMsg(''); setIsLoading(true);
    
    try {
      const cleanEmail = email.toLowerCase().trim();

      if (isOtpView) {
        await verifyOtp(cleanEmail, otp);
        
        setSuccessMsg("Verification Successful! You can now login.");
        setIsOtpView(false);
        setCurrentView('login');
        setOtp('');
      } 
      else if (currentView === 'login') {
        const data = await login({ email: cleanEmail, password });
        if (!data.token) {
          throw new Error('Authentication failed. No token returned by server.');
        }
        setAuthSession(data.token, cleanEmail, data.fullName);
        const role = cleanEmail === 'aniruddha9131@gmail.com' ? 'ADMIN' : (data.role || 'USER');
        localStorage.setItem('userRole', role); 
        setUserRole(role); 
        setHasToken(true);
      } 
      else if (currentView === 'register') {
        await register({ fullName, email: cleanEmail, password, phone });
        setSuccessMsg("OTP sent to your email. Please verify to continue.");
        setIsOtpView(true);
      }
      else if (currentView === 'forgot') {
        const resText = await forgotPassword(cleanEmail);
        setSuccessMsg(resText);
        setEmail('');
      }
    } catch (err: any) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    localStorage.removeItem('userRole');
    setHasToken(false);
    setCurrentView('login');
    setIsOtpView(false);
  };

  if (hasToken) {
    if (userRole === 'ADMIN') {
      return (
        <AdminDashboard 
          adminEmail={getUserEmail() || 'admin@resumepilot.com'}
          onLogout={handleLogout} 
          onSwitchToUser={() => {
            localStorage.setItem('userRole', 'USER');
            setUserRole('USER');
          }} 
        />
      );
    }
    return <Dashboard />;
  }

  if (currentView === 'public-ats') {
    return (
      <div className="relative min-h-screen bg-gray-50 transition-all duration-500">
        <button onClick={() => setCurrentView('login')} className="absolute top-6 left-6 flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-800 transition-colors z-50">
          &larr; Back to Login
        </button>
        <PublicAts />
      </div>
    );
  }

  if (currentView === 'public-templates') {
    return (
      <div className="relative min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-12 lg:py-10 transition-all duration-500">
        <button onClick={() => setCurrentView('login')} className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-indigo-600 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md sm:absolute sm:left-6 sm:top-6 sm:mb-0 z-50 active:scale-95">
          &larr; Back to Login
        </button>
        <div className="mx-auto max-w-6xl pt-2 sm:pt-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="mb-8 text-center sm:mb-10">
            <h1 className="font-['Space_Grotesk'] text-3xl font-extrabold text-slate-900 sm:text-4xl md:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">Professional Resume Templates</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 sm:text-base md:text-lg">ATS-friendly designs engineered to get you hired.</p>
          </div>
          <TemplateGallery selectedId={0} onSelect={() => {}} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 text-slate-900 md:px-6 md:py-10 bg-slate-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(91,92,255,0.12),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(15,118,110,0.1),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#f1f5f9_100%)]" />
      
      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
        
        <section className="relative flex h-full flex-col justify-between overflow-hidden rounded-[2rem] border border-slate-800/80 bg-slate-950 p-6 text-white shadow-2xl sm:p-8 md:p-10 transition-all duration-700 hover:shadow-indigo-500/10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,0.15),_transparent_50%),radial-gradient(ellipse_at_bottom_left,_rgba(20,184,166,0.15),_transparent_50%)]" />
          <div className="relative space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 backdrop-blur-md">
              <Sparkles className="h-4 w-4 text-indigo-400" /> Beautiful resumes, one polished workspace
            </div>
            <div className="space-y-5">
              <h1 className="max-w-md font-['Space_Grotesk'] text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl md:text-5xl bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-400">
                ResumePilot AI turns your profile into a sharp, modern story.
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-slate-400">
                Build, preview, and export resumes from one elegant workspace. The experience is tuned for speed, clarity, and a premium feel.
              </p>
            </div>
          </div>
          
          <div className="relative mt-8 flex flex-col gap-4 border-t border-white/10 pt-8 sm:flex-row">
            <button onClick={() => setCurrentView('public-ats')} className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-3.5 font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] hover:shadow-indigo-500/40 active:scale-95">
              <Target className="w-5 h-5 transition-transform group-hover:rotate-12" /> Free ATS Scanner
            </button>
            <button onClick={() => setCurrentView('public-templates')} className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 px-6 py-3.5 font-bold text-white border border-white/10 backdrop-blur-sm shadow-lg transition-all hover:bg-white/10 hover:scale-[1.02] active:scale-95">
              <LayoutTemplate className="w-5 h-5 text-slate-300 transition-transform group-hover:-rotate-12" /> Browse Templates
            </button>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-2xl shadow-slate-200/50 backdrop-blur-2xl sm:p-8 md:p-10 transition-all duration-500">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-teal-400 opacity-90" />
          
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-500">ResumePilot</p>
            <h2 className="mt-2 font-['Space_Grotesk'] text-2xl font-extrabold text-slate-900 sm:text-3xl">
              {isOtpView ? 'Verify Your Email' : (currentView === 'login' ? 'Welcome back' : currentView === 'register' ? 'Create an account' : 'Reset Password')}
            </h2>
          </div>

          {errorMsg && <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm font-medium text-rose-700 shadow-sm animate-in fade-in slide-in-from-top-2">{errorMsg}</div>}
          {successMsg && <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm animate-in fade-in slide-in-from-top-2">{successMsg}</div>}

          <form onSubmit={handleManualAuth} className="space-y-5 animate-in fade-in duration-700">
            {isOtpView ? (
              <div className="space-y-5 animate-in slide-in-from-bottom-4">
                <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/50 flex items-start gap-3">
                    <ShieldCheck className="text-indigo-500 h-5 w-5 mt-0.5 shrink-0" />
                    <p className="text-sm text-indigo-900 leading-relaxed">We've sent a 6-digit secure code to <span className="font-bold">{email}</span>. Enter it below to verify.</p>
                </div>
                <div>
                  <input type="text" required maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} placeholder="000000" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-4 text-center text-3xl font-mono font-bold tracking-[0.5em] text-slate-900 shadow-sm outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15" />
                </div>
                <button type="submit" disabled={isLoading} className="w-full bg-slate-900 py-4 rounded-xl text-white font-bold shadow-lg transition-all hover:bg-indigo-600 hover:shadow-indigo-500/25 active:scale-95 disabled:opacity-70">
                    {isLoading ? 'Verifying...' : 'Verify & Activate Account'}
                </button>
                <button type="button" onClick={() => setIsOtpView(false)} className="w-full text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900">Change email address</button>
              </div>
            ) : (
              <>
                {currentView === 'register' && (
                  <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                    <div><label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Full Name</label><input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-3 text-slate-900 shadow-sm outline-none transition-all focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10" /></div>
                    <div><label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Phone</label><input type="text" required value={phone} onChange={e => setPhone(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-3 text-slate-900 shadow-sm outline-none transition-all focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10" /></div>
                  </div>
                )}
                <div><label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</label><input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-3 text-slate-900 shadow-sm outline-none transition-all focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10" /></div>
                {currentView !== 'forgot' && (
                  <div><label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Password</label><input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-3 text-slate-900 shadow-sm outline-none transition-all focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10" /></div>
                )}
                {currentView === 'login' && (
                  <div className="text-right mt-2"><button type="button" onClick={() => setCurrentView('forgot')} className="text-sm font-bold text-indigo-600 transition-colors hover:text-indigo-800">Forgot Password?</button></div>
                )}
                <button type="submit" disabled={isLoading} className="group mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-4 font-bold text-white shadow-lg transition-all hover:bg-indigo-600 hover:shadow-indigo-500/25 active:scale-95 disabled:opacity-70">
                  {isLoading ? 'Processing...' : (currentView === 'login' ? 'Sign In to Workspace' : currentView === 'register' ? 'Create Account' : 'Send Reset Link')}
                  {!isLoading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
                </button>
              </>
            )}
          </form>

          {!isOtpView && currentView !== 'forgot' && (
            <>
              <div className="my-7 flex items-center gap-4 text-slate-300"><div className="h-[1px] flex-1 bg-slate-200" /><span className="text-xs font-bold uppercase tracking-wider">OR</span><div className="h-[1px] flex-1 bg-slate-200" /></div>
              <button onClick={handleGoogleLogin} className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3.5 font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md active:scale-95">
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="mr-3 h-5 w-5" alt="Google" /> Continue with Google
              </button>
            </>
          )}

          {!isOtpView && (
            <p className="mt-8 text-center text-sm font-medium text-slate-600">
              {currentView === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button type="button" onClick={() => { setCurrentView(currentView === 'login' ? 'register' : 'login'); setErrorMsg(''); setSuccessMsg(''); }} className="font-bold text-indigo-600 transition-colors hover:text-indigo-800 hover:underline underline-offset-2">
                {currentView === 'login' ? 'Sign Up' : 'Log In'}
              </button>
            </p>
          )}
        </section>
      </div>
    </div>
  );
};

export default App;
