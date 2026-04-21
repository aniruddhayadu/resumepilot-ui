import React, { useEffect, useState } from 'react';
import Dashboard from './Dashboard';

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
    // Check for token from OAuth2 redirect or local storage
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    const userNameFromUrl = params.get('userName');
    const storedToken = localStorage.getItem('token');

    if (tokenFromUrl) {
      localStorage.setItem('token', tokenFromUrl);
      if (userNameFromUrl) localStorage.setItem('userName', userNameFromUrl);

      // Extract Email from JWT Token so backend doesn't block you
      try {
        const base64Url = tokenFromUrl.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payload = JSON.parse(jsonPayload);
        
        if (payload.sub) {
            localStorage.setItem('userEmail', payload.sub); // Subject is email
        }
      } catch (e) {
        console.error("Token decoding failed", e);
      }

      window.history.replaceState({}, document.title, "/"); 
      setHasToken(true);
    } 
    else if (storedToken) {
      setHasToken(true);
    }
  }, []);

  const handleGoogleLogin = (): void => {
    // SEEDHA AUTH SERVICE (8081) KO CALL - No Gateway interference
    window.location.href = 'http://localhost:8081/oauth2/authorization/google';
  };

  const handleManualAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const endpoint = isLoginView ? '/auth/login' : '/auth/register';
    const payload = isLoginView 
      ? { email, password } 
      : { fullName, email, password, phone };

    try {
      // SEEDHA AUTH SERVICE (8081) KO CALL - No CORS issue from Gateway
      const response = await fetch(`http://localhost:8081${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.message || 'Authentication failed. Please try again.');
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('userEmail', email); 
      
      if (data.fullName) {
        localStorage.setItem('userName', data.fullName);
      }
      
      setHasToken(true);
      
    } catch (err) {
      setErrorMsg('Failed to connect to the server (8081). Please ensure Auth Service is running.');
    }
  };

  if (hasToken) {
    return <Dashboard />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col justify-center items-center text-white font-sans px-4">
      <div className="text-center max-w-md w-full p-8 bg-gray-800 rounded-3xl shadow-2xl border border-gray-700">
        <h1 className="text-3xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
          ResumePilot AI
        </h1>
        <p className="text-gray-400 text-sm mb-6">
          {isLoginView ? 'Welcome back to your dashboard.' : 'Create your account to get started.'}
        </p>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 text-sm p-3 rounded-lg mb-4 text-left">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleManualAuth} className="space-y-4 text-left">
          {!isLoginView && (
            <>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Full Name</label>
                <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Phone Number</label>
                <input type="text" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="10 digits"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs text-gray-400 mb-1">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder={isLoginView ? "••••••••" : "Min 8 char, 1 Special"}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>

          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg mt-4">
            {isLoginView ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-700"></div>
          <span className="px-3 text-gray-500 text-sm">OR</span>
          <div className="flex-grow border-t border-gray-700"></div>
        </div>

        <button onClick={handleGoogleLogin} className="flex items-center justify-center w-full bg-white text-gray-900 font-bold py-3 px-6 rounded-xl transition-all hover:scale-105">
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5 mr-3" alt="Google" />
          Continue with Google
        </button>

        <p className="text-gray-400 text-sm mt-6">
          {isLoginView ? "Don't have an account? " : "Already have an account? "}
          <button type="button" onClick={() => { setIsLoginView(!isLoginView); setErrorMsg(''); }} className="text-indigo-400 font-semibold hover:underline">
            {isLoginView ? 'Sign Up' : 'Log In'}
          </button>
        </p>

      </div>
    </div>
  );
};

export default App;