import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Layout, Download, FileText, Save, Loader2, CheckCircle2, Trash2, Zap, Moon, Sun, RotateCcw, Undo2, Redo2 } from 'lucide-react';
import { getUserEmail } from '../utils/storage';
import { generateSummaryWithAI } from '../services/aiService';

interface ResumeWorkspaceProps {
  existingData?: any;
  templateId?: number;
  onBack?: () => void;
}

type ResumeData = {
  title: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedinText: string;
  githubText: string;
  objective: string;
  educations: Array<{ id: number; inst: string; degree: string; grade: string; duration: string }>;
  experiences: Array<{ id: number; company: string; role: string; duration: string; desc: string }>;
  projects: Array<{ id: number; name: string; duration: string; desc: string }>;
  skills: string;
  achievements: string;
  certifications: string;
  extracurricular: string;
};

type EditorSection =
  | 'personal'
  | 'summary'
  | 'experience'
  | 'projects'
  | 'education'
  | 'skills'
  | 'achievements'
  | 'certifications'
  | 'extracurricular';

type AutoSaveMode = 'off' | 'normal' | 'fast';

const ResumeWorkspace: React.FC<ResumeWorkspaceProps> = ({ existingData, templateId = 1, onBack }) => {

  const defaultData: ResumeData = useMemo(() => ({
    title: 'Java Developer', 
    fullName: 'Aniruddha Yaduwanshi',
    email: 'aniruddha9131@gmail.com',
    phone: '+91-9926832993',
    location: 'Bhopal, Madhya Pradesh',
    linkedinText: 'linkedin.com/in/aniruddha',
    githubText: 'github.com/aniruddha9131',
    objective: 'Results-driven Software Engineering student with a robust foundation in Data Structures, Algorithms, and enterprise backend architecture. Proven ability to architect scalable Spring Boot applications and solve complex algorithmic challenges (600+ day CodeChef streak). Seeking a Specialist Programmer role to engineer efficient, high-impact technical solutions.',
    educations: [
      { id: 1, inst: 'Technocrats Institute of Technology (Excellence)', degree: 'B.Tech in Computer Science', grade: 'CGPA: 8.25', duration: 'Nov 2022 - May 2026' },
      { id: 2, inst: 'MP Board (MPBSE)', degree: 'Class 12', grade: '83%', duration: '2021 - 2022' }
    ],
    experiences: [
      { id: 1, company: 'Bridgelabz Fellowship (Capgemini)', role: 'Software Development Trainee', duration: 'Mar 2026 - Present', desc: '• Selected for an intensive, industry-focused fellowship specializing in advanced Java Full-Stack development and enterprise system design.\n• Engineered modular backend microservices, consistently exceeding performance benchmarks in rigorous weekly technical evaluations.' }
    ],
    projects: [
      { id: 1, name: 'ResumePilot - AI Resume Builder', duration: '2025', desc: '• Architected a full-stack AI-driven SaaS platform for generating ATS-optimized professional resumes.\n• Engineered RESTful APIs utilizing a Microservices architecture, integrating an API Gateway and Service Registry.\n• Secured backend endpoints utilizing Spring Security and JWT.' },
      { id: 2, name: 'Quantity Measurement Application', duration: '2026', desc: '• Developed a scalable, N-Tier full-stack application, seamlessly integrating a dynamic React frontend with a high-performance Java backend.' }
    ],
    skills: '• Languages: Java, C++, TypeScript, Python\n• Technologies: REST API, JDBC, Microservices\n• Core: DSA, OOPS, DBMS, System Design\n• Frameworks: Spring Boot, Spring Security\n• Tools & DB: Git, GitHub, Maven, MySQL',
    achievements: '• Maintained an exceptional 600+ day problem-solving streak on CodeChef, successfully conquering over 800 complex algorithmic challenges.\n• Solved 250+ advanced DSA problems on LeetCode, consistently optimizing for minimal time and space complexities.',
    certifications: '• Microsoft Azure Fundamentals (AZ-900) - Microsoft\n• Certified System Administrator - ServiceNow\n• Java Full Stack Development - Talent Next (Wipro)',
    extracurricular: '• Actively preparing for JLPT N5 (Japanese Language Proficiency Test).\n• NSS Member (2022-2024), demonstrating community engagement, leadership, and cross-functional teamwork.'
  }), []);

  const [resumeData, setResumeData] = useState<ResumeData>(defaultData);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [autoSaveSuccess, setAutoSaveSuccess] = useState(false);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [resumeId, setResumeId] = useState<number | null>(null);

  const [activeTemplateId, setActiveTemplateId] = useState(templateId);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('resume_workspace_theme') === 'dark');
  const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit');
  const [autoSaveMode] = useState<AutoSaveMode>('off');

  const isDirtyTrackingInitialized = useRef(false);
  const isApplyingHistoryRef = useRef(false);
  const historyRef = useRef<Array<{ resumeData: ResumeData; activeTemplateId: number }>>([]);
  const redoHistoryRef = useRef<Array<{ resumeData: ResumeData; activeTemplateId: number }>>([]);
  const previousSnapshotRef = useRef<{ resumeData: ResumeData; activeTemplateId: number } | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    localStorage.setItem('resume_workspace_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('resume_workspace_autosave', autoSaveMode);
  }, [autoSaveMode]);

  useEffect(() => {
    isDirtyTrackingInitialized.current = false;
    isApplyingHistoryRef.current = false;
    historyRef.current = [];
    redoHistoryRef.current = [];
    previousSnapshotRef.current = null;
    setCanUndo(false);
    setCanRedo(false);

    if (existingData) {
      setResumeId(existingData.id);
      try {
        if (existingData.content) {
          const parsed = JSON.parse(existingData.content);
          setResumeData({
            ...defaultData,
            ...parsed,
            educations: parsed.educations || [],
            experiences: parsed.experiences || [],
            projects: parsed.projects || []
          });
          const normalizedTemplateId = Number(parsed.templateId);
          if (!Number.isNaN(normalizedTemplateId)) setActiveTemplateId(normalizedTemplateId);
          setHasPendingChanges(false);
          setSaveError(null);
        }
      }
      catch (e) { console.error('Parse failed', e); }
    } else {
      setResumeId(null);
      setActiveTemplateId(templateId);
      setResumeData(defaultData);
      setHasPendingChanges(false);
      setSaveError(null);
    }
  }, [defaultData, existingData, templateId]);

  useEffect(() => {
    if (!isDirtyTrackingInitialized.current) {
      isDirtyTrackingInitialized.current = true;
      previousSnapshotRef.current = { resumeData, activeTemplateId };
      return;
    }

    if (isApplyingHistoryRef.current) {
      isApplyingHistoryRef.current = false;
      previousSnapshotRef.current = { resumeData, activeTemplateId };
      return;
    }

    if (previousSnapshotRef.current) {
      historyRef.current.push(previousSnapshotRef.current);
      if (historyRef.current.length > 30) historyRef.current.shift();
    }

    redoHistoryRef.current = [];
    previousSnapshotRef.current = { resumeData, activeTemplateId };
    setCanUndo(historyRef.current.length > 0);
    setCanRedo(false);
    setHasPendingChanges(true);
  }, [resumeData, activeTemplateId]);

  const handleChange = (e: any) => setResumeData({ ...resumeData, [e.target.name]: e.target.value });
  
  const updateList = (listName: string, id: number, field: string, value: string) => {
    const list = (resumeData as any)[listName] || [];
    setResumeData({ ...resumeData, [listName]: list.map((item: any) => item.id === id ? { ...item, [field]: value } : item) });
  };
  
  const addListItem = (listName: string) => {
    const list = (resumeData as any)[listName] || [];
    let newItem: any = { id: Date.now() };
    if (listName === 'educations') newItem = { ...newItem, inst: 'University Name', degree: 'Degree', grade: 'Grade', duration: 'Year' };
    if (listName === 'experiences') newItem = { ...newItem, company: 'Company Name', role: 'Role/Position', duration: 'Year', desc: 'Description' };
    if (listName === 'projects') newItem = { ...newItem, name: 'Project Name', duration: 'Year', desc: 'Description' };
    setResumeData({ ...resumeData, [listName]: [...list, newItem] });
  };
  
  const removeListItem = (listName: string, id: number) => {
    const list = (resumeData as any)[listName] || [];
    setResumeData({ ...resumeData, [listName]: list.filter((item: any) => item.id !== id) });
  };

  const handleAIGenerate = async () => {
    if (!resumeData.title || resumeData.title.trim() === '') {
      alert('Please enter a Resume Title first so AI knows what to write! (e.g. Java Developer)');
      return;
    }
    setIsGeneratingAI(true);
    try {
      const generatedText = await generateSummaryWithAI(resumeData.title);
      setResumeData({ ...resumeData, objective: generatedText });
    } catch {
      alert('Failed to connect to AI Service. Ensure port 8085 is running.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleUndo = () => {
    const previous = historyRef.current.pop();
    if (!previous) return;
    if (previousSnapshotRef.current) {
      redoHistoryRef.current.push(previousSnapshotRef.current);
      if (redoHistoryRef.current.length > 30) redoHistoryRef.current.shift();
    }
    isApplyingHistoryRef.current = true;
    setResumeData(previous.resumeData);
    setActiveTemplateId(previous.activeTemplateId);
    setCanUndo(historyRef.current.length > 0);
    setCanRedo(redoHistoryRef.current.length > 0);
    setHasPendingChanges(true);
  };

  const handleRedo = () => {
    const next = redoHistoryRef.current.pop();
    if (!next) return;
    if (previousSnapshotRef.current) {
      historyRef.current.push(previousSnapshotRef.current);
      if (historyRef.current.length > 30) historyRef.current.shift();
    }
    isApplyingHistoryRef.current = true;
    setResumeData(next.resumeData);
    setActiveTemplateId(next.activeTemplateId);
    setCanUndo(historyRef.current.length > 0);
    setCanRedo(redoHistoryRef.current.length > 0);
    setHasPendingChanges(true);
  };

  const resetSection = (section: EditorSection) => {
    if (section === 'personal') {
      setResumeData((prev) => ({
        ...prev,
        fullName: defaultData.fullName,
        email: defaultData.email,
        phone: defaultData.phone,
        location: defaultData.location,
        linkedinText: defaultData.linkedinText,
        githubText: defaultData.githubText
      }));
      return;
    }
    if (section === 'summary') {
      setResumeData((prev) => ({ ...prev, objective: defaultData.objective }));
      return;
    }
    if (section === 'experience') {
      setResumeData((prev) => ({ ...prev, experiences: [...defaultData.experiences] }));
      return;
    }
    if (section === 'projects') {
      setResumeData((prev) => ({ ...prev, projects: [...defaultData.projects] }));
      return;
    }
    if (section === 'education') {
      setResumeData((prev) => ({ ...prev, educations: [...defaultData.educations] }));
      return;
    }
    if (section === 'skills') {
      setResumeData((prev) => ({ ...prev, skills: defaultData.skills }));
      return;
    }
    if (section === 'achievements') {
      setResumeData((prev) => ({ ...prev, achievements: defaultData.achievements }));
      return;
    }
    if (section === 'certifications') {
      setResumeData((prev) => ({ ...prev, certifications: defaultData.certifications }));
      return;
    }
    if (section === 'extracurricular') {
      setResumeData((prev) => ({ ...prev, extracurricular: defaultData.extracurricular }));
    }
  };

  const handleExportPDF = async () => {
    if (!resumeId) {
      const saved = await handleSave({ silent: true });
      if (!saved) return;
    }
    window.print();
  };

  const handleSave = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (!silent) setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setSaveError('Login token missing. Please login again.');
        return false;
      }
      const url = resumeId ? `http://localhost:8082/resume/update/${resumeId}` : 'http://localhost:8082/resume/create';
      const response = await fetch(url, {
        method: resumeId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'User-Email': getUserEmail()
        },
        body: JSON.stringify({
          title: (() => {
            const currentTitle = resumeData.title.trim();
            if (currentTitle && currentTitle.toLowerCase() !== 'java developer') return currentTitle;
            const jobTag = resumeData.objective.trim().split(/\s+/).slice(0, 3).join(' ') || resumeData.fullName.trim().split(/\s+/).slice(0, 2).join(' ') || 'Resume';
            return `Resume_${jobTag.replace(/[^a-zA-Z0-9]+/g, '_')}_${new Date().toISOString().slice(0, 10)}`;
          })(),
          content: JSON.stringify({ ...resumeData, templateId: activeTemplateId, summary: resumeData.objective || 'Professional Resume' })
        })
      });

      if (!response.ok) {
        setSaveError(`Save failed (${response.status}). Please retry.`);
        return false;
      }

      try {
        const savedText = await response.text();
        if (savedText) {
          const savedResume = JSON.parse(savedText);
          if (savedResume.id) setResumeId(savedResume.id);
        }
      } catch (e) {
        console.error('Save parse warning', e);
      }

      setSaveError(null);
      setHasPendingChanges(false);
      if (silent) {
        setAutoSaveSuccess(true);
        setTimeout(() => setAutoSaveSuccess(false), 1800);
      } else {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
      return true;
    } catch (error) {
      console.error('Save Error', error);
      setSaveError('Save failed. Backend may be down.');
      return false;
    } finally {
      if (!silent) setIsSaving(false);
    }
  }, [activeTemplateId, resumeData, resumeId]);

  useEffect(() => {
    if (autoSaveMode === 'off' || !hasPendingChanges || isSaving || isGeneratingAI) return;
    const timer = window.setTimeout(() => {
      handleSave({ silent: true });
    }, autoSaveMode === 'fast' ? 700 : 1600);
    return () => window.clearTimeout(timer);
  }, [autoSaveMode, hasPendingChanges, isSaving, isGeneratingAI, handleSave]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') {
          e.preventDefault();
          handleSave();
        }
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          handleUndo();
        }
        if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault();
          handleRedo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  useEffect(() => {
    const autoRecoverKey = `resumepilot_autorecover_${resumeId || 'new'}`;
    const timer = window.setInterval(() => {
      if (hasPendingChanges) {
        try {
          localStorage.setItem(autoRecoverKey, JSON.stringify({ resumeData, activeTemplateId, timestamp: Date.now() }));
        } catch (e) {
          console.warn('Auto-recovery save failed', e);
        }
      }
    }, 5000);
    return () => window.clearInterval(timer);
  }, [resumeData, activeTemplateId, hasPendingChanges, autoSaveMode, resumeId]);

  useEffect(() => {
    const autoRecoverKey = `resumepilot_autorecover_${resumeId || 'new'}`;
    const recovered = localStorage.getItem(autoRecoverKey);
    if (recovered && !isDirtyTrackingInitialized.current) {
      try {
        const { resumeData: recoveredData, activeTemplateId: recoveredTemplate, timestamp } = JSON.parse(recovered);
        const ageMinutes = (Date.now() - timestamp) / 60000;
        if (ageMinutes < 1440 && recoveredData) {
          const confirmed = window.confirm(
            `Found unsaved draft from ${new Date(timestamp).toLocaleString()}. Restore it?`
          );
          if (confirmed) {
            setResumeData(recoveredData);
            setActiveTemplateId(recoveredTemplate);
            setHasPendingChanges(true);
          } else {
            localStorage.removeItem(autoRecoverKey);
          }
        }
      } catch (e) {
        console.warn('Auto-recovery restore failed', e);
      }
    }
  }, [resumeId]);

  // 🚀 HELPER FUNCTION TO MAKE URLs CLICKABLE IN PDF
  const makeValidUrl = (text: string) => {
    if (!text) return '#';
    if (text.startsWith('http://') || text.startsWith('https://')) return text;
    return `https://${text}`;
  };

  // ==========================================
  // DYNAMIC TEMPLATE STYLING LOGIC
  // ==========================================
  const isTwoColumn = [2, 3, 5, 6].includes(activeTemplateId);

  let headerAlign = "text-center";
  let nameFont = "font-sans text-[28px]";
  let accentText = "text-indigo-700";
  let sectionBorder = "border-b-[1.5px] border-slate-300 text-slate-900 uppercase tracking-widest pb-1 mb-2";
  
  let textBase = "text-slate-800";
  let textMuted = "text-slate-600";
  let textBold = "text-slate-900";

  if (activeTemplateId === 1) { 
      headerAlign = "text-center";
      nameFont = "font-sans text-[32px] font-black text-black tracking-tight"; 
      accentText = "text-black hover:text-indigo-600 transition-colors";
      sectionBorder = "border-b-[2px] border-black text-black font-bold uppercase tracking-widest pb-1 mb-3 mt-5";
      textBase = "text-black";
      textMuted = "text-gray-900";
      textBold = "text-black";
  } 
  else if (activeTemplateId === 4) { 
      headerAlign = "text-left";
      accentText = "text-teal-700 hover:text-teal-900 transition-colors";
      sectionBorder = "border-b-2 border-teal-200 text-teal-900 uppercase tracking-widest pb-1 mb-2 mt-4";
  } 
  else if (activeTemplateId === 7) { 
      accentText = "text-purple-700 hover:text-purple-900 transition-colors";
      sectionBorder = "border-b border-dashed border-purple-400 text-purple-900 uppercase tracking-widest pb-1 mb-2 mt-4";
  } 
  else if (activeTemplateId === 8) { 
      nameFont = "font-serif text-[28px]";
      accentText = "text-amber-700 hover:text-amber-900 transition-colors";
      sectionBorder = "border-b-[2px] border-amber-700 text-amber-900 font-serif uppercase tracking-widest pb-1 mb-2 mt-4";
  }

  let sideBg = "bg-[#1e293b]"; 
  let sideAccent = "text-indigo-400 hover:text-indigo-300 transition-colors";
  if (activeTemplateId === 3) { sideBg = "bg-[#0f172a]"; sideAccent = "text-blue-400 hover:text-blue-300 transition-colors"; }
  if (activeTemplateId === 5) { sideBg = "bg-[#1e3a8a]"; sideAccent = "text-sky-300 hover:text-sky-200 transition-colors"; }
  if (activeTemplateId === 6) { sideBg = "bg-[#0f766e]"; sideAccent = "text-teal-200 hover:text-teal-100 transition-colors"; }

  const shellBg = isDarkMode ? 'bg-slate-900' : 'bg-slate-100';
  const panelBg = isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200';
  const panelHeaderBg = isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100';
  const panelText = isDarkMode ? 'text-slate-100' : 'text-slate-900';
  const mutedText = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const inputBase = isDarkMode
    ? 'w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400'
    : 'w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500';
  const sectionCard = isDarkMode
    ? 'space-y-3 rounded-xl border border-slate-700 bg-slate-800/60 p-4'
    : 'space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4';
  const sectionTitle = isDarkMode ? 'text-sm font-bold text-slate-100' : 'text-sm font-bold text-slate-800';
  const subtleBorder = isDarkMode ? 'border-slate-700' : 'border-slate-200';

  return (
    <div className={`flex h-screen w-full flex-col overflow-hidden font-sans print:block print:bg-white print:h-auto print:overflow-visible lg:flex-row ${shellBg}`}>
      
      <style>{`
        @media print { 
          @page { size: A4 portrait; margin: 0; } 
          body { margin: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } 
          ::-webkit-scrollbar { display: none; } 
          a { text-decoration: none !important; color: inherit; }
        }
      `}</style>

      <div className={`flex items-center justify-between border-b px-4 py-2 lg:hidden ${panelBg}`}>
        <div className={`text-xs font-semibold uppercase tracking-wide ${mutedText}`}>Workspace</div>
        <div className="inline-flex rounded-lg border border-slate-300 p-1">
          <button
            onClick={() => setMobileView('edit')}
            className={`rounded px-3 py-1 text-xs font-semibold ${mobileView === 'edit' ? 'bg-indigo-600 text-white' : isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}
          >
            Edit
          </button>
          <button
            onClick={() => setMobileView('preview')}
            className={`rounded px-3 py-1 text-xs font-semibold ${mobileView === 'preview' ? 'bg-indigo-600 text-white' : isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}
          >
            Preview
          </button>
        </div>
      </div>

      {/* LEFT SIDEBAR */}
      <aside className={`z-10 flex shrink-0 flex-row items-center justify-between gap-4 border-b px-4 py-3 print:hidden lg:w-20 lg:flex-col lg:items-center lg:justify-start lg:border-r lg:border-b-0 lg:py-6 lg:gap-8 ${panelBg}`}>
        <div className="w-10 h-10 bg-slate-900 rounded-xl text-white flex items-center justify-center font-bold text-xl">R</div>
        <nav className={`flex gap-3 lg:flex-col lg:gap-6 ${mutedText}`}>
          <button className={`rounded-xl p-3 ${isDarkMode ? 'bg-slate-700 text-slate-100' : 'bg-slate-100 text-slate-900'}`}><FileText size={24} /></button>
          <button className={`rounded-xl p-3 ${isDarkMode ? 'hover:bg-slate-700 hover:text-slate-100' : 'hover:bg-slate-50 hover:text-slate-900'}`}><Layout size={24} /></button>
        </nav>
      </aside>

      {/* MIDDLE PANEL (Input Controls) */}
      <section className={`${mobileView === 'preview' ? 'hidden lg:flex' : 'flex'} z-10 h-full w-full shrink-0 flex-col border-r shadow-sm print:hidden lg:w-[420px] overflow-hidden ${panelBg}`}>
        <div className={`shrink-0 border-b p-4 sm:p-5 ${panelHeaderBg}`}>
          <h2 className={`text-lg font-bold sm:text-xl ${panelText}`}>{resumeId ? 'Edit Resume' : 'New Resume'}</h2>
          <input type="text" name="title" value={resumeData.title} onChange={handleChange} className={`mt-2 font-semibold ${inputBase}`} placeholder="Resume Title (e.g. Java Dev)" />
        </div>
        
        <div className="flex-1 space-y-6 overflow-y-auto p-4 pb-20 sm:p-5">
          <details open className={sectionCard}>
            <summary className="list-none cursor-pointer">
              <div className="flex items-center justify-between">
                <h3 className={sectionTitle}>Personal Info</h3>
                <button onClick={(e) => { e.preventDefault(); resetSection('personal'); }} className="inline-flex items-center gap-1 rounded border border-slate-300 px-2 py-0.5 text-xs font-semibold text-slate-700">
                  <RotateCcw size={12} /> Reset
                </button>
              </div>
            </summary>
            <div className="space-y-3 pt-2">
              <input type="text" name="fullName" value={resumeData.fullName} onChange={handleChange} placeholder="Full Name" className={`${inputBase} font-bold`} />
              <input type="text" name="phone" value={resumeData.phone} onChange={handleChange} placeholder="Phone Number" className={inputBase} />
              <input type="text" name="email" value={resumeData.email} onChange={handleChange} placeholder="Email Address" className={inputBase} />
              <input type="text" name="location" value={resumeData.location} onChange={handleChange} placeholder="Location" className={inputBase} />
              <input type="text" name="linkedinText" value={resumeData.linkedinText} onChange={handleChange} placeholder="LinkedIn URL/Username" className={inputBase} />
              <input type="text" name="githubText" value={resumeData.githubText} onChange={handleChange} placeholder="GitHub URL/Username" className={inputBase} />
            </div>
          </details>

          <details open className={`rounded-xl border p-4 ${isDarkMode ? 'border-indigo-500/40 bg-indigo-500/10' : 'border-indigo-100 bg-indigo-50/30'}`}>
            <summary className="list-none cursor-pointer">
              <div className={`flex items-center justify-between border-b pb-2 ${isDarkMode ? 'border-indigo-500/20' : 'border-indigo-100'}`}>
                <h3 className="text-sm font-bold text-indigo-900">Summary</h3>
                <div className="flex items-center gap-2">
                  <button onClick={(e) => { e.preventDefault(); resetSection('summary'); }} className="inline-flex items-center gap-1 rounded border border-indigo-300 bg-white px-2 py-0.5 text-xs font-semibold text-indigo-700">
                    <RotateCcw size={12} /> Reset
                  </button>
                  <button type="button" onClick={(e) => { e.preventDefault(); handleAIGenerate(); }} disabled={isGeneratingAI || !resumeData.title} className="group inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-2 py-1 text-[11px] font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50">
                    <Zap className={`h-3 w-3 ${isGeneratingAI ? 'animate-pulse text-yellow-300' : 'text-yellow-300'}`} />
                    {isGeneratingAI ? 'Writing...' : 'AI Writer'}
                  </button>
                </div>
              </div>
            </summary>
            <textarea rows={5} value={resumeData.objective} onChange={(e) => setResumeData({...resumeData, objective: e.target.value})} placeholder="Click AI Writer to generate a professional summary instantly..." className={`${inputBase} mt-3 resize-y`} />
          </details>

          <details open className={sectionCard}>
            <summary className="list-none cursor-pointer">
              <div className="flex items-center justify-between">
                <h3 className={sectionTitle}>Experience</h3>
                <div className="flex items-center gap-2">
                  <button onClick={(e) => { e.preventDefault(); resetSection('experience'); }} className="inline-flex items-center gap-1 rounded border border-slate-300 px-2 py-0.5 text-xs font-semibold text-slate-700">
                    <RotateCcw size={12} /> Reset
                  </button>
                  <button onClick={(e) => { e.preventDefault(); addListItem('experiences'); }} className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-slate-700">+ Add</button>
                </div>
              </div>
            </summary>
            <div className="space-y-3 pt-2">
              {resumeData.experiences?.map((exp: any) => (
                <div key={exp.id} className={`rounded-lg border p-3 ${subtleBorder}`}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className={`text-xs font-semibold uppercase ${mutedText}`}>Item</span>
                    <button onClick={() => removeListItem('experiences', exp.id)} className="rounded border border-rose-300 px-2 py-0.5 text-xs font-semibold text-rose-600">Remove</button>
                  </div>
                  <div className="space-y-2">
                    <input value={exp.company} onChange={(e) => updateList('experiences', exp.id, 'company', e.target.value)} placeholder="Company" className={inputBase} />
                    <input value={exp.role} onChange={(e) => updateList('experiences', exp.id, 'role', e.target.value)} placeholder="Role" className={inputBase} />
                    <input value={exp.duration} onChange={(e) => updateList('experiences', exp.id, 'duration', e.target.value)} placeholder="Duration" className={inputBase} />
                    <textarea rows={3} value={exp.desc} onChange={(e) => updateList('experiences', exp.id, 'desc', e.target.value)} placeholder="Description" className={`${inputBase} resize-y`} />
                  </div>
                </div>
              ))}
            </div>
          </details>

          <details open className={sectionCard}>
            <summary className="list-none cursor-pointer">
              <div className="flex items-center justify-between">
                <h3 className={sectionTitle}>Projects</h3>
                <div className="flex items-center gap-2">
                  <button onClick={(e) => { e.preventDefault(); resetSection('projects'); }} className="inline-flex items-center gap-1 rounded border border-slate-300 px-2 py-0.5 text-xs font-semibold text-slate-700">
                    <RotateCcw size={12} /> Reset
                  </button>
                  <button onClick={(e) => { e.preventDefault(); addListItem('projects'); }} className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-slate-700">+ Add</button>
                </div>
              </div>
            </summary>
            <div className="space-y-3 pt-2">
              {resumeData.projects?.map((proj: any) => (
                <div key={proj.id} className={`rounded-lg border p-3 ${subtleBorder}`}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className={`text-xs font-semibold uppercase ${mutedText}`}>Item</span>
                    <button onClick={() => removeListItem('projects', proj.id)} className="rounded border border-rose-300 px-2 py-0.5 text-xs font-semibold text-rose-600">Remove</button>
                  </div>
                  <div className="space-y-2">
                    <input value={proj.name} onChange={(e) => updateList('projects', proj.id, 'name', e.target.value)} placeholder="Project Name" className={inputBase} />
                    <input value={proj.duration} onChange={(e) => updateList('projects', proj.id, 'duration', e.target.value)} placeholder="Duration" className={inputBase} />
                    <textarea rows={3} value={proj.desc} onChange={(e) => updateList('projects', proj.id, 'desc', e.target.value)} placeholder="Description" className={`${inputBase} resize-y`} />
                  </div>
                </div>
              ))}
            </div>
          </details>

          <details open className={sectionCard}>
            <summary className="list-none cursor-pointer">
              <div className="flex items-center justify-between">
                <h3 className={sectionTitle}>Education</h3>
                <div className="flex items-center gap-2">
                  <button onClick={(e) => { e.preventDefault(); resetSection('education'); }} className="inline-flex items-center gap-1 rounded border border-slate-300 px-2 py-0.5 text-xs font-semibold text-slate-700">
                    <RotateCcw size={12} /> Reset
                  </button>
                  <button onClick={(e) => { e.preventDefault(); addListItem('educations'); }} className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-slate-700">+ Add</button>
                </div>
              </div>
            </summary>
            <div className="space-y-3 pt-2">
              {resumeData.educations?.map((edu: any) => (
                <div key={edu.id} className={`rounded-lg border p-3 ${subtleBorder}`}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className={`text-xs font-semibold uppercase ${mutedText}`}>Item</span>
                    <button onClick={() => removeListItem('educations', edu.id)} className="rounded border border-rose-300 px-2 py-0.5 text-xs font-semibold text-rose-600">Remove</button>
                  </div>
                  <div className="space-y-2">
                    <input value={edu.inst} onChange={(e) => updateList('educations', edu.id, 'inst', e.target.value)} placeholder="Institution" className={inputBase} />
                    <input value={edu.degree} onChange={(e) => updateList('educations', edu.id, 'degree', e.target.value)} placeholder="Degree" className={inputBase} />
                    <div className="grid grid-cols-2 gap-2">
                      <input value={edu.grade} onChange={(e) => updateList('educations', edu.id, 'grade', e.target.value)} placeholder="Grade" className={inputBase} />
                      <input value={edu.duration} onChange={(e) => updateList('educations', edu.id, 'duration', e.target.value)} placeholder="Duration" className={inputBase} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </details>

          <details open className={sectionCard}>
            <summary className="list-none cursor-pointer">
              <div className="flex items-center justify-between">
                <h3 className={sectionTitle}>Skills</h3>
                <button onClick={(e) => { e.preventDefault(); resetSection('skills'); }} className="inline-flex items-center gap-1 rounded border border-slate-300 px-2 py-0.5 text-xs font-semibold text-slate-700">
                  <RotateCcw size={12} /> Reset
                </button>
              </div>
            </summary>
            <textarea rows={4} value={resumeData.skills} onChange={(e) => setResumeData({...resumeData, skills: e.target.value})} className={`${inputBase} mt-2 resize-y`} />
          </details>

          <details open className={sectionCard}>
            <summary className="list-none cursor-pointer">
              <div className="flex items-center justify-between">
                <h3 className={sectionTitle}>Achievements</h3>
                <button onClick={(e) => { e.preventDefault(); resetSection('achievements'); }} className="inline-flex items-center gap-1 rounded border border-slate-300 px-2 py-0.5 text-xs font-semibold text-slate-700">
                  <RotateCcw size={12} /> Reset
                </button>
              </div>
            </summary>
            <textarea rows={4} value={resumeData.achievements} onChange={(e) => setResumeData({...resumeData, achievements: e.target.value})} className={`${inputBase} mt-2 resize-y`} />
          </details>

          <details open className={sectionCard}>
            <summary className="list-none cursor-pointer">
              <div className="flex items-center justify-between">
                <h3 className={sectionTitle}>Certifications</h3>
                <button onClick={(e) => { e.preventDefault(); resetSection('certifications'); }} className="inline-flex items-center gap-1 rounded border border-slate-300 px-2 py-0.5 text-xs font-semibold text-slate-700">
                  <RotateCcw size={12} /> Reset
                </button>
              </div>
            </summary>
            <textarea rows={4} value={resumeData.certifications} onChange={(e) => setResumeData({...resumeData, certifications: e.target.value})} className={`${inputBase} mt-2 resize-y`} />
          </details>

          <details open className={sectionCard}>
            <summary className="list-none cursor-pointer">
              <div className="flex items-center justify-between">
                <h3 className={sectionTitle}>Extracurricular</h3>
                <button onClick={(e) => { e.preventDefault(); resetSection('extracurricular'); }} className="inline-flex items-center gap-1 rounded border border-slate-300 px-2 py-0.5 text-xs font-semibold text-slate-700">
                  <RotateCcw size={12} /> Reset
                </button>
              </div>
            </summary>
            <textarea rows={4} value={resumeData.extracurricular} onChange={(e) => setResumeData({...resumeData, extracurricular: e.target.value})} className={`${inputBase} mt-2 resize-y`} />
          </details>
        </div>
      </section>

      {/* RIGHT PANEL - LIVE BUILDER */}
      <main className={`${mobileView === 'edit' ? 'hidden lg:flex' : 'flex'} relative min-w-0 flex-1 flex-col h-full print:block print:h-auto print:bg-white overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-300'}`}>
        <header className={`flex min-h-14 shrink-0 flex-col gap-3 border-b px-4 py-3 print:hidden sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8 ${panelBg}`}>
          <div className="flex items-center gap-4">
             {onBack && <button onClick={onBack} className={`text-sm font-bold ${isDarkMode ? 'text-slate-300 hover:text-slate-100' : 'text-slate-500 hover:text-slate-900'}`}>&larr; Back</button>}
             {saveSuccess && <span className="flex items-center gap-1 rounded bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-600"><CheckCircle2 size={14} /> Saved</span>}
             {autoSaveSuccess && <span className="flex items-center gap-1 rounded bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-600"><CheckCircle2 size={14} /> Auto-saved</span>}
             {hasPendingChanges && <span className="rounded bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">Unsaved edits</span>}
             {saveError && <span className="rounded bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700">{saveError}</span>}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsDarkMode((prev) => !prev)}
              className={`inline-flex items-center gap-2 rounded px-3 py-1.5 text-sm font-bold ${isDarkMode ? 'border border-slate-600 bg-slate-700 text-slate-100 hover:bg-slate-600' : 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50'}`}
            >
              {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
              {isDarkMode ? 'Light' : 'Dark'}
            </button>
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className={`inline-flex items-center gap-2 rounded border px-3 py-1.5 text-sm font-bold ${!canUndo ? 'cursor-not-allowed opacity-50' : ''} ${isDarkMode ? 'border-slate-600 bg-slate-700 text-slate-100 hover:bg-slate-600' : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'}`}
            >
              <Undo2 size={15} /> Undo
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className={`inline-flex items-center gap-2 rounded border px-3 py-1.5 text-sm font-bold ${!canRedo ? 'cursor-not-allowed opacity-50' : ''} ${isDarkMode ? 'border-slate-600 bg-slate-700 text-slate-100 hover:bg-slate-600' : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'}`}
            >
              <Redo2 size={15} /> Redo
            </button>
            <div className={`mr-2 flex items-center gap-3 border-r pr-5 ${isDarkMode ? 'border-slate-700' : 'border-slate-300'}`}>
              <span className={`text-xs font-bold uppercase tracking-widest ${mutedText}`}>Layout</span>
              <select value={activeTemplateId} onChange={(e) => setActiveTemplateId(Number(e.target.value))} className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-bold outline-none focus:border-indigo-500 ${isDarkMode ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-slate-300 bg-slate-100 text-slate-700'}`}>
                <option value={1}>Classic Fresher</option>
                <option value={2}>Modern Pro</option>
                <option value={3}>Executive ATS</option>
                <option value={4}>Minimalist Free</option>
                <option value={5}>Tech Lead Pro</option>
                <option value={6}>Creative Designer</option>
                <option value={7}>Basic Formatter</option>
                <option value={8}>Senior Manager</option>
              </select>
            </div>
            <button onClick={() => handleSave()} disabled={isSaving} className={`flex items-center gap-2 rounded border px-4 py-1.5 text-sm font-bold ${isDarkMode ? 'border-slate-600 bg-slate-700 text-slate-100 hover:bg-slate-600' : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'}`}>
              {isSaving ? <Loader2 size={16} className="animate-spin text-slate-800" /> : <Save size={16} />} Save Draft
            </button>
            <button onClick={handleExportPDF} className="flex items-center gap-2 rounded bg-indigo-600 px-5 py-1.5 text-sm font-bold text-white hover:bg-indigo-700">
              <Download size={16} /> Download PDF
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-3 py-5 sm:px-4 sm:py-8 flex justify-center items-start print:overflow-visible print:p-0">
          <div className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-2xl transition-all print:shadow-none print:m-0 print:w-[210mm] print:max-w-none print:h-auto">
            
            {isTwoColumn ? (
               <div className="flex flex-col font-sans lg:flex-row print:flex-row min-h-[297mm]">
                  <div className={`p-6 pb-10 text-white lg:w-[32%] print:w-[32%] lg:pb-20 print:pb-20 ${sideBg}`}>
                     <h1 className="text-2xl font-bold leading-tight mb-6 outline-none" contentEditable suppressContentEditableWarning onBlur={(e) => setResumeData({...resumeData, fullName: e.currentTarget.textContent || ''})}>{resumeData.fullName}</h1>
                     
                     <div className="space-y-3 text-[11.5px] text-slate-200 mb-8 border-b border-white/20 pb-8">
                        <div contentEditable suppressContentEditableWarning className="outline-none break-words" onBlur={(e) => setResumeData({...resumeData, phone: e.currentTarget.textContent || ''})}>{resumeData.phone}</div>
                        <div contentEditable suppressContentEditableWarning className="outline-none break-words" onBlur={(e) => setResumeData({...resumeData, email: e.currentTarget.textContent || ''})}>{resumeData.email}</div>
                        <div contentEditable suppressContentEditableWarning className="outline-none break-words" onBlur={(e) => setResumeData({...resumeData, location: e.currentTarget.textContent || ''})}>{resumeData.location}</div>
                        
                        {/* 🚀 CLICKABLE LINKS FOR 2-COLUMN */}
                        {resumeData.linkedinText !== undefined && (
                          <a href={makeValidUrl(resumeData.linkedinText)} target="_blank" rel="noopener noreferrer" className={`block ${sideAccent}`}>
                            <span contentEditable suppressContentEditableWarning className="outline-none break-words cursor-text" role="textbox" onBlur={(e) => setResumeData({...resumeData, linkedinText: e.currentTarget.textContent || ''})}>{resumeData.linkedinText}</span>
                          </a>
                        )}
                        {resumeData.githubText !== undefined && (
                          <a href={makeValidUrl(resumeData.githubText)} target="_blank" rel="noopener noreferrer" className={`block ${sideAccent}`}>
                            <span contentEditable suppressContentEditableWarning className="outline-none break-words cursor-text" role="textbox" onBlur={(e) => setResumeData({...resumeData, githubText: e.currentTarget.textContent || ''})}>{resumeData.githubText}</span>
                          </a>
                        )}
                     </div>

                     <h3 className={`text-xs font-bold uppercase tracking-widest mb-3 ${sideAccent}`}>Skills</h3>
                     <div className="text-[11.5px] leading-relaxed whitespace-pre-wrap outline-none mb-8" contentEditable suppressContentEditableWarning onBlur={(e) => setResumeData({...resumeData, skills: e.currentTarget.textContent || ''})}>{resumeData.skills}</div>
                     
                     <h3 className={`text-xs font-bold uppercase tracking-widest mb-3 ${sideAccent}`}>Certifications</h3>
                     <div className="text-[11.5px] leading-relaxed whitespace-pre-wrap outline-none" contentEditable suppressContentEditableWarning onBlur={(e) => setResumeData({...resumeData, certifications: e.currentTarget.textContent || ''})}>{resumeData.certifications}</div>
                  </div>

                  <div className="bg-white p-6 text-slate-900 lg:w-[68%] print:w-[68%] lg:p-8 print:p-8">
                     <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800 border-b-2 border-slate-200 pb-1 mb-3">Profile</h3>
                     <p className="text-[12px] leading-relaxed text-justify outline-none mb-6 whitespace-pre-wrap" contentEditable suppressContentEditableWarning onBlur={(e) => setResumeData({...resumeData, objective: e.currentTarget.textContent || ''})}>{resumeData.objective}</p>

                     <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800 border-b-2 border-slate-200 pb-1 mb-4 mt-6">Experience</h3>
                     <div className="space-y-4">
                        {resumeData.experiences?.map((exp: any) => (
                           <div key={exp.id} className="relative group">
                             <button onClick={() => removeListItem('experiences', exp.id)} className="absolute -left-6 top-1 text-rose-400 opacity-0 group-hover:opacity-100 print:hidden"><Trash2 size={12} /></button>
                             <div className="flex justify-between items-baseline mb-0.5">
                                <h4 className="font-bold text-[13px] outline-none" contentEditable suppressContentEditableWarning onBlur={(e) => updateList('experiences', exp.id, 'company', e.currentTarget.textContent || '')}>{exp.company}</h4>
                                <span className="text-[11px] font-bold text-slate-500 outline-none" contentEditable suppressContentEditableWarning onBlur={(e) => updateList('experiences', exp.id, 'duration', e.currentTarget.textContent || '')}>{exp.duration}</span>
                             </div>
                             <div className="text-[12px] text-slate-600 font-medium mb-1.5 outline-none" contentEditable suppressContentEditableWarning onBlur={(e) => updateList('experiences', exp.id, 'role', e.currentTarget.textContent || '')}>{exp.role}</div>
                             <div className="text-[12px] leading-snug whitespace-pre-wrap outline-none" contentEditable suppressContentEditableWarning onBlur={(e) => updateList('experiences', exp.id, 'desc', e.currentTarget.textContent || '')}>{exp.desc}</div>
                           </div>
                        ))}
                     </div>

                     <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800 border-b-2 border-slate-200 pb-1 mb-4 mt-6">Projects</h3>
                     <div className="space-y-3">
                        {resumeData.projects?.map((proj: any) => (
                           <div key={proj.id} className="relative group">
                             <button onClick={() => removeListItem('projects', proj.id)} className="absolute -left-6 top-1 text-rose-400 opacity-0 group-hover:opacity-100 print:hidden"><Trash2 size={12} /></button>
                             <div className="flex justify-between items-baseline mb-0.5">
                                <h4 className="font-bold text-[13px] outline-none" contentEditable suppressContentEditableWarning onBlur={(e) => updateList('projects', proj.id, 'name', e.currentTarget.textContent || '')}>{proj.name}</h4>
                                <span className="text-[11px] font-bold text-slate-500 outline-none" contentEditable suppressContentEditableWarning onBlur={(e) => updateList('projects', proj.id, 'duration', e.currentTarget.textContent || '')}>{proj.duration}</span>
                             </div>
                             <div className="text-[12px] leading-snug whitespace-pre-wrap outline-none" contentEditable suppressContentEditableWarning onBlur={(e) => updateList('projects', proj.id, 'desc', e.currentTarget.textContent || '')}>{proj.desc}</div>
                           </div>
                        ))}
                     </div>

                     <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800 border-b-2 border-slate-200 pb-1 mb-4 mt-6">Education</h3>
                     <div className="space-y-3">
                        {resumeData.educations?.map((edu: any) => (
                           <div key={edu.id} className="relative group">
                             <button onClick={() => removeListItem('educations', edu.id)} className="absolute -left-6 top-1 text-rose-400 opacity-0 group-hover:opacity-100 print:hidden"><Trash2 size={12} /></button>
                             <div className="flex justify-between items-baseline mb-0.5">
                                <h4 className="font-bold text-[13px] outline-none" contentEditable suppressContentEditableWarning onBlur={(e) => updateList('educations', edu.id, 'inst', e.currentTarget.textContent || '')}>{edu.inst}</h4>
                                <span className="text-[11px] font-bold text-slate-500 outline-none" contentEditable suppressContentEditableWarning onBlur={(e) => updateList('educations', edu.id, 'duration', e.currentTarget.textContent || '')}>{edu.duration}</span>
                             </div>
                             <div className="flex justify-between text-[12px] outline-none">
                                <div contentEditable suppressContentEditableWarning onBlur={(e) => updateList('educations', edu.id, 'degree', e.currentTarget.textContent || '')}>{edu.degree}</div>
                                <div contentEditable suppressContentEditableWarning onBlur={(e) => updateList('educations', edu.id, 'grade', e.currentTarget.textContent || '')}>{edu.grade}</div>
                             </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            ) : (
               <div className="p-8 sm:p-10 print:p-10 font-sans text-slate-900">
                  <div className={`mb-6 ${headerAlign}`}>
                    <h1 className={`font-bold outline-none mb-1 ${nameFont}`} contentEditable suppressContentEditableWarning onBlur={(e) => setResumeData({...resumeData, fullName: e.currentTarget.textContent || ''})}>{resumeData.fullName}</h1>
                    
                    <div className={`flex flex-wrap gap-x-2 text-[12.5px] font-medium ${textMuted} ${headerAlign === 'text-left' ? 'justify-start' : 'justify-center'}`}>
                      <span contentEditable suppressContentEditableWarning className="outline-none" onBlur={(e) => setResumeData({...resumeData, phone: e.currentTarget.textContent || ''})}>{resumeData.phone}</span>
                      <span className="text-slate-300">|</span>
                      <span contentEditable suppressContentEditableWarning className="outline-none" onBlur={(e) => setResumeData({...resumeData, location: e.currentTarget.textContent || ''})}>{resumeData.location}</span>
                      <span className="text-slate-300">|</span>
                      <span contentEditable suppressContentEditableWarning className={`outline-none ${accentText}`} onBlur={(e) => setResumeData({...resumeData, email: e.currentTarget.textContent || ''})}>{resumeData.email}</span>
                      
                      {/* 🚀 CLICKABLE LINKS FOR 1-COLUMN */}
                       {resumeData.linkedinText !== undefined && (
                        <>
                          <span className="text-slate-300">|</span>
                          <a href={makeValidUrl(resumeData.linkedinText)} target="_blank" rel="noopener noreferrer" className={`inline-block hover:underline ${accentText}`}>
                            <span contentEditable suppressContentEditableWarning className={`outline-none ${accentText} cursor-text`} role="textbox" onBlur={(e) => setResumeData({...resumeData, linkedinText: e.currentTarget.textContent || ''})}>{resumeData.linkedinText}</span>
                          </a>
                        </>
                       )}
                      
                       {resumeData.githubText !== undefined && (
                        <>
                          <span className="text-slate-300">|</span>
                          <a href={makeValidUrl(resumeData.githubText)} target="_blank" rel="noopener noreferrer" className={`inline-block hover:underline ${accentText}`}>
                            <span contentEditable suppressContentEditableWarning className={`outline-none ${accentText} cursor-text`} role="textbox" onBlur={(e) => setResumeData({...resumeData, githubText: e.currentTarget.textContent || ''})}>{resumeData.githubText}</span>
                          </a>
                        </>
                       )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h2 className={`text-[13px] ${sectionBorder}`}>Objective</h2>
                    <p className={`text-[12.5px] leading-relaxed text-justify outline-none whitespace-pre-wrap ${textBase}`} contentEditable suppressContentEditableWarning onBlur={(e) => setResumeData({...resumeData, objective: e.currentTarget.textContent || ''})}>{resumeData.objective}</p>
                  </div>

                  <div className="mb-4">
                    <h2 className={`text-[13px] ${sectionBorder}`}>Education</h2>
                    <div className="space-y-2">
                       {resumeData.educations?.map((edu: any) => (
                          <div key={edu.id} className="relative group flex justify-between items-start">
                            <button onClick={() => removeListItem('educations', edu.id)} className="absolute -left-6 top-0 text-red-500 opacity-0 group-hover:opacity-100 print:hidden"><Trash2 size={12} /></button>
                            <div>
                               <h3 className={`font-bold text-[13px] outline-none ${textBold}`} contentEditable suppressContentEditableWarning onBlur={(e) => updateList('educations', edu.id, 'inst', e.currentTarget.textContent || '')}>{edu.inst}</h3>
                               <div className={`text-[12.5px] outline-none mt-0.5 ${textBase}`} contentEditable suppressContentEditableWarning onBlur={(e) => updateList('educations', edu.id, 'degree', e.currentTarget.textContent || '')}>{edu.degree}</div>
                            </div>
                            <div className="text-right">
                               <div className={`font-bold text-[12.5px] outline-none ${textBold}`} contentEditable suppressContentEditableWarning onBlur={(e) => updateList('educations', edu.id, 'duration', e.currentTarget.textContent || '')}>{edu.duration}</div>
                               <div className={`text-[12.5px] outline-none mt-0.5 ${textBase}`} contentEditable suppressContentEditableWarning onBlur={(e) => updateList('educations', edu.id, 'grade', e.currentTarget.textContent || '')}>{edu.grade}</div>
                            </div>
                          </div>
                       ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h2 className={`text-[13px] ${sectionBorder}`}>Experience & Training</h2>
                    <div className="space-y-4">
                       {resumeData.experiences?.map((exp: any) => (
                          <div key={exp.id} className="relative group">
                            <button onClick={() => removeListItem('experiences', exp.id)} className="absolute -left-6 top-0 text-red-500 opacity-0 group-hover:opacity-100 print:hidden"><Trash2 size={12} /></button>
                            <div className="flex justify-between items-baseline mb-0.5">
                               <h3 className={`font-bold text-[13px] outline-none ${textBold}`} contentEditable suppressContentEditableWarning onBlur={(e) => updateList('experiences', exp.id, 'company', e.currentTarget.textContent || '')}>{exp.company}</h3>
                               <span className={`font-bold text-[12.5px] outline-none ${textBold}`} contentEditable suppressContentEditableWarning onBlur={(e) => updateList('experiences', exp.id, 'duration', e.currentTarget.textContent || '')}>{exp.duration}</span>
                            </div>
                            <div className={`italic text-[12.5px] mb-1.5 outline-none ${activeTemplateId === 1 ? 'text-black font-semibold' : accentText}`} contentEditable suppressContentEditableWarning onBlur={(e) => updateList('experiences', exp.id, 'role', e.currentTarget.textContent || '')}>{exp.role}</div>
                            <div className={`text-[12.5px] leading-relaxed whitespace-pre-wrap outline-none ${textBase}`} contentEditable suppressContentEditableWarning onBlur={(e) => updateList('experiences', exp.id, 'desc', e.currentTarget.textContent || '')}>{exp.desc}</div>
                          </div>
                       ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h2 className={`text-[13px] ${sectionBorder}`}>Projects</h2>
                    <div className="space-y-4">
                       {resumeData.projects?.map((proj: any) => (
                          <div key={proj.id} className="relative group">
                            <button onClick={() => removeListItem('projects', proj.id)} className="absolute -left-6 top-0 text-red-500 opacity-0 group-hover:opacity-100 print:hidden"><Trash2 size={12} /></button>
                            <div className="flex justify-between items-baseline mb-0.5">
                               <h3 className={`font-bold text-[13px] outline-none ${textBold}`} contentEditable suppressContentEditableWarning onBlur={(e) => updateList('projects', proj.id, 'name', e.currentTarget.textContent || '')}>{proj.name}</h3>
                               <span className={`font-bold text-[12.5px] outline-none ${textBold}`} contentEditable suppressContentEditableWarning onBlur={(e) => updateList('projects', proj.id, 'duration', e.currentTarget.textContent || '')}>{proj.duration}</span>
                            </div>
                            <div className={`text-[12.5px] leading-relaxed whitespace-pre-wrap outline-none mt-1 ${textBase}`} contentEditable suppressContentEditableWarning onBlur={(e) => updateList('projects', proj.id, 'desc', e.currentTarget.textContent || '')}>{proj.desc}</div>
                          </div>
                       ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h2 className={`text-[13px] ${sectionBorder}`}>Skills</h2>
                    <div className={`text-[12.5px] leading-relaxed whitespace-pre-wrap outline-none ${textBase}`} contentEditable suppressContentEditableWarning onBlur={(e) => setResumeData({...resumeData, skills: e.currentTarget.textContent || ''})}>{resumeData.skills}</div>
                  </div>

                  <div className="mb-4">
                    <h2 className={`text-[13px] ${sectionBorder}`}>Achievements</h2>
                    <div className={`text-[12.5px] leading-relaxed whitespace-pre-wrap outline-none ${textBase}`} contentEditable suppressContentEditableWarning onBlur={(e) => setResumeData({...resumeData, achievements: e.currentTarget.textContent || ''})}>{resumeData.achievements}</div>
                  </div>

                  <div className="mb-4">
                    <h2 className={`text-[13px] ${sectionBorder}`}>Certifications & Extracurricular</h2>
                    <div className={`text-[12.5px] leading-relaxed whitespace-pre-wrap outline-none mb-2 ${textBase}`} contentEditable suppressContentEditableWarning onBlur={(e) => setResumeData({...resumeData, certifications: e.currentTarget.textContent || ''})}>{resumeData.certifications}</div>
                    <div className={`text-[12.5px] leading-relaxed whitespace-pre-wrap outline-none ${textBase}`} contentEditable suppressContentEditableWarning onBlur={(e) => setResumeData({...resumeData, extracurricular: e.currentTarget.textContent || ''})}>{resumeData.extracurricular}</div>
                  </div>

               </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResumeWorkspace;
