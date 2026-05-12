import React, { useState, useEffect } from 'react';
// 🚀 1. Trash2 Icon import kar liya
import { LayoutDashboard, Users, LogOut, Monitor, FileText, Target, Activity, Trash2 } from 'lucide-react';
import api from '../api/api';

interface AdminDashboardProps {
  onLogout: () => void;
  onSwitchToUser: () => void;
  adminEmail?: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  onLogout, 
  onSwitchToUser, 
  adminEmail = "admin@resumepilot.com" 
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users'>('dashboard');
  
  const [stats, setStats] = useState({ totalUsers: 0, resumesBuilt: 0, atsScansDone: 0, activeUsers: 0 });
  const [usersList, setUsersList] = useState<any[]>([]);
  
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // 1️⃣ Fetch Stats Data (Port 8081)
  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const response = await api.get('/api/admin/stats');
        setStats(response.data);
      } catch {
        console.log("Stats fetch failed");
      } finally {
        setLoadingStats(false);
      }
    };
    fetchAdminStats();
    const interval = setInterval(fetchAdminStats, 10000);
    return () => clearInterval(interval);
  }, []);

  // 2️⃣ Fetch Users Data (Port 8081)
  useEffect(() => {
    if (activeTab === 'users') {
      setLoadingUsers(true);
      api.get('/api/admin/users')
      .then(({ data }) => {
        if (Array.isArray(data)) setUsersList(data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingUsers(false));
    }
  }, [activeTab]);

  // 🚀 3. USER KO DELETE KARNE WALA FUNCTION
  const handleDeleteUser = async (userId: number) => {
    if (!userId) {
      alert("User ID nahi mil rahi bhai!");
      return;
    }

    const isConfirmed = window.confirm("Bhai, sach me is user ko udana chahte ho?");
    if (!isConfirmed) return;

    try {
      await api.delete(`/api/admin/users/${userId}`);
        // UI se user ko turant hatao
        setUsersList(usersList.filter(user => (user.userId || user.id) !== userId));
        
        // Stats update kar do
        setStats(prev => ({ ...prev, totalUsers: prev.totalUsers > 0 ? prev.totalUsers - 1 : 0 }));
        
        alert("User successfully udd gaya! 🚀");
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Network error aa gaya bhai.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-100 lg:flex-row">
      
      {/* SIDEBAR */}
      <aside className="flex shrink-0 flex-col justify-between border-r border-slate-800 bg-[#0f172a] text-white shadow-xl lg:w-72">
        <div>
          <div className="p-5 sm:p-8">
            <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Admin Portal</span>
            <h1 className="mt-4 text-2xl font-bold leading-tight text-white sm:text-3xl">ResumePilot <span className="text-indigo-400">Control</span></h1>
            <p className="text-slate-400 mt-2 text-sm break-all">{adminEmail}</p>
          </div>
          <nav className="mt-2 flex gap-3 overflow-x-auto px-4 pb-4 sm:px-6 lg:block lg:space-y-3 lg:overflow-visible lg:pb-0">
            <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
              <LayoutDashboard className="w-5 h-5" /> Overview
            </button>
            <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl font-medium transition-colors ${activeTab === 'users' ? 'bg-indigo-600 text-white' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
              <Users className="w-5 h-5" /> User Directory
            </button>
          </nav>
        </div>
        <div className="space-y-3 p-4 sm:p-6">
          <button onClick={onSwitchToUser} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold py-3.5 rounded-xl flex justify-center items-center gap-2"><Monitor className="w-4 h-4" /> Go to Workspace</button>
          <button onClick={onLogout} className="w-full bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white font-bold py-3.5 rounded-xl flex justify-center items-center gap-2"><LogOut className="w-4 h-4" /> Secure Logout</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.16),_transparent_34%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] p-4 sm:p-6 lg:p-10">
        {activeTab === 'dashboard' ? (
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 p-6 text-white shadow-lg sm:p-8 lg:p-10">
              <Activity className="pointer-events-none absolute right-0 top-0 -mr-10 -mt-10 h-44 w-44 opacity-10 sm:h-56 sm:w-56 lg:h-64 lg:w-64" />
              <p className="text-indigo-300 text-sm font-bold uppercase tracking-widest mb-2">Live Telemetry</p>
              <h2 className="relative z-10 max-w-2xl text-2xl font-extrabold leading-tight sm:text-3xl">Monitor platform usage in real-time.</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard icon={<Users className="w-6 h-6 text-blue-500" />} title="Registered Users" value={loadingStats ? "..." : stats.totalUsers} trend="Live from DB" />
              <StatCard icon={<FileText className="w-6 h-6 text-emerald-500" />} title="Resumes Built" value={loadingStats ? "..." : stats.resumesBuilt} trend="Total count" />
              <StatCard icon={<Target className="w-6 h-6 text-purple-500" />} title="ATS Scans" value={loadingStats ? "..." : stats.atsScansDone} trend="High activity" />
              <StatCard icon={<Activity className="w-6 h-6 text-orange-500" />} title="Active Sessions" value={loadingStats ? "..." : stats.activeUsers} trend="Live now" />
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
             <h2 className="mb-4 text-2xl font-bold text-white sm:mb-6 sm:text-3xl">User Directory</h2>
             <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/75 shadow-2xl shadow-black/25">
                {loadingUsers ? (
                  <div className="p-12 text-center text-slate-400"><div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-400"></div><p>Loading database...</p></div>
                ) : usersList.length === 0 ? (
                  <div className="p-12 text-center text-slate-400"><Users className="mx-auto mb-4 h-16 w-16 text-slate-600" /><h3 className="text-lg font-bold">No Users Found</h3></div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wider text-slate-400 sm:text-sm">
                          <th className="px-6 py-4">ID</th>
                          <th className="px-6 py-4">Full Name</th>
                          <th className="px-6 py-4">Email</th>
                          <th className="px-6 py-4">Role</th>
                          {/* 🚀 4. Action column add kiya */}
                          <th className="px-6 py-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {usersList.map((user, idx) => (
                          <tr key={idx} className="hover:bg-white/[0.03]">
                            <td className="px-6 py-4 font-medium text-slate-500">#{idx + 1}</td>
                            <td className="px-6 py-4 font-bold text-slate-100">{user.fullName || user.name || 'N/A'}</td>
                            <td className="px-6 py-4 text-slate-300">{user.email}</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                {user.role || 'USER'}
                              </span>
                            </td>
                            {/* 🚀 5. Delete Button Row me add kiya */}
                            <td className="px-6 py-4 text-center">
                              <button 
                                onClick={() => handleDeleteUser(user.userId || user.id)}
                                className="text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 p-2 rounded-lg transition-colors"
                                title="Delete User"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

const StatCard = ({ icon, title, value, trend }: any) => (
  <div className="flex min-h-[160px] flex-col justify-between rounded-2xl border border-white/10 bg-slate-900/75 p-6 shadow-xl shadow-black/20">
    <div className="mb-4 flex items-start justify-between"><div className="rounded-xl bg-white/5 p-3">{icon}</div><span className="rounded-full bg-white/5 px-2 py-1 text-xs font-bold text-slate-400">{trend}</span></div>
    <div><p className="mb-1 text-4xl font-black text-white">{value}</p><h3 className="text-sm font-medium text-slate-400">{title}</h3></div>
  </div>
);

export default AdminDashboard;
