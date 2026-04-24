import React, { useState, useEffect } from 'react';
import ResumeBuilder from './components/ResumeBuilder'; // Path check kar lena
import { requestResumePdf } from './services/exportService';
import { deleteResume, fetchUserResumes } from './services/resumeService';
import type { Resume } from './types/resume';
import { clearSession, getToken, getUserEmail, getUserName } from './utils/storage';
import { ArrowLeft, Download, LayoutGrid, LogOut, Plus, Settings, Sparkles, Trash2, FileText, PencilLine } from 'lucide-react';

const Dashboard: React.FC = () => {
  const userName = getUserName();
  const userEmail = getUserEmail();
  const initial = userName?.charAt(0).toUpperCase() || 'U';
  
  const [currentView, setCurrentView] = useState<'dashboard' | 'create' | 'preview' | 'edit'>('dashboard');
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [notice, setNotice] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  useEffect(() => {
    if (currentView === 'dashboard') {
      fetchResumes();
    }
  }, [currentView]);

  const fetchResumes = async () => {
    setIsLoading(true);
    setError('');
    setNotice('');

    try {
      const formattedResumes = await fetchUserResumes(userEmail, userName);
      setResumes(formattedResumes);
    } catch {
      setError('Unable to connect. Please ensure Resume Service (8082) is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this resume? This cannot be undone.")) return;
    try {
      await deleteResume(id, userEmail);
      setResumes((prev) => prev.filter((resume) => resume.id !== id));
      setNotice('Resume deleted successfully.');
    } catch (err: any) {
      setNotice(`Unable to delete resume. ${err.message || 'Please ensure Resume Service (8082) is running.'}`);
    }
  };

  const handleLogout = () => {
    clearSession();
    window.location.reload();
  };

  const handlePreview = (resume: Resume) => {
    setSelectedResume(resume);
    setCurrentView('preview');
  };

  const handleEdit = (resume: Resume) => {
    setSelectedResume(resume);
    setCurrentView('edit');
  };

  const handleDownloadPDF = async () => {
    if (!selectedResume) return;
    setNotice('Generating your PDF. Please wait a moment.');
    setIsExporting(true);

    try {
      const fileUrl = await requestResumePdf(selectedResume.id, {
        userEmail,
        token: getToken() || undefined,
      });
      if (fileUrl) {
        window.open(fileUrl, '_blank');
        setNotice('PDF opened in a new tab.');
      } else {
        setNotice('PDF is still processing. Check back in a minute.');
      }
    } catch (err) {
      setNotice(
        err instanceof Error
          ? err.message
          : 'Unable to connect. Please ensure Export Service (8083) is running.',
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-900 print:bg-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(91,92,255,0.14),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(15,118,110,0.12),_transparent_24%),linear-gradient(180deg,_#fbf8f2_0%,_#f1eadf_100%)]" />
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-72 flex-col border-r border-white/60 bg-slate-950/90 px-6 py-6 text-white shadow-[0_18px_60px_rgba(15,23,42,0.22)] backdrop-blur-xl lg:flex print:hidden">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-teal-500 text-sm font-bold shadow-lg shadow-indigo-500/20">
              RP
            </div>
            <div>
              <h1 className="font-['Space_Grotesk'] text-xl font-bold tracking-tight">ResumePilot</h1>
              <p className="text-sm text-slate-300">Your polished resume workspace</p>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <Sparkles className="h-4 w-4 text-teal-300" />
            <p className="text-sm text-slate-200">Build strong resumes with a clean, focused flow.</p>
          </div>
        </div>

        <nav className="mt-6 space-y-2">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${currentView === 'dashboard' ? 'bg-white text-slate-950 shadow-lg shadow-black/10' : 'text-slate-300 hover:bg-white/8 hover:text-white'}`}
          >
            <LayoutGrid className="h-4 w-4" />
            My Resumes
          </button>
          <button
            onClick={() => { setSelectedResume(null); setCurrentView('create'); }}
            className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${currentView === 'create' ? 'bg-white text-slate-950 shadow-lg shadow-black/10' : 'text-slate-300 hover:bg-white/8 hover:text-white'}`}
          >
            <Plus className="h-4 w-4" />
            Create New
          </button>
        </nav>

        <div className="mt-auto space-y-3">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            <div className="flex items-center gap-3 text-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 font-semibold">{initial}</div>
              <div>
                <div className="font-semibold">{userName}</div>
                <div className="text-slate-400">{userEmail}</div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-slate-400">
              <Settings className="h-4 w-4" />
              Secure workspace session
            </div>
          </div>
          <button onClick={handleLogout} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-rose-500/15 hover:text-rose-200">
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex min-h-screen flex-col lg:pl-72 print:h-auto print:overflow-visible print:pl-0">
        <header className="flex h-auto flex-col justify-between gap-4 border-b border-white/60 bg-white/70 px-5 py-5 backdrop-blur-xl sm:px-8 lg:h-24 lg:flex-row lg:items-center print:hidden">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Workspace</div>
            <div className="mt-2 text-sm text-slate-500">
              Overview / <span className="font-semibold text-slate-950 capitalize">{currentView === 'dashboard' ? 'My Resumes' : currentView.replace('-', ' ')}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 self-start rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm lg:self-auto">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-teal-500 font-bold text-white shadow-md shadow-indigo-500/20">
              {initial}
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-950">{userName}</div>
              <div className="text-xs text-slate-500">{userEmail}</div>
            </div>
          </div>
        </header>

        <div className="flex-1 px-5 py-6 sm:px-8 sm:py-8 print:p-0 print:overflow-visible">
          {notice && (
            <div className="mb-6 rounded-3xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm backdrop-blur-xl">
              {notice}
            </div>
          )}

          {(currentView === 'create' || currentView === 'edit') && (
            <ResumeBuilder existingResume={currentView === 'edit' ? selectedResume : null} onSuccessReturn={() => setCurrentView('dashboard')} />
          )}
          
          {currentView === 'preview' && selectedResume && (
             <div className="mx-auto max-w-5xl rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl print:max-w-full print:border-none print:bg-white print:p-0 print:shadow-none">
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
                <button onClick={() => setCurrentView('dashboard')} className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-700">
                  <ArrowLeft className="h-4 w-4" />
                  Back to My Resumes
                </button>
                <div className="flex gap-3">
                  <button onClick={() => handleEdit(selectedResume)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                    <PencilLine className="h-4 w-4" />
                    Edit Info
                  </button>
                  <button onClick={handleDownloadPDF} disabled={isExporting} className={`inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/20 transition ${isExporting ? 'cursor-not-allowed bg-slate-400' : 'bg-slate-950 hover:-translate-y-0.5 hover:bg-emerald-600'}`}>
                    <Download className="h-4 w-4" />
                    {isExporting ? 'Generating...' : 'Download PDF'}
                  </button>
                </div>
              </div>
              <div className="print:text-black">
                <div className="mb-8 flex flex-col gap-3 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Resume Preview</p>
                    <h1 className="mt-2 font-['Space_Grotesk'] text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">{selectedResume.fullName || userName}</h1>
                    <h2 className="mt-3 text-xl text-slate-600">{selectedResume.title}</h2>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <div className="font-semibold text-slate-900">Ready for export</div>
                    <div className="mt-1">Clean formatting, printable layout.</div>
                  </div>
                </div>

                <div className="space-y-8">
                  <section>
                    <h3 className="mb-3 border-b border-slate-200 pb-2 text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Professional Summary</h3>
                    <p className="whitespace-pre-wrap leading-8 text-slate-700">{selectedResume.summary || 'Not provided'}</p>
                  </section>
                  <section>
                    <h3 className="mb-3 border-b border-slate-200 pb-2 text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Technical Skills</h3>
                    <p className="whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-4 leading-8 text-slate-700 print:border-none print:bg-white print:p-0">{selectedResume.skills || 'Not provided'}</p>
                  </section>
                  <section>
                    <h3 className="mb-3 border-b border-slate-200 pb-2 text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Experience</h3>
                    <p className="whitespace-pre-wrap leading-8 text-slate-700">{selectedResume.experience || 'Not provided'}</p>
                  </section>
                  <section>
                    <h3 className="mb-3 border-b border-slate-200 pb-2 text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Education</h3>
                    <p className="whitespace-pre-wrap leading-8 text-slate-700">{selectedResume.education || 'Not provided'}</p>
                  </section>
                </div>
              </div>
            </div>
          )}

          {currentView === 'dashboard' && (
            <>
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 shadow-sm backdrop-blur-xl">
                    <FileText className="h-3.5 w-3.5" />
                    Resume Library
                  </div>
                  <h2 className="mt-4 font-['Space_Grotesk'] text-4xl font-bold tracking-tight text-slate-950">Your documents</h2>
                  <p className="mt-2 max-w-2xl text-base text-slate-600">Manage, refine, and open your saved resumes from a cleaner workspace.</p>
                </div>
                <button onClick={() => { setSelectedResume(null); setCurrentView('create'); }} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white shadow-lg shadow-slate-950/20 transition hover:-translate-y-0.5 hover:bg-indigo-600">
                  <Plus className="h-4 w-4" />
                  New Resume
                </button>
              </div>

              {isLoading ? (
                <div className="rounded-3xl border border-white/70 bg-white/80 py-14 text-center font-medium text-slate-500 shadow-sm backdrop-blur-xl">Loading your resumes...</div>
              ) : error ? (
                <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-rose-700 shadow-sm">{error}</div>
              ) : resumes.length === 0 ? (
                <div className="rounded-[2rem] border border-white/70 bg-white/85 p-10 text-center shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <FileText className="h-7 w-7" />
                  </div>
                  <h3 className="mt-5 text-2xl font-bold text-slate-900">No resumes found</h3>
                  <p className="mt-2 mb-7 text-slate-500">You haven't created any resumes yet.</p>
                  <button onClick={() => { setSelectedResume(null); setCurrentView('create'); }} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-indigo-600">
                    <Plus className="h-4 w-4" />
                    Start building
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {resumes.map((resume) => (
                    <div key={resume.id} className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/85 p-6 shadow-[0_16px_50px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl">
                      <button onClick={() => handleDelete(resume.id)} className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600" title="Delete Resume">
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <div className="flex-1">
                        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-teal-500 text-white shadow-lg shadow-indigo-500/20">
                          <FileText className="h-5 w-5" />
                        </div>
                        <h3 className="pr-8 text-xl font-bold text-slate-950">{resume.title}</h3>
                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">{resume.summary || 'No summary provided.'}</p>
                      </div>
                      <div className="mt-6 flex gap-3 border-t border-slate-100 pt-4">
                        <button onClick={() => handleEdit(resume)} className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                          Edit
                        </button>
                        <button onClick={() => handlePreview(resume)} className="flex-1 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-600">
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;