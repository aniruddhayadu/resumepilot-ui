import React, { useState, useEffect, useCallback } from 'react';
import ResumeBuilder from './components/ResumeBuilder'; 
import TemplateGallery from './components/TemplateGallery'; 
import { requestResumePdf } from './services/exportService';
import { deleteResume, fetchUserResumes } from './services/resumeService';
import { checkAtsScore, extractTextFromPdf } from './services/aiService'; 
import type { Resume } from './services/resumeService';
import { clearSession, getUserEmail, getUserName } from './utils/storage';
import { Activity, CheckCircle2, Target, UploadCloud, Edit3, Sparkles, Trash2, FileText, LayoutTemplate } from 'lucide-react'; 
import ResumeWorkspace from './pages/ResumeWorkspace'; 
import JobMatchDashboard from './pages/JobMatchDashboard';
import { TemplateManager } from './components/TemplateEngine';

const Dashboard: React.FC = () => {
  const uName = getUserName();
  const uEmail = getUserEmail();
  
  const [selTpl, setSelTpl] = useState<number>(1);
  const [curView, setCurView] = useState<'dashboard' | 'create' | 'preview' | 'edit' | 'ats-tool' | 'workspace' | 'templates' | 'job-match'>('dashboard');
  const [selRes, setSelRes] = useState<Resume | null>(null);
  
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string>('');

  const [atsData, setAtsData] = useState<{score: number, feedback: string} | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const [extJob, setExtJob] = useState('');
  const [selFile, setSelFile] = useState<File | null>(null);
  const [extAts, setExtAts] = useState<{score: number, feedback: string} | null>(null);
  const [extAnalyzing, setExtAnalyzing] = useState(false);
  const [dragging, setDragging] = useState(false);

  const previewTemplateId = selRes?.templateId ?? selTpl;
  const previewIsTwoColumn = [2, 3, 5, 6].includes(previewTemplateId);

  const getPreviewPalette = (templateId: number) => {
    switch (templateId) {
      case 2:
        return { shell: 'border-indigo-100 bg-white/80', header: 'border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-cyan-50', badge: 'bg-indigo-600 text-white', accent: 'text-indigo-700', section: 'border-indigo-100 bg-white', subtitle: 'text-indigo-700' };
      case 3:
        return { shell: 'border-slate-200 bg-slate-950/95 text-slate-100', header: 'border-slate-800 bg-slate-900', badge: 'bg-blue-500 text-white', accent: 'text-blue-300', section: 'border-slate-800 bg-slate-900', subtitle: 'text-blue-200' };
      case 4:
        return { shell: 'border-slate-100 bg-white', header: 'border-slate-100 bg-slate-50', badge: 'bg-emerald-600 text-white', accent: 'text-emerald-700', section: 'border-slate-100 bg-white', subtitle: 'text-slate-700' };
      case 5:
        return { shell: 'border-sky-100 bg-white/80', header: 'border-sky-100 bg-gradient-to-r from-sky-50 via-white to-indigo-50', badge: 'bg-sky-600 text-white', accent: 'text-sky-700', section: 'border-sky-100 bg-white', subtitle: 'text-sky-700' };
      case 6:
        return { shell: 'border-teal-100 bg-white/80', header: 'border-teal-100 bg-gradient-to-r from-teal-50 via-white to-emerald-50', badge: 'bg-teal-600 text-white', accent: 'text-teal-700', section: 'border-teal-100 bg-white', subtitle: 'text-teal-700' };
      case 7:
        return { shell: 'border-purple-100 bg-white', header: 'border-purple-100 bg-purple-50', badge: 'bg-purple-600 text-white', accent: 'text-purple-700', section: 'border-purple-100 bg-white', subtitle: 'text-purple-700' };
      case 8:
        return { shell: 'border-amber-100 bg-white', header: 'border-amber-100 bg-amber-50', badge: 'bg-amber-600 text-white', accent: 'text-amber-700', section: 'border-amber-100 bg-white', subtitle: 'text-amber-700' };
      default:
        return { shell: 'border-slate-100 bg-white', header: 'border-slate-100 bg-white', badge: 'bg-slate-900 text-white', accent: 'text-slate-700', section: 'border-slate-100 bg-white', subtitle: 'text-slate-600' };
    }
  };

  const loadResumes = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const data = await fetchUserResumes(uEmail, uName);
      setResumes(data);
    } catch {
      setErr('Connection failed.');
    } finally {
      setLoading(false);
    }
  }, [uEmail, uName]);

  useEffect(() => {
    if (curView === 'dashboard') loadResumes();
  }, [curView, loadResumes]);

  const handleDel = async (id: number) => {
    if (!window.confirm("Delete this resume?")) return;
    try {
      await deleteResume(id, uEmail);
      setResumes((prev) => prev.filter((r) => r.id !== id));
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleLogout = () => {
    clearSession();
    window.location.reload();
  };

  const handlePreview = (r: Resume) => {
    setSelRes(r);
    setSelTpl(r.templateId || 1);
    setAtsData(null); 
    setCurView('preview');
  };

  const handleEdit = (r: Resume) => {
    setSelRes(r);
    setSelTpl(r.templateId || 1);
    setCurView('workspace');
  };

  const handlePdf = async () => {
    if (!selRes) return;
    alert("Generating PDF...");
    try {
      const url = await requestResumePdf(selRes.id, selRes.templateId || selTpl, { userEmail: uEmail });
      if (url) window.open(url, '_blank');
    } catch (e: any) {
      alert(e.message || 'Export failed.');
    }
  };

  const handleAts = async () => {
    if (!selRes) return;
    setAnalyzing(true);
    setAtsData(null);
    
    // Naya Parse logic ATS ke liye taaki array wala data match ho jaye
    let parsedContent: any = {};
    try { if (selRes.content) parsedContent = JSON.parse(selRes.content); } catch {
      parsedContent = {};
    }
    
    const expText = parsedContent.experiences?.map((e:any) => `${e.company} ${e.role} ${e.desc}`).join(' ') || '';
    const eduText = parsedContent.educations?.map((e:any) => `${e.inst} ${e.degree}`).join(' ') || '';
    
    const text = `${parsedContent.objective || selRes.summary} ${parsedContent.skills || selRes.skills} ${expText} ${eduText}`;

    try {
      const res = await checkAtsScore(selRes.title || 'Professional', text);
      setAtsData(res);
    } catch (error) {
      alert(error instanceof Error ? error.message : "ATS failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExtAts = async () => {
    if (!extJob.trim() || !selFile) return alert("Missing inputs");
    setExtAnalyzing(true);
    setExtAts(null);
    try {
      const text = await extractTextFromPdf(selFile);
      const res = await checkAtsScore(extJob, text);
      setExtAts(res);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Analysis failed.");
    } finally {
      setExtAnalyzing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files;
    if (f?.[0]?.type === 'application/pdf') setSelFile(f[0]);
  };

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-slate-950 font-sans text-slate-100 print:bg-white lg:flex-row">
      <aside className="z-50 flex w-full shrink-0 flex-col border-r border-white/10 bg-slate-950 text-white shadow-2xl shadow-black/40 print:hidden lg:w-64">
        <div className="flex h-16 items-center border-b border-white/10 bg-white/[0.03] px-5 sm:h-20 sm:px-8">
          <h1 className="text-xl font-bold tracking-wide bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent sm:text-2xl">ResumePilot</h1>
        </div>
        <nav className="flex flex-1 gap-2 overflow-x-auto px-3 py-3 sm:px-4 sm:py-4 lg:block lg:space-y-2 lg:overflow-y-auto lg:overflow-x-visible scroll-smooth">
          <button onClick={() => setCurView('dashboard')} className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-300 ${curView === 'dashboard' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 transform scale-105' : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'}`}>
            My Resumes
          </button>
          <button onClick={() => setCurView('templates')} className={`w-full flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 ${curView === 'templates' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 transform scale-105' : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'}`}>
            <LayoutTemplate className="w-4 h-4" /> Template Gallery
          </button>
          <button onClick={() => { setSelRes(null); setCurView('workspace'); }} className={`w-full flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 ${curView === 'workspace' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 transform scale-105' : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'}`}>
            <Edit3 className="w-4 h-4" /> Live Builder <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded ml-auto font-bold">NEW</span>
          </button>
          <button onClick={() => { setSelRes(null); setCurView('create'); }} className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-300 ${curView === 'create' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 transform scale-105' : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'}`}>
            Create Basic
          </button>
          <div className="my-4 border-t border-gray-800 pt-4" />
          <button onClick={() => setCurView('ats-tool')} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 ${curView === 'ats-tool' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30 transform scale-105' : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'}`}>
            <span className="flex items-center gap-2"><Target className="w-4 h-4" /> ATS Analyzer</span>
            <span className="bg-pink-500/40 text-pink-200 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">AI</span>
          </button>
          <button onClick={() => setCurView('job-match')} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 ${curView === 'job-match' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/30 transform scale-105' : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'}`}>
            <span className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> Job Match</span>
            <span className="bg-emerald-500/40 text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">NEW</span>
          </button>
        </nav>
        <div className="p-4 border-t border-slate-700">
          <button onClick={handleLogout} className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-all duration-300 border border-red-500/20">
            Sign Out
          </button>
        </div>
      </aside>

      <main className="relative flex min-h-0 flex-1 flex-col bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.16),_transparent_34%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] print:h-auto print:bg-white lg:h-screen">
        {curView !== 'workspace' && (
          <header className="z-10 flex h-auto flex-col gap-3 border-b border-white/10 bg-slate-950/70 px-4 py-4 shadow-sm backdrop-blur-xl transition-all duration-300 print:hidden sm:h-20 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
            <div className="text-sm font-medium text-slate-400 sm:text-base">
              Overview / <span className="font-bold capitalize text-white">{curView.replace('-', ' ')}</span>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-500/30 border-2 border-white/50">
                {uName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-semibold text-slate-100 sm:text-base">{uName}</span>
            </div>
          </header>
        )}

        <div className={`flex-1 min-h-0 ${curView === 'workspace' ? 'overflow-hidden' : 'px-4 py-6 sm:px-6 lg:p-10 overflow-y-auto print:p-0'}`}>
          
          {curView === 'templates' && (
            <div className="mx-auto max-w-6xl animate-fadeIn rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-6 lg:p-8">
              <div className="mb-6 sm:mb-8">
                <h2 className="flex items-center gap-3 text-2xl font-extrabold text-white sm:text-3xl">
                  <LayoutTemplate className="w-8 h-8 text-indigo-300" /> Template Gallery
                </h2>
                <p className="mt-2 text-sm text-slate-400 sm:text-base lg:text-lg">Choose a professional design and jump straight into the Live Builder.</p>
              </div>
              <TemplateGallery 
                  selectedId={selTpl} 
                  onSelect={(id) => {
                      setSelTpl(id);
                      setSelRes(null);
                      setCurView('workspace');
                  }} 
              />
            </div>
          )}

          {curView === 'workspace' && (
            <div className="w-full h-full">
               <ResumeWorkspace 
                 existingData={selRes} 
                 templateId={selTpl} 
                 onBack={() => {
                     setCurView('dashboard');
                     setSelRes(null);
                 }} 
               />
            </div>
          )}

          {curView === 'job-match' && (
            <div className="w-full h-full">
              <JobMatchDashboard resumeId={selRes?.id || 1} userId={1} />
            </div>
          )}

          {(curView === 'create' || curView === 'edit') && (
            <ResumeBuilder existingResume={curView === 'edit' ? selRes : null} onSuccessReturn={() => setCurView('dashboard')} />
          )}

          {/* 🚀 MEGAG FIX: Preview Page Design using parsed arrays */}
          {curView === 'preview' && selRes && (() => {
            let details: any = {};
            try {
              if (selRes.content) details = JSON.parse(selRes.content);
            } catch {
              details = {};
            }

            const palette = getPreviewPalette(previewTemplateId);

            return (
              <div className={`mx-auto ${previewIsTwoColumn ? 'max-w-6xl' : 'max-w-4xl'} rounded-2xl border p-5 shadow-lg print:max-w-full print:border-none print:p-0 print:shadow-none sm:p-6 lg:p-10 ${palette.shell}`}>
                <div className={`mb-6 flex flex-col gap-3 border-b pb-6 print:hidden lg:flex-row lg:items-center lg:justify-between ${palette.header}`}>
                  <button onClick={() => setCurView('dashboard')} className={`font-semibold hover:underline flex items-center ${palette.accent}`}>
                    &larr; Back to My Resumes
                  </button>
                  <div className="flex flex-wrap items-center gap-3">
                    <button onClick={() => handleEdit(selRes)} className="rounded-lg bg-gray-100 px-4 py-2 font-bold text-gray-800 transition-colors hover:bg-gray-200 sm:px-6 flex items-center gap-2">
                      <Edit3 className="w-4 h-4"/> Edit Resume
                    </button>
                    <button onClick={handleAts} disabled={analyzing} className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 font-bold text-white shadow-md transition-colors hover:bg-purple-700 disabled:opacity-70 sm:px-6">
                      <Activity className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
                      {analyzing ? 'Analyzing...' : 'Check ATS Score'}
                    </button>
                    <button onClick={handlePdf} className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 font-bold text-white shadow-md transition-colors hover:bg-green-700 sm:px-6">
                      Download PDF
                    </button>
                  </div>
                </div>

                <div className={`mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest ${palette.badge}`}>
                  Template {previewTemplateId}
                </div>

                {atsData && (
                  <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl flex flex-col md:flex-row gap-6 items-center print:hidden">
                    <div className="relative w-24 h-24 shrink-0 flex items-center justify-center rounded-full bg-white shadow-sm border-[6px] border-purple-200">
                      <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                        <circle cx="42" cy="42" r="38" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-purple-100" />
                        <circle cx="42" cy="42" r="38" stroke="currentColor" strokeWidth="6" fill="transparent" 
                          strokeDasharray={238} strokeDashoffset={238 - (238 * atsData.score) / 100} 
                          className={`transition-all duration-1000 ${atsData.score > 75 ? 'text-emerald-500' : atsData.score > 50 ? 'text-amber-500' : 'text-rose-500'}`} />
                      </svg>
                      <span className="text-2xl font-black text-slate-800">{atsData.score}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-purple-600" /> ATS AI Analysis Complete
                      </h3>
                      <p className="mt-2 text-slate-600 text-sm leading-relaxed">{atsData.feedback}</p>
                    </div>
                  </div>
                )}

                <div className="mt-8 flex justify-center print:mt-0">
                  <TemplateManager
                    data={details}
                    templateId={previewTemplateId}
                    userPlan={localStorage.getItem('userRole') === 'ADMIN' ? 'ADMIN' : 'FREE'}
                  />
                </div>

                <div className="hidden">
                {previewIsTwoColumn ? (
                  <div className="print:text-black mt-8 text-slate-900">
                    <div className="mb-8 border-b border-slate-200 pb-6">
                      <h1 className="text-4xl sm:text-5xl font-extrabold mb-2">{details.fullName || selRes.fullName || uName}</h1>
                      <h2 className={`text-xl sm:text-2xl ${palette.subtitle}`}>{details.title || selRes.title}</h2>
                    </div>
                    <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
                      <div className="space-y-8">
                        <section>
                          <h3 className="text-lg font-bold text-gray-800 mb-3 uppercase tracking-wider border-b-[1.5px] border-gray-300 pb-1">Professional Summary</h3>
                          <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-sm sm:text-base">{details.objective || selRes.summary || 'Not provided'}</p>
                        </section>
                        {details.experiences && details.experiences.length > 0 && (
                          <section>
                            <h3 className="text-lg font-bold text-gray-800 mb-3 uppercase tracking-wider border-b-[1.5px] border-gray-300 pb-1">Experience & Training</h3>
                            <div className="space-y-4">
                              {details.experiences.map((exp: any) => (
                                <div key={exp.id}>
                                  <div className="flex justify-between items-baseline font-bold text-gray-900">
                                    <h4 className="text-base">{exp.company}</h4>
                                    <span className="text-sm text-gray-600">{exp.duration}</span>
                                  </div>
                                  <div className={`font-medium text-sm mb-1 ${palette.subtitle}`}>{exp.role}</div>
                                  <div className="text-gray-800 text-sm whitespace-pre-wrap">{exp.desc}</div>
                                </div>
                              ))}
                            </div>
                          </section>
                        )}
                        {details.projects && details.projects.length > 0 && (
                          <section>
                            <h3 className="text-lg font-bold text-gray-800 mb-3 uppercase tracking-wider border-b-[1.5px] border-gray-300 pb-1">Projects</h3>
                            <div className="space-y-4">
                              {details.projects.map((proj: any) => (
                                <div key={proj.id}>
                                  <div className="flex justify-between items-baseline font-bold text-gray-900">
                                    <h4 className="text-base">{proj.name}</h4>
                                    <span className="text-sm text-gray-600">{proj.duration}</span>
                                  </div>
                                  <div className="text-gray-800 text-sm whitespace-pre-wrap mt-1">{proj.desc}</div>
                                </div>
                              ))}
                            </div>
                          </section>
                        )}
                      </div>
                      <div className="space-y-8">
                        <section className={`rounded-2xl border p-5 ${palette.section}`}>
                          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-3">Contact & Skills</h3>
                          <div className="space-y-2 text-sm text-gray-700">
                            <p><span className="font-bold">Email:</span> {details.email || 'Not provided'}</p>
                            <p><span className="font-bold">Phone:</span> {details.phone || 'Not provided'}</p>
                            <p><span className="font-bold">Location:</span> {details.location || 'Not provided'}</p>
                            <p><span className="font-bold">LinkedIn:</span> {details.linkedinText || 'Not provided'}</p>
                            <p><span className="font-bold">GitHub:</span> {details.githubText || 'Not provided'}</p>
                          </div>
                          <div className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm text-gray-800 border border-slate-100">{details.skills || selRes.skills || 'Not provided'}</div>
                        </section>
                        {details.educations && details.educations.length > 0 && (
                          <section>
                            <h3 className="text-lg font-bold text-gray-800 mb-3 uppercase tracking-wider border-b-[1.5px] border-gray-300 pb-1">Education</h3>
                            <div className="space-y-3">
                              {details.educations.map((edu: any) => (
                                <div key={edu.id}>
                                  <div className="flex justify-between items-baseline font-bold text-gray-900">
                                    <h4 className="text-base">{edu.inst}</h4>
                                    <span className="text-sm text-gray-600">{edu.duration}</span>
                                  </div>
                                  <div className="flex justify-between items-baseline text-gray-800 text-sm mt-0.5">
                                    <span>{edu.degree}</span>
                                    <span className="font-medium">{edu.grade}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </section>
                        )}
                        {details.achievements && (
                          <section>
                            <h3 className="text-lg font-bold text-gray-800 mb-3 uppercase tracking-wider border-b-[1.5px] border-gray-300 pb-1">Achievements</h3>
                            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-sm sm:text-base">{details.achievements}</p>
                          </section>
                        )}
                        {details.certifications && (
                          <section>
                            <h3 className="text-lg font-bold text-gray-800 mb-3 uppercase tracking-wider border-b-[1.5px] border-gray-300 pb-1">Certifications</h3>
                            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-sm sm:text-base">{details.certifications}</p>
                          </section>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="print:text-black mt-8 text-slate-900">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-2">{details.fullName || selRes.fullName || uName}</h1>
                    <h2 className={`text-xl sm:text-2xl mb-4 ${palette.subtitle}`}>{details.title || selRes.title}</h2>
                    
                    <div className="space-y-8 mt-8">
                      <section>
                        <h3 className="text-lg font-bold text-gray-800 mb-3 uppercase tracking-wider border-b-[1.5px] border-gray-300 pb-1">Professional Summary</h3>
                        <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-sm sm:text-base">{details.objective || selRes.summary || 'Not provided'}</p>
                      </section>
                      
                      <section>
                        <h3 className="text-lg font-bold text-gray-800 mb-3 uppercase tracking-wider border-b-[1.5px] border-gray-300 pb-1">Technical Skills</h3>
                        <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-sm sm:text-base bg-gray-50 print:bg-white p-4 print:p-0 rounded-lg border border-gray-100 print:border-none">{details.skills || selRes.skills || 'Not provided'}</p>
                      </section>

                      {details.experiences && details.experiences.length > 0 && (
                          <section>
                            <h3 className="text-lg font-bold text-gray-800 mb-3 uppercase tracking-wider border-b-[1.5px] border-gray-300 pb-1">Experience & Training</h3>
                            <div className="space-y-4">
                              {details.experiences.map((exp: any) => (
                                 <div key={exp.id}>
                                    <div className="flex justify-between items-baseline font-bold text-gray-900">
                                      <h4 className="text-base">{exp.company}</h4>
                                      <span className="text-sm text-gray-600">{exp.duration}</span>
                                    </div>
                                    <div className={`font-medium text-sm mb-1 ${palette.subtitle}`}>{exp.role}</div>
                                    <div className="text-gray-800 text-sm whitespace-pre-wrap">{exp.desc}</div>
                                 </div>
                              ))}
                            </div>
                          </section>
                      )}

                      {details.projects && details.projects.length > 0 && (
                          <section>
                            <h3 className="text-lg font-bold text-gray-800 mb-3 uppercase tracking-wider border-b-[1.5px] border-gray-300 pb-1">Projects</h3>
                            <div className="space-y-4">
                              {details.projects.map((proj: any) => (
                                 <div key={proj.id}>
                                    <div className="flex justify-between items-baseline font-bold text-gray-900">
                                      <h4 className="text-base">{proj.name}</h4>
                                      <span className="text-sm text-gray-600">{proj.duration}</span>
                                    </div>
                                    <div className="text-gray-800 text-sm whitespace-pre-wrap mt-1">{proj.desc}</div>
                                 </div>
                              ))}
                            </div>
                          </section>
                      )}

                      {details.educations && details.educations.length > 0 && (
                          <section>
                            <h3 className="text-lg font-bold text-gray-800 mb-3 uppercase tracking-wider border-b-[1.5px] border-gray-300 pb-1">Education</h3>
                            <div className="space-y-3">
                              {details.educations.map((edu: any) => (
                                 <div key={edu.id}>
                                    <div className="flex justify-between items-baseline font-bold text-gray-900">
                                      <h4 className="text-base">{edu.inst}</h4>
                                      <span className="text-sm text-gray-600">{edu.duration}</span>
                                    </div>
                                    <div className="flex justify-between items-baseline text-gray-800 text-sm mt-0.5">
                                      <span>{edu.degree}</span>
                                      <span className="font-medium">{edu.grade}</span>
                                    </div>
                                 </div>
                              ))}
                            </div>
                          </section>
                      )}
                      
                      {details.achievements && (
                          <section>
                            <h3 className="text-lg font-bold text-gray-800 mb-3 uppercase tracking-wider border-b-[1.5px] border-gray-300 pb-1">Achievements</h3>
                            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-sm sm:text-base">{details.achievements}</p>
                          </section>
                      )}

                      {details.certifications && (
                          <section>
                            <h3 className="text-lg font-bold text-gray-800 mb-3 uppercase tracking-wider border-b-[1.5px] border-gray-300 pb-1">Certifications</h3>
                            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-sm sm:text-base">{details.certifications}</p>
                          </section>
                      )}
                    </div>
                  </div>
                )}
                </div>
              </div>
            );
          })()}

          {curView === 'ats-tool' && (
            <div className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-slate-900/75 p-8 shadow-2xl shadow-black/30">
              <div className="mb-6">
                <h2 className="flex items-center gap-3 text-3xl font-extrabold text-white">
                  <Activity className="w-8 h-8 text-purple-300" /> Standalone ATS Analyzer
                </h2>
                <p className="mt-2 text-lg text-slate-400">Upload any PDF resume here to check its ATS compatibility against a specific job role.</p>
              </div>

              {extAts && (
                <div className="mb-8 flex flex-col items-center gap-6 rounded-2xl border border-purple-300/20 bg-purple-500/10 p-6 md:flex-row">
                  <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-[6px] border-purple-300/30 bg-slate-950 shadow-sm">
                    <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                      <circle cx="42" cy="42" r="38" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-purple-100" />
                      <circle cx="42" cy="42" r="38" stroke="currentColor" strokeWidth="6" fill="transparent" 
                        strokeDasharray={238} strokeDashoffset={238 - (238 * extAts.score) / 100} 
                        className={`transition-all duration-1000 ${extAts.score > 75 ? 'text-emerald-500' : extAts.score > 50 ? 'text-amber-500' : 'text-rose-500'}`} />
                    </svg>
                      <span className="text-2xl font-black text-white">{extAts.score}</span>
                  </div>
                  <div className="flex-1">
                      <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                        <CheckCircle2 className="w-5 h-5 text-purple-300" /> AI Feedback
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-300">{extAts.feedback}</p>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">Target Job Role</label>
                  <input type="text" placeholder="e.g., Senior Java Developer" value={extJob} onChange={(e) => setExtJob(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10" />
                </div>
                
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">Upload Resume (PDF)</label>
                  <div 
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all ${
                      dragging ? 'border-purple-400 bg-purple-500/15 scale-[1.02]' 
                      : selFile ? 'border-purple-400 bg-purple-500/10' 
                      : 'border-slate-700 hover:border-purple-400 hover:bg-white/5'
                    }`}
                  >
                    <input 
                      type="file" accept=".pdf" 
                      onChange={(e) => setSelFile(e.target.files?.[0] || null)} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    />
                    <UploadCloud className={`w-12 h-12 mx-auto mb-3 transition-colors ${
                      dragging ? 'text-purple-700' : selFile ? 'text-purple-600' : 'text-slate-400'
                    }`} />
                    <p className="text-lg font-bold text-slate-100">
                      {selFile ? selFile.name : dragging ? "Drop PDF Here!" : "Click or drag to upload resume"}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">PDF files only (Max 5MB)</p>
                  </div>
                </div>

                <button 
                  onClick={handleExtAts} disabled={extAnalyzing || !extJob || !selFile}
                  className="w-full bg-slate-900 hover:bg-purple-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:bg-slate-900"
                >
                  <Activity className={`w-5 h-5 ${extAnalyzing ? 'animate-spin' : ''}`} />
                  {extAnalyzing ? 'Extracting & Analyzing AI Score...' : 'Scan Resume'}
                </button>
              </div>
            </div>
          )}

          {curView === 'dashboard' && (
            <>
              <div className="mb-8 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-extrabold text-white">Your Documents</h2>
                  <p className="mt-2 text-lg text-slate-400">Manage and view your saved resumes.</p>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => { setSelRes(null); setCurView('create'); }} 
                    className="flex items-center gap-2 rounded-lg border border-indigo-300/30 bg-indigo-400/10 px-5 py-2 font-bold text-indigo-100 transition-colors hover:bg-indigo-400/15"
                  >
                    Create Basic
                  </button>
                  <button 
                    onClick={() => { setSelRes(null); setCurView('workspace'); }} 
                    className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 font-bold text-white shadow-md shadow-indigo-500/20 transition-colors hover:bg-indigo-500"
                  >
                    <Sparkles className="w-4 h-4" /> Live Builder Pro
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="py-10 text-center font-medium text-slate-400">Loading your resumes...</div>
              ) : err ? (
                <div className="rounded-lg border border-rose-400/25 bg-rose-500/10 p-4 text-rose-100">{err}</div>
              ) : resumes.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-10 text-center shadow-2xl shadow-black/20">
                  <h3 className="mt-4 text-xl font-bold text-slate-100">No resumes found</h3>
                  <p className="mb-6 mt-2 text-slate-400">You haven't created any resumes yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {resumes.map((r) => (
                    <div key={r.id} className="group relative flex h-full flex-col rounded-2xl border border-white/10 bg-slate-900/75 p-6 shadow-xl shadow-black/20 transition-all hover:-translate-y-1 hover:border-indigo-400/40 hover:shadow-indigo-500/10">
                      <button onClick={() => handleDel(r.id)} className="absolute right-4 top-4 text-slate-500 transition-colors hover:text-rose-400">
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <div className="flex-1 mt-2">
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-400/10 text-indigo-300">
                          <FileText className="w-5 h-5" />
                        </div>
                        <h3 className="truncate pr-6 text-xl font-bold text-white">{r.title}</h3>
                        <p className="mt-2 line-clamp-3 text-sm text-slate-400">
                          {(() => {
                              try { 
                                  const pr = JSON.parse(r.content || '{}');
                                  return pr.objective || r.summary || 'No summary provided.';
                              } catch { return r.summary || 'No summary provided.' }
                          })()}
                        </p>
                      </div>
                      <div className="mt-6 flex space-x-3 border-t border-white/10 pt-4">
                        <button onClick={() => handleEdit(r)} className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2 text-sm font-bold text-slate-200 transition-colors hover:bg-white/10">
                          Edit
                        </button>
                        <button onClick={() => handlePreview(r)} className="flex-1 rounded-lg bg-indigo-500/15 py-2 text-sm font-bold text-indigo-100 transition-colors hover:bg-indigo-600 hover:text-white">
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
