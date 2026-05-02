import React, { useState, useEffect } from 'react';
// 🚀 1. Trash2 Icon import kar liya
import { LayoutDashboard, Users, LogOut, Monitor, FileText, Target, Activity, Trash2 } from 'lucide-react';

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
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8081/api/admin/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
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
      const token = localStorage.getItem('token');
      fetch('http://localhost:8081/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
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
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` } // 🚀 Token bhejna zaroori hai
      });

      if (response.ok) {
        // UI se user ko turant hatao
        setUsersList(usersList.filter(user => (user.userId || user.id) !== userId));
        
        // Stats update kar do
        setStats(prev => ({ ...prev, totalUsers: prev.totalUsers > 0 ? prev.totalUsers - 1 : 0 }));
        
        alert("User successfully udd gaya! 🚀");
      } else {
        alert("Delete nahi ho paya, backend me kuch gadbad hai.");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Network error aa gaya bhai.");
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f4f7f6] font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-[#0f172a] text-white flex flex-col justify-between shrink-0 shadow-xl border-r border-slate-800">
        <div>
          <div className="p-8">
            <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Admin Portal</span>
            <h1 className="text-3xl font-bold mt-4 leading-tight text-white">ResumePilot <span className="text-indigo-400">Control</span></h1>
            <p className="text-slate-400 mt-2 text-sm break-all">{adminEmail}</p>
          </div>
          <nav className="px-6 space-y-3 mt-4">
            <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
              <LayoutDashboard className="w-5 h-5" /> Overview
            </button>
            <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl font-medium transition-colors ${activeTab === 'users' ? 'bg-indigo-600 text-white' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
              <Users className="w-5 h-5" /> User Directory
            </button>
          </nav>
        </div>
        <div className="p-6 space-y-3">
          <button onClick={onSwitchToUser} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold py-3.5 rounded-xl flex justify-center items-center gap-2"><Monitor className="w-4 h-4" /> Go to Workspace</button>
          <button onClick={onLogout} className="w-full bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white font-bold py-3.5 rounded-xl flex justify-center items-center gap-2"><LogOut className="w-4 h-4" /> Secure Logout</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-10 overflow-y-auto">
        {activeTab === 'dashboard' ? (
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 rounded-[2rem] p-10 text-white shadow-lg relative overflow-hidden">
              <Activity className="absolute right-0 top-0 opacity-10 w-64 h-64 -mt-10 -mr-10 pointer-events-none" />
              <p className="text-indigo-300 text-sm font-bold uppercase tracking-widest mb-2">Live Telemetry</p>
              <h2 className="text-3xl font-extrabold leading-tight max-w-2xl relative z-10">Monitor platform usage in real-time.</h2>
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
             <h2 className="text-3xl font-bold text-slate-800 mb-6">User Directory</h2>
             <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {loadingUsers ? (
                  <div className="p-12 text-center text-slate-500"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div><p>Loading database...</p></div>
                ) : usersList.length === 0 ? (
                  <div className="p-12 text-center text-slate-500"><Users className="w-16 h-16 mx-auto mb-4 text-slate-300" /><h3 className="text-lg font-bold">No Users Found</h3></div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider border-b">
                          <th className="px-6 py-4">ID</th>
                          <th className="px-6 py-4">Full Name</th>
                          <th className="px-6 py-4">Email</th>
                          <th className="px-6 py-4">Role</th>
                          {/* 🚀 4. Action column add kiya */}
                          <th className="px-6 py-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {usersList.map((user, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-medium text-slate-500">#{idx + 1}</td>
                            <td className="px-6 py-4 font-bold text-slate-800">{user.fullName || user.name || 'N/A'}</td>
                            <td className="px-6 py-4 text-slate-600">{user.email}</td>
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
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between min-h-[160px]">
    <div className="flex justify-between items-start mb-4"><div className="p-3 bg-slate-50 rounded-xl">{icon}</div><span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">{trend}</span></div>
    <div><p className="text-4xl font-black text-slate-800 mb-1">{value}</p><h3 className="text-slate-500 font-medium text-sm">{title}</h3></div>
  </div>
);

export default AdminDashboard;