import React, { useCallback, useEffect, useState } from 'react';
import { Activity, FileText, LayoutDashboard, LogOut, Monitor, Target, Trash2, Users } from 'lucide-react';
import api from '../api/api';

interface AdminDashboardProps {
  onLogout: () => void;
  onSwitchToUser: () => void;
  adminEmail?: string;
}

interface AdminStats {
  totalUsers: number;
  resumesBuilt: number;
  atsScansDone: number;
  activeUsers: number;
}

interface AdminUser {
  userId?: number;
  id?: number;
  fullName?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  subscriptionPlan?: string;
  active?: boolean;
  verified?: boolean;
  createdAt?: string;
}

const emptyStats: AdminStats = {
  totalUsers: 0,
  resumesBuilt: 0,
  atsScansDone: 0,
  activeUsers: 0,
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  const err = error as any;
  return err?.response?.data?.message || err?.response?.data?.error || err?.response?.data || err?.message || fallback;
};

const getUserId = (user: AdminUser): number | undefined => user.userId || user.id;

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onLogout,
  onSwitchToUser,
  adminEmail = 'admin@resumepilot.com',
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users'>('dashboard');
  const [stats, setStats] = useState<AdminStats>(emptyStats);
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [statsError, setStatsError] = useState('');
  const [usersError, setUsersError] = useState('');
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

  const fetchAdminStats = useCallback(async () => {
    try {
      setStatsError('');
      const response = await api.get<AdminStats>('/api/admin/stats');
      setStats({ ...emptyStats, ...response.data });
    } catch (error) {
      setStatsError(getErrorMessage(error, 'Could not load admin stats.'));
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      setUsersError('');
      const response = await api.get<AdminUser[]>('/api/admin/users');
      setUsersList(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setUsersList([]);
      setUsersError(getErrorMessage(error, 'Could not load users. Please check admin access.'));
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminStats();
    const interval = window.setInterval(fetchAdminStats, 10000);
    return () => window.clearInterval(interval);
  }, [fetchAdminStats]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab, fetchUsers]);

  const handleDeleteUser = async (user: AdminUser) => {
    const userId = getUserId(user);
    if (!userId) {
      window.alert('User ID is missing, so this user cannot be deleted.');
      return;
    }

    const name = user.fullName || user.name || user.email || `user #${userId}`;
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;

    setDeletingUserId(userId);
    try {
      await api.delete(`/api/admin/users/${userId}`);
      setUsersList((currentUsers) => currentUsers.filter((item) => getUserId(item) !== userId));
      await fetchAdminStats();
    } catch (error) {
      window.alert(getErrorMessage(error, 'Failed to delete user.'));
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-100 lg:flex-row">
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

      <main className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.16),_transparent_34%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] p-4 sm:p-6 lg:p-10">
        {activeTab === 'dashboard' ? (
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 p-6 text-white shadow-lg sm:p-8 lg:p-10">
              <Activity className="pointer-events-none absolute right-0 top-0 -mr-10 -mt-10 h-44 w-44 opacity-10 sm:h-56 sm:w-56 lg:h-64 lg:w-64" />
              <p className="text-indigo-300 text-sm font-bold uppercase tracking-widest mb-2">Live Telemetry</p>
              <h2 className="relative z-10 max-w-2xl text-2xl font-extrabold leading-tight sm:text-3xl">Monitor platform usage in real-time.</h2>
              {statsError && <p className="relative z-10 mt-4 rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{statsError}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard icon={<Users className="w-6 h-6 text-blue-500" />} title="Registered Users" value={loadingStats ? '...' : stats.totalUsers} trend="Live from DB" />
              <StatCard icon={<FileText className="w-6 h-6 text-emerald-500" />} title="Resumes Built" value={loadingStats ? '...' : stats.resumesBuilt} trend="Total count" />
              <StatCard icon={<Target className="w-6 h-6 text-purple-500" />} title="ATS Scans" value={loadingStats ? '...' : stats.atsScansDone} trend="High activity" />
              <StatCard icon={<Activity className="w-6 h-6 text-orange-500" />} title="Active Sessions" value={loadingStats ? '...' : stats.activeUsers} trend="Live now" />
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">User Directory</h2>
              <button onClick={fetchUsers} disabled={loadingUsers} className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-slate-100 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60">
                {loadingUsers ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/75 shadow-2xl shadow-black/25">
              {usersError && <div className="border-b border-rose-400/20 bg-rose-500/10 px-6 py-4 text-sm font-medium text-rose-100">{usersError}</div>}
              {loadingUsers ? (
                <div className="p-12 text-center text-slate-400"><div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-400"></div><p>Loading database...</p></div>
              ) : usersList.length === 0 ? (
                <div className="p-12 text-center text-slate-400"><Users className="mx-auto mb-4 h-16 w-16 text-slate-600" /><h3 className="text-lg font-bold">No Users Found</h3></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wider text-slate-400">
                        <th className="px-5 py-4">#</th>
                        <th className="px-5 py-4">Full Name</th>
                        <th className="px-5 py-4">Email</th>
                        <th className="px-5 py-4">Phone</th>
                        <th className="px-5 py-4">Role</th>
                        <th className="px-5 py-4">Plan</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {usersList.map((user, index) => {
                        const userId = getUserId(user);
                        const role = (user.role || 'USER').toUpperCase();
                        return (
                          <tr key={userId || user.email} className="hover:bg-white/[0.03]">
                            {/* Serial Number logic used here */}
                            <td className="px-5 py-4 font-medium text-slate-500">#{index + 1}</td>
                            <td className="px-5 py-4 font-bold text-slate-100">{user.fullName || user.name || 'N/A'}</td>
                            <td className="px-5 py-4 text-slate-300">{user.email || 'N/A'}</td>
                            <td className="px-5 py-4 text-slate-300">{user.phone || 'N/A'}</td>
                            <td className="px-5 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                {role}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-slate-300">{user.subscriptionPlan || 'FREE'}</td>
                            <td className="px-5 py-4">
                              <div className="flex flex-wrap gap-2">
                                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${user.active === false ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>{user.active === false ? 'Inactive' : 'Active'}</span>
                                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${user.verified ? 'bg-cyan-100 text-cyan-700' : 'bg-amber-100 text-amber-700'}`}>{user.verified ? 'Verified' : 'Pending'}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-center">
                              <button
                                onClick={() => handleDeleteUser(user)}
                                disabled={deletingUserId === userId}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600 transition-colors hover:bg-rose-100 hover:text-rose-800 disabled:cursor-not-allowed disabled:opacity-50"
                                title="Delete User"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
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