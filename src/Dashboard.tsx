import React, { useState, useEffect } from 'react';
import ResumeBuilder from './components/ResumeBuilder'; 
import { requestResumePdf } from './services/exportService';
import { deleteResume, fetchUserResumes } from './services/resumeService';
import { checkAtsScore, extractTextFromPdf } from './services/aiService'; 
import type { Resume } from './types/resume';
import { clearSession, getUserEmail, getUserName } from './utils/storage';
import { Mail, Phone, Link2, Code, Lock, Activity, CheckCircle2, Target, UploadCloud } from 'lucide-react'; 

const Dashboard: React.FC = () => {
  const userName = getUserName();
  const userEmail = getUserEmail();
  
  const [selectedTemplateId, setSelectedTemplateId] = useState<number>(1);
  const userRole = localStorage.getItem('userRole') || 'FREE'; 
  
  const [currentView, setCurrentView] = useState<'dashboard' | 'create' | 'preview' | 'edit' | 'ats-tool'>('dashboard');
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // ATS State (Internal)
  const [atsData, setAtsData] = useState<{score: number, feedback: string} | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // ATS State (External Tool)
  const [extJobTitle, setExtJobTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extAtsData, setExtAtsData] = useState<{score: number, feedback: string} | null>(null);
  const [isExtAnalyzing, setIsExtAnalyzing] = useState(false);
  
  // Drag & Drop State
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (currentView === 'dashboard') fetchResumes();
  }, [currentView]);

  const fetchResumes = async () => {
    setIsLoading(true);
    setError('');
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
    } catch (err: any) {
      alert(`Network Error: ${err.message}.`);
    }
  };

  const handleLogout = () => {
    clearSession();
    window.location.reload();
  };

  const handlePreview = (resume: Resume) => {
    setSelectedResume(resume);
    setAtsData(null); 
    setCurrentView('preview');
  };

  const handleEdit = (resume: Resume) => {
    setSelectedResume(resume);
    setCurrentView('edit');
  };

  const handleDownloadPDF = async () => {
    if (!selectedResume) return;
    alert("Generating your professional PDF... Please wait.");
    try {
      const fileUrl = await requestResumePdf(selectedResume.id, selectedTemplateId, { userEmail });
      if (fileUrl) window.open(fileUrl, '_blank');
      else alert("PDF is still processing. Check back in a minute.");
    } catch (err: any) {
      alert(err.message || 'Unable to connect to Export Service (8083).');
    }
  };

  const handleATSCheck = async () => {
    if (!selectedResume) return;
    setIsAnalyzing(true);
    setAtsData(null);
    const contentToAnalyze = `Summary: ${selectedResume.summary || ''} Skills: ${selectedResume.skills || ''} Experience: ${selectedResume.experience || ''} Education: ${selectedResume.education || ''}`;

    try {
      const result = await checkAtsScore(selectedResume.title || 'Professional', contentToAnalyze);
      setAtsData(result);
    } catch (err) {
      alert("Failed to analyze ATS. Ensure AI Service (8085) is running with a valid API Key.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExternalATSCheck = async () => {
    if (!extJobTitle.trim() || !selectedFile) {
      alert("Please enter a Job Title and upload a PDF Resume!");
      return;
    }
    setIsExtAnalyzing(true);
    setExtAtsData(null);
    try {
      const extractedText = await extractTextFromPdf(selectedFile);
      const result = await checkAtsScore(extJobTitle, extractedText);
      setExtAtsData(result);
    } catch (err) {
      alert("Analysis failed. Check your connection to AI Service (8085) and ensure the file is a readable PDF.");
    } finally {
      setIsExtAnalyzing(false);
    }
  };

  // Drag & Drop Event Handlers 
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      if (files[0].type === 'application/pdf') {
        setSelectedFile(files[0]);
      } else {
        alert("Please upload a valid PDF file.");
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans print:bg-white">
      {/* SIDEBAR */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col shadow-xl print:hidden shrink-0">
        <div className="h-20 flex items-center px-8 border-b border-gray-800">
          <h1 className="text-2xl font-bold text-indigo-400 tracking-wide">ResumePilot</h1>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <button onClick={() => setCurrentView('dashboard')} className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${currentView === 'dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
            My Resumes
          </button>
          <button onClick={() => { setSelectedResume(null); setCurrentView('create'); }} className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${currentView === 'create' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
            Create New
          </button>
          
          <div className="my-4 border-t border-gray-800 pt-4" />
          <button onClick={() => setCurrentView('ats-tool')} className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${currentView === 'ats-tool' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
            <span className="flex items-center gap-2"><Target className="w-4 h-4" /> ATS Analyzer</span>
            <span className="bg-purple-500/30 text-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-full">AI</span>
          </button>
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button onClick={handleLogout} className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-red-400 hover:bg-gray-800 hover:text-red-300 rounded-lg transition-colors">
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen print:h-auto print:overflow-visible">
        <header className="h-20 bg-white shadow-sm flex items-center justify-between px-10 flex-shrink-0 print:hidden">
          <div className="text-gray-500">
            Overview / <span className="text-gray-900 font-medium capitalize">{currentView.replace('-', ' ')}</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg border-2 border-indigo-200">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="font-semibold text-gray-700">{userName}</span>
          </div>
        </header>

        <div className="p-10 flex-1 overflow-y-auto print:p-0 print:overflow-visible">
          {(currentView === 'create' || currentView === 'edit') && (
            <ResumeBuilder existingResume={currentView === 'edit' ? selectedResume : null} onSuccessReturn={() => setCurrentView('dashboard')} />
          )}

          {/*  STANDALONE ATS CHECKER TOOL  */}
          {currentView === 'ats-tool' && (
            <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
              <div className="mb-6">
                <h2 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                  <Activity className="w-8 h-8 text-purple-600" /> Standalone ATS Analyzer
                </h2>
                <p className="text-gray-500 mt-2 text-lg">Upload any PDF resume here to check its ATS compatibility against a specific job role.</p>
              </div>

              {extAtsData && (
                <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl flex flex-col md:flex-row gap-6 items-center">
                  <div className="relative w-24 h-24 shrink-0 flex items-center justify-center rounded-full bg-white shadow-sm border-[6px] border-purple-200">
                    <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                      <circle cx="42" cy="42" r="38" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-purple-100" />
                      <circle cx="42" cy="42" r="38" stroke="currentColor" strokeWidth="6" fill="transparent" 
                        strokeDasharray={238} strokeDashoffset={238 - (238 * extAtsData.score) / 100} 
                        className={`transition-all duration-1000 ${extAtsData.score > 75 ? 'text-emerald-500' : extAtsData.score > 50 ? 'text-amber-500' : 'text-rose-500'}`} />
                    </svg>
                    <span className="text-2xl font-black text-slate-800">{extAtsData.score}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-purple-600" /> AI Feedback
                    </h3>
                    <p className="mt-2 text-slate-600 text-sm leading-relaxed">{extAtsData.feedback}</p>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Target Job Role</label>
                  <input type="text" placeholder="e.g., Senior Java Developer" value={extJobTitle} onChange={(e) => setExtJobTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10" />
                </div>
                
                {/*  REAL DRAG & DROP BOX  */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Upload Resume (PDF)</label>
                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all ${
                      isDragging ? 'border-purple-600 bg-purple-100 scale-[1.02]' 
                      : selectedFile ? 'border-purple-500 bg-purple-50' 
                      : 'border-slate-300 hover:border-purple-400 hover:bg-purple-50/50'
                    }`}
                  >
                    <input 
                      type="file" 
                      accept=".pdf" 
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    />
                    <UploadCloud className={`w-12 h-12 mx-auto mb-3 transition-colors ${
                      isDragging ? 'text-purple-700' : selectedFile ? 'text-purple-600' : 'text-slate-400'
                    }`} />
                    <p className="font-bold text-slate-700 text-lg">
                      {selectedFile ? selectedFile.name : isDragging ? "Drop PDF Here!" : "Click or drag to upload resume"}
                    </p>
                    <p className="text-sm text-slate-500 mt-2">PDF files only (Max 5MB)</p>
                  </div>
                </div>

                <button 
                  onClick={handleExternalATSCheck} disabled={isExtAnalyzing || !extJobTitle || !selectedFile}
                  className="w-full bg-slate-900 hover:bg-purple-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:bg-slate-900"
                >
                  <Activity className={`w-5 h-5 ${isExtAnalyzing ? 'animate-spin' : ''}`} />
                  {isExtAnalyzing ? 'Extracting & Analyzing AI Score...' : 'Scan Resume'}
                </button>
              </div>
            </div>
          )}

          {/* PREVIEW VIEW */}
          {currentView === 'preview' && selectedResume && (
             <div className="max-w-4xl mx-auto bg-white p-10 rounded-2xl shadow-lg border border-gray-100 print:shadow-none print:border-none print:p-0 print:max-w-full">
              <div className="flex justify-between items-center mb-6 print:hidden">
                <button onClick={() => setCurrentView('dashboard')} className="text-indigo-600 font-semibold hover:underline flex items-center">
                  &larr; Back to My Resumes
                </button>
                <div className="space-x-4 flex items-center">
                  <button onClick={() => handleEdit(selectedResume)} className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg transition-colors">
                    Edit Info
                  </button>
                  <button onClick={handleATSCheck} disabled={isAnalyzing} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-colors inline-flex items-center gap-2 disabled:opacity-70">
                    <Activity className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                    {isAnalyzing ? 'Analyzing...' : 'Check ATS Score'}
                  </button>
                  <button onClick={handleDownloadPDF} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-colors inline-flex items-center">
                    Download PDF
                  </button>
                </div>
              </div>

              <div className="mb-10 border-b border-t border-slate-200 py-6 print:hidden">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Select Template Style</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button onClick={() => setSelectedTemplateId(1)} className={`p-5 rounded-xl border-2 text-left transition-all ${selectedTemplateId === 1 ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-200 hover:border-indigo-300'}`}>
                    <div className="font-bold text-slate-800">Basic Formatter</div>
                    <div className="text-sm text-slate-500 mt-1">Simple plain text design. Clean and minimal.</div>
                    <span className="inline-block mt-3 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md">FREE</span>
                  </button>
                  <button onClick={() => {
                      if (userRole === 'PREMIUM' || userRole === 'ADMIN') setSelectedTemplateId(2);
                      else alert("Upgrade to Premium to use the Professional ATS format! 🚀");
                    }}
                    className={`p-5 rounded-xl border-2 text-left transition-all relative ${selectedTemplateId === 2 ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-200'} ${userRole !== 'PREMIUM' && userRole !== 'ADMIN' ? 'opacity-70 bg-slate-50' : 'hover:border-indigo-300'}`}
                  >
                    <div className="font-bold text-slate-800 flex items-center justify-between">
                      Professional ATS
                      {(userRole !== 'PREMIUM' && userRole !== 'ADMIN') && <Lock className="w-5 h-5 text-slate-400" />}
                    </div>
                    <div className="text-sm text-slate-500 mt-1">Structured lines, icons, and ATS optimized.</div>
                    <span className="inline-block mt-3 text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-md">PREMIUM</span>
                  </button>
                </div>
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

              <div className="print:text-black">
                <h1 className="text-5xl font-extrabold text-gray-900 mb-2">{selectedResume.fullName || userName}</h1>
                <h2 className="text-2xl text-gray-600 mb-4">{selectedResume.title}</h2>
                <div className="flex flex-wrap items-center gap-5 text-sm font-medium text-gray-600 mb-8 border-b-2 border-gray-800 pb-6">
                  {userEmail && <span className="flex items-center gap-2"><Mail className="w-4 h-4 text-indigo-500" /> {userEmail}</span>}
                  {(selectedResume as any).phone && <span className="flex items-center gap-2"><Phone className="w-4 h-4 text-teal-500" /> {(selectedResume as any).phone}</span>}
                  {(selectedResume as any).linkedin && <span className="flex items-center gap-2"><Link2 className="w-4 h-4 text-sky-500" /> {(selectedResume as any).linkedin}</span>}
                  {(selectedResume as any).github && <span className="flex items-center gap-2"><Code className="w-4 h-4 text-gray-700" /> {(selectedResume as any).github}</span>}
                </div>
                <div className="space-y-8">
                  <section>
                    <h3 className="text-xl font-bold text-gray-800 mb-3 uppercase tracking-wider text-sm border-b pb-1">Professional Summary</h3>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedResume.summary || 'Not provided'}</p>
                  </section>
                  <section>
                    <h3 className="text-xl font-bold text-gray-800 mb-3 uppercase tracking-wider text-sm border-b pb-1">Technical Skills</h3>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 print:bg-white p-4 print:p-0 rounded-lg border border-gray-100 print:border-none">{selectedResume.skills || 'Not provided'}</p>
                  </section>
                  <section>
                    <h3 className="text-xl font-bold text-gray-800 mb-3 uppercase tracking-wider text-sm border-b pb-1">Experience</h3>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedResume.experience || 'Not provided'}</p>
                  </section>
                  <section>
                    <h3 className="text-xl font-bold text-gray-800 mb-3 uppercase tracking-wider text-sm border-b pb-1">Education</h3>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedResume.education || 'Not provided'}</p>
                  </section>
                </div>
              </div>
            </div>
          )}

          {/* DASHBOARD VIEW */}
          {currentView === 'dashboard' && (
            <>
              <div className="mb-8 flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-extrabold text-gray-900">Your Documents</h2>
                  <p className="text-gray-500 mt-2 text-lg">Manage and view your saved resumes.</p>
                </div>
                <button onClick={() => { setSelectedResume(null); setCurrentView('create'); }} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-colors">
                  + New Resume
                </button>
              </div>

              {isLoading ? (
                <div className="text-center py-10 text-gray-500 font-medium">Loading your resumes...</div>
              ) : error ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">{error}</div>
              ) : resumes.length === 0 ? (
                <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 text-center">
                  <h3 className="text-xl font-bold text-gray-700 mt-4">No resumes found</h3>
                  <p className="text-gray-500 mt-2 mb-6">You haven't created any resumes yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {resumes.map((resume) => (
                    <div key={resume.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-all relative group flex flex-col h-full">
                      <button onClick={() => handleDelete(resume.id)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors" title="Delete Resume">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                      <div className="flex-1 mt-2">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-4">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 truncate pr-6">{resume.title}</h3>
                        <p className="text-gray-500 mt-2 text-sm line-clamp-3">{resume.summary || 'No summary provided.'}</p>
                      </div>
                      <div className="mt-6 flex space-x-3 pt-4 border-t border-gray-100">
                        <button onClick={() => handleEdit(resume)} className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-2 rounded-lg text-sm transition-colors border border-gray-200">
                          Edit
                        </button>
                        <button onClick={() => handlePreview(resume)} className="flex-1 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 font-bold py-2 rounded-lg text-sm transition-colors">
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