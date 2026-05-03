import React, { useState, useEffect } from 'react';
import { Layout, Settings, Download, FileText, Save, Loader2, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { getUserEmail } from '../utils/storage'; 

interface ResumeWorkspaceProps {
  existingData?: any; 
  templateId?: number; 
  onBack?: () => void;
}

const ResumeWorkspace: React.FC<ResumeWorkspaceProps> = ({ existingData, templateId = 1, onBack }) => {
  
  const defaultData = {
    title: 'Aniruddha ATS Resume',
    fullName: 'Aniruddha Yaduwanshi',
    email: 'aniruddha9131@gmail.com',
    phone: '+91-9926832993',
    location: 'Bhopal, Madhya Pradesh',
    linkedinText: 'LinkedIn',
    linkedinUrl: 'https://linkedin.com/in/aniruddha',
    githubText: 'GitHub',
    githubUrl: 'https://github.com/aniruddha9131',
    objective: 'Results-driven Software Engineering student with a robust foundation in Data Structures, Algorithms, and enterprise backend architecture. Proven ability to architect scalable Spring Boot applications and solve complex algorithmic challenges (600+ day CodeChef streak). Seeking a Specialist Programmer role to engineer efficient, high-impact technical solutions.',
    educations: [
      { id: 1, inst: 'Technocrats Institute of Technology (Excellence)', degree: 'B.Tech in Computer Science', grade: 'CGPA: 8.25', duration: 'Nov 2022 - May 2026' },
      { id: 2, inst: 'MP Board (MPBSE)', degree: 'Class 12', grade: '83%', duration: '2021 - 2022' }
    ],
    experiences: [
      { id: 1, company: 'Bridgelabz Fellowship (Capgemini)', role: 'Software Development Trainee', duration: 'Mar 2026 - Present', desc: '• Selected for an intensive, industry-focused fellowship specializing in advanced Java Full-Stack development and enterprise system design.\n• Engineered modular backend microservices, consistently exceeding performance benchmarks.' }
    ],
    projects: [
      { id: 1, name: 'ResumePilot - AI Resume Builder', duration: '2025', desc: '• Architected a full-stack AI-driven SaaS platform for generating ATS-optimized professional resumes.\n• Engineered RESTful APIs utilizing a Microservices architecture, integrating an API Gateway and Service Registry.\n• Secured backend endpoints utilizing Spring Security and JWT.' },
      { id: 2, name: 'Quantity Measurement Application', duration: '2026', desc: '• Developed a scalable, N-Tier full-stack application, seamlessly integrating a dynamic React frontend with a high-performance Java backend.' }
    ],
    skills: '• Languages: Java, C++, TypeScript, Python\n• Technologies: REST API, JDBC, Microservices\n• Frameworks: Spring Boot, Spring Security\n• Tools & DB: Git, GitHub, Maven, MySQL',
    achievements: '• Maintained an exceptional 600+ day problem-solving streak on CodeChef.\n• Solved 250+ advanced DSA problems on LeetCode.',
    certifications: '• Microsoft Azure Fundamentals (AZ-900) - Microsoft\n• Java Full Stack Development - Talent Next',
    extracurricular: '• Actively preparing for JLPT N5 (Japanese Language).\n• NSS Member (2022-2024).'
  };

  const [resumeData, setResumeData] = useState(defaultData);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [resumeId, setResumeId] = useState<number | null>(null);

  useEffect(() => {
    if (existingData) {
      setResumeId(existingData.id);
      try { if (existingData.content) setResumeData(JSON.parse(existingData.content)); } 
      catch (e) { console.error("Parse failed", e); }
    }
  }, [existingData]);

  const handleChange = (e: any) => setResumeData({ ...resumeData, [e.target.name]: e.target.value });
  
  const updateList = (listName: string, id: number, field: string, value: string) => {
    setResumeData({ ...resumeData, [listName]: (resumeData as any)[listName].map((item: any) => item.id === id ? { ...item, [field]: value } : item) });
  };
  
  const addListItem = (listName: string) => {
    let newItem: any = { id: Date.now() };
    if (listName === 'educations') newItem = { ...newItem, inst: 'University Name', degree: 'Degree', grade: 'Grade', duration: 'Year' };
    if (listName === 'experiences') newItem = { ...newItem, company: 'Company', role: 'Role', duration: 'Year', desc: 'Description' };
    if (listName === 'projects') newItem = { ...newItem, name: 'Project Name', duration: 'Year', desc: 'Description' };
    setResumeData({ ...resumeData, [listName]: [...(resumeData as any)[listName], newItem] });
  };
  
  const removeListItem = (listName: string, id: number) => {
    setResumeData({ ...resumeData, [listName]: (resumeData as any)[listName].filter((item: any) => item.id !== id) });
  };

  const handleExportPDF = () => { window.print(); };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const url = resumeId ? `http://localhost:8082/api/resumes/${resumeId}` : 'http://localhost:8082/api/resumes';
      const method = resumeId ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method: method, 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: resumeData.title, userEmail: getUserEmail(), content: JSON.stringify(resumeData) })
      });
      if (response.ok) {
        const savedResume = await response.json();
        if(!resumeId) setResumeId(savedResume.id); 
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) { alert("Save failed!"); } 
    finally { setIsSaving(false); }
  };

  // 🚀 Logic to decide layout based on ID
  const isModernTemplate = templateId === 2 || templateId === 3;

  return (
    <div className="h-screen flex flex-col lg:flex-row bg-slate-100 overflow-hidden font-sans print:block print:bg-white print:h-auto print:overflow-visible">
      <style>
        {`
          @media print {
            @page { size: A4; margin: 0; }
            body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            ::-webkit-scrollbar { display: none; }
          }
        `}
      </style>

      {/* LEFT SIDEBAR */}
      <aside className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-6 gap-8 z-10 print:hidden shrink-0">
        <div className="w-10 h-10 bg-slate-900 rounded-xl text-white flex items-center justify-center font-bold text-xl">R</div>
        <nav className="flex flex-col gap-6 text-slate-500">
          <button className="p-3 bg-slate-100 text-slate-900 rounded-xl"><FileText size={24} /></button>
          <button className="p-3 hover:bg-slate-50 hover:text-slate-900 rounded-xl"><Layout size={24} /></button>
        </nav>
      </aside>

      {/* MIDDLE PANEL (Input Controls) */}
      <section className="w-[380px] bg-white border-r border-slate-200 flex flex-col h-full z-10 shadow-sm print:hidden shrink-0">
        <div className="p-5 border-b border-slate-100 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-900">{resumeId ? 'Edit Resume' : 'New Resume'}</h2>
          <p className="text-xs font-bold text-indigo-600 mt-2 bg-indigo-50 p-2 rounded border border-indigo-100">
            {isModernTemplate ? '✨ Premium Modern Layout' : '📄 Tagda ATS Layout'}
          </p>
        </div>
        <div className="p-5 flex-1 overflow-y-auto space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-1">Personal Info</h3>
            <input type="text" name="fullName" value={resumeData.fullName} onChange={handleChange} className="w-full px-3 py-2 border rounded font-bold" />
            <input type="text" name="phone" value={resumeData.phone} onChange={handleChange} className="w-full px-3 py-2 border rounded text-sm" />
            <input type="text" name="email" value={resumeData.email} onChange={handleChange} className="w-full px-3 py-2 border rounded text-sm" />
            <input type="text" name="location" value={resumeData.location} onChange={handleChange} className="w-full px-3 py-2 border rounded text-sm" />
          </div>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
            <strong>Tip:</strong> Baki saare sections (Education, Projects, etc.) directly A4 paper par click karke edit karein!
          </div>
          <div className="flex gap-2">
             <button onClick={() => addListItem('experiences')} className="flex-1 bg-slate-100 text-slate-800 py-2 rounded text-xs font-bold border border-slate-200">+ Exp</button>
             <button onClick={() => addListItem('projects')} className="flex-1 bg-slate-100 text-slate-800 py-2 rounded text-xs font-bold border border-slate-200">+ Proj</button>
             <button onClick={() => addListItem('educations')} className="flex-1 bg-slate-100 text-slate-800 py-2 rounded text-xs font-bold border border-slate-200">+ Edu</button>
          </div>
        </div>
      </section>

      {/* RIGHT PANEL - LIVE BUILDER */}
      <main className="flex-1 min-w-0 bg-slate-300 flex flex-col h-full relative print:bg-white print:block print:h-auto">
        <header className="min-h-14 border-b border-slate-300 bg-white flex items-center justify-between px-8 py-3 sticky top-0 z-20 print:hidden shrink-0">
          <div className="flex items-center gap-4">
             {onBack && <button onClick={onBack} className="text-sm font-bold text-slate-500 hover:text-slate-900">&larr; Back</button>}
             {saveSuccess && <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded"><CheckCircle2 size={14} /> Saved</span>}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleSave} disabled={isSaving} className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 px-4 py-1.5 rounded text-sm font-bold flex items-center gap-2">
              {isSaving ? <Loader2 size={16} className="animate-spin text-slate-800" /> : <Save size={16} />} Save Draft
            </button>
            <button onClick={handleExportPDF} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-1.5 rounded text-sm font-bold flex items-center gap-2">
              <Download size={16} /> Download PDF
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto py-8 px-4 flex justify-center items-start print:p-0 print:overflow-visible">
          <div className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-2xl transition-all print:shadow-none print:m-0 print:w-full print:h-full">
            
            {/* 🚀 DYNAMIC TEMPLATE LOGIC 🚀 */}
            {isModernTemplate ? (
               // ==========================================
               // TEMPLATE 2 & 3: PREMIUM MODERN (2-COLUMN)
               // ==========================================
               <div className="flex flex-row min-h-[297mm] font-sans">
                  {/* Left Dark Sidebar */}
                  <div className="w-[32%] bg-[#1e293b] text-white p-6 pb-20">
                     <h1 className="text-2xl font-bold leading-tight mb-6 outline-none" contentEditable suppressContentEditableWarning onBlur={(e) => setResumeData({...resumeData, fullName: e.currentTarget.textContent || ''})}>{resumeData.fullName}</h1>
                     
                     <div className="space-y-3 text-[11.5px] text-slate-300 mb-8 border-b border-slate-600 pb-8">
                        <div contentEditable suppressContentEditableWarning className="outline-none break-words" onBlur={(e) => setResumeData({...resumeData, phone: e.currentTarget.textContent || ''})}>{resumeData.phone}</div>
                        <div contentEditable suppressContentEditableWarning className="outline-none break-words" onBlur={(e) => setResumeData({...resumeData, email: e.currentTarget.textContent || ''})}>{resumeData.email}</div>
                        <div contentEditable suppressContentEditableWarning className="outline-none break-words" onBlur={(e) => setResumeData({...resumeData, location: e.currentTarget.textContent || ''})}>{resumeData.location}</div>
                     </div>

                     <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3">Skills</h3>
                     <div className="text-[11.5px] leading-relaxed whitespace-pre-wrap outline-none mb-8" contentEditable suppressContentEditableWarning onBlur={(e) => setResumeData({...resumeData, skills: e.currentTarget.textContent || ''})}>{resumeData.skills}</div>
                     
                     <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3">Certifications</h3>
                     <div className="text-[11.5px] leading-relaxed whitespace-pre-wrap outline-none" contentEditable suppressContentEditableWarning onBlur={(e) => setResumeData({...resumeData, certifications: e.currentTarget.textContent || ''})}>{resumeData.certifications}</div>
                  </div>

                  {/* Right Content */}
                  <div className="w-[68%] bg-white p-8 text-slate-900">
                     <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800 border-b-2 border-slate-200 pb-1 mb-3">Profile</h3>
                     <p className="text-[12px] leading-relaxed text-justify outline-none mb-6 whitespace-pre-wrap" contentEditable suppressContentEditableWarning onBlur={(e) => setResumeData({...resumeData, objective: e.currentTarget.textContent || ''})}>{resumeData.objective}</p>

                     <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800 border-b-2 border-slate-200 pb-1 mb-4 mt-6">Experience</h3>
                     <div className="space-y-4">
                        {resumeData.experiences.map((exp) => (
                           <div key={exp.id} className="relative group">
                             <button onClick={() => removeListItem('experiences', exp.id)} className="absolute -left-6 top-1 text-rose-400 opacity-0 group-hover:opacity-100 print:hidden"><Trash2 size={12} /></button>
                             <div className="flex justify-between items-baseline mb-0.5">
                                <h4 className="font-bold text-[13px] outline-none" contentEditable suppressContentEditableWarning onBlur={(e) => updateList('experiences', exp.id, 'company', e.currentTarget.textContent || '')}>{exp.company}</h4>
                                <span className="text-[11px] font-bold text-slate-500 outline-none" contentEditable suppressContentEditableWarning onBlur={(e) => updateList('experiences', exp.id, 'duration', e.currentTarget.textContent || '')}>{exp.duration}</span>
                             </div>
                             <div className="text-[12px] text-indigo-600 font-medium mb-1.5 outline-none" contentEditable suppressContentEditableWarning onBlur={(e) => updateList('experiences', exp.id, 'role', e.currentTarget.textContent || '')}>{exp.role}</div>
                             <div className="text-[12px] leading-snug whitespace-pre-wrap outline-none" contentEditable suppressContentEditableWarning onBlur={(e) => updateList('experiences', exp.id, 'desc', e.currentTarget.textContent || '')}>{exp.desc}</div>
                           </div>
                        ))}
                     </div>

                     <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800 border-b-2 border-slate-200 pb-1 mb-4 mt-6">Projects</h3>
                     <div className="space-y-3">
                        {resumeData.projects.map((proj) => (
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
                        {resumeData.educations.map((edu) => (
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
               // ==========================================
               // TEMPLATE 1 & 4: THE TAGDA ATS LAYOUT (1-COLUMN)
               // ==========================================
               <div className="p-10 font-sans text-slate-900">
                  {/* Header Section */}
                  <div className="text-center mb-6">
                    <h1 className="text-[28px] font-bold tracking-wide outline-none text-black mb-1" contentEditable suppressContentEditableWarning onBlur={(e) => setResumeData({...resumeData, fullName: e.currentTarget.textContent || ''})}>{resumeData.fullName}</h1>
                    <div className="flex justify-center items-center flex-wrap gap-x-2 text-[12.5px] font-medium text-slate-700">
                      <span contentEditable suppressContentEditableWarning className="outline-none" onBlur={(e) => setResumeData({...resumeData, phone: e.currentTarget.textContent || ''})}>{resumeData.phone}</span>
                      <span className="text-slate-300">|</span>
                      <span contentEditable suppressContentEditableWarning className="outline-none" onBlur={(e) => setResumeData({...resumeData, location: e.currentTarget.textContent || ''})}>{resumeData.location}</span>
                      <span className="text-slate-300">|</span>
                      <span contentEditable suppressContentEditableWarning className="outline-none text-indigo-700" onBlur={(e) => setResumeData({...resumeData, email: e.currentTarget.textContent || ''})}>{resumeData.email}</span>
                      <span className="text-slate-300">|</span>
                      <span contentEditable suppressContentEditableWarning className="outline-none text-indigo-700" onBlur={(e) => setResumeData({...resumeData, linkedinText: e.currentTarget.textContent || ''})}>{resumeData.linkedinText}</span>
                      <span className="text-slate-300">|</span>
                      <span contentEditable suppressContentEditableWarning className="outline-none text-indigo-700" onBlur={(e) => setResumeData({...resumeData, githubText: e.currentTarget.textContent || ''})}>{resumeData.githubText}</span>
                    </div>
                  </div>

                  {/* Objective */}
                  <div className="mb-4">
                    <h2 className="text-[13px] font-bold uppercase tracking-widest border-b-[1.5px] border-slate-300 pb-1 mb-2 text-slate-900">Objective</h2>
                    <p className="text-[12.5px] leading-relaxed text-justify outline-none whitespace-pre-wrap text-slate-800" contentEditable suppressContentEditableWarning onBlur={(e) => setResumeData({...resumeData, objective: e.currentTarget.textContent || ''})}>{resumeData.objective}</p>
                  </div>

                  {/* Education */}
                  <div className="mb-4">
                    <h2 className="text-[13px] font-bold uppercase tracking-widest border-b-[1.5px] border-slate-300 pb-1 mb-2 text-slate-900">Education</h2>
                    <div className="space-y-2">
                       {resumeData.educations.map((edu) => (
                          <div key={edu.id} className="relative group flex justify-between items-start">
                            <button onClick={() => removeListItem('educations', edu.id)} className="absolute -left-6 top-0 text-red-500 opacity-0 group-hover:opacity-100 print:hidden"><Trash2 size={12} /></button>
                            <div>
                               <h3 className="font-bold text-[12.5px] text-slate-900 outline-none" contentEditable suppressContentEditableWarning onBlur={(e) => updateList('educations', edu.id, 'inst', e.currentTarget.textContent || '')}>{edu.inst}</h3>
                               <div className="text-[12.5px] text-slate-800 outline-none" contentEditable suppressContentEditableWarning onBlur={(e) => updateList('educations', edu.id, 'degree', e.currentTarget.textContent || '')}>{edu.degree}</div>
                            </div>
                            <div className="text-right">
                               <div className="font-bold text-[12.5px] text-slate-900 outline-none" contentEditable suppressContentEditableWarning onBlur={(e) => updateList('educations', edu.id, 'duration', e.currentTarget.textContent || '')}>{edu.duration}</div>
                               <div className="text-[12.5px] text-slate-800 outline-none" contentEditable suppressContentEditableWarning onBlur={(e) => updateList('educations', edu.id, 'grade', e.currentTarget.textContent || '')}>{edu.grade}</div>
                            </div>
                          </div>
                       ))}
                    </div>
                  </div>

                  {/* Experience */}
                  <div className="mb-4">
                    <h2 className="text-[13px] font-bold uppercase tracking-widest border-b-[1.5px] border-slate-300 pb-1 mb-2 text-slate-900">Experience & Training</h2>
                    <div className="space-y-3">
                       {resumeData.experiences.map((exp) => (
                          <div key={exp.id} className="relative group">
                            <button onClick={() => removeListItem('experiences', exp.id)} className="absolute -left-6 top-0 text-red-500 opacity-0 group-hover:opacity-100 print:hidden"><Trash2 size={12} /></button>
                            <div className="flex justify-between items-baseline mb-0.5">
                               <h3 className="font-bold text-[13px] text-slate-900 outline-none" contentEditable suppressContentEditableWarning onBlur={(e) => updateList('experiences', exp.id, 'company', e.currentTarget.textContent || '')}>{exp.company}</h3>
                               <span className="font-bold text-[12.5px] text-slate-900 outline-none" contentEditable suppressContentEditableWarning onBlur={(e) => updateList('experiences', exp.id, 'duration', e.currentTarget.textContent || '')}>{exp.duration}</span>
                            </div>
                            <div className="italic text-[12.5px] text-slate-800 mb-1.5 outline-none" contentEditable suppressContentEditableWarning onBlur={(e) => updateList('experiences', exp.id, 'role', e.currentTarget.textContent || '')}>{exp.role}</div>
                            <div className="text-[12.5px] leading-relaxed whitespace-pre-wrap outline-none text-slate-800" contentEditable suppressContentEditableWarning onBlur={(e) => updateList('experiences', exp.id, 'desc', e.currentTarget.textContent || '')}>{exp.desc}</div>
                          </div>
                       ))}
                    </div>
                  </div>

                  {/* Projects */}
                  <div className="mb-4">
                    <h2 className="text-[13px] font-bold uppercase tracking-widest border-b-[1.5px] border-slate-300 pb-1 mb-2 text-slate-900">Projects</h2>
                    <div className="space-y-3">
                       {resumeData.projects.map((proj) => (
                          <div key={proj.id} className="relative group">
                            <button onClick={() => removeListItem('projects', proj.id)} className="absolute -left-6 top-0 text-red-500 opacity-0 group-hover:opacity-100 print:hidden"><Trash2 size={12} /></button>
                            <div className="flex justify-between items-baseline mb-0.5">
                               <h3 className="font-bold text-[13px] text-slate-900 outline-none" contentEditable suppressContentEditableWarning onBlur={(e) => updateList('projects', proj.id, 'name', e.currentTarget.textContent || '')}>{proj.name}</h3>
                               <span className="font-bold text-[12.5px] text-slate-900 outline-none" contentEditable suppressContentEditableWarning onBlur={(e) => updateList('projects', proj.id, 'duration', e.currentTarget.textContent || '')}>{proj.duration}</span>
                            </div>
                            <div className="text-[12.5px] leading-relaxed whitespace-pre-wrap outline-none text-slate-800" contentEditable suppressContentEditableWarning onBlur={(e) => updateList('projects', proj.id, 'desc', e.currentTarget.textContent || '')}>{proj.desc}</div>
                          </div>
                       ))}
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="mb-4">
                    <h2 className="text-[13px] font-bold uppercase tracking-widest border-b-[1.5px] border-slate-300 pb-1 mb-2 text-slate-900">Skills</h2>
                    <div className="text-[12.5px] leading-relaxed whitespace-pre-wrap outline-none text-slate-800" contentEditable suppressContentEditableWarning onBlur={(e) => setResumeData({...resumeData, skills: e.currentTarget.textContent || ''})}>{resumeData.skills}</div>
                  </div>

                  {/* Achievements */}
                  <div className="mb-4">
                    <h2 className="text-[13px] font-bold uppercase tracking-widest border-b-[1.5px] border-slate-300 pb-1 mb-2 text-slate-900">Achievements</h2>
                    <div className="text-[12.5px] leading-relaxed whitespace-pre-wrap outline-none text-slate-800" contentEditable suppressContentEditableWarning onBlur={(e) => setResumeData({...resumeData, achievements: e.currentTarget.textContent || ''})}>{resumeData.achievements}</div>
                  </div>

                  {/* Certifications & Extracurricular */}
                  <div className="mb-4">
                    <h2 className="text-[13px] font-bold uppercase tracking-widest border-b-[1.5px] border-slate-300 pb-1 mb-2 text-slate-900">Certifications & Extracurricular</h2>
                    <div className="text-[12.5px] leading-relaxed whitespace-pre-wrap outline-none mb-2 text-slate-800" contentEditable suppressContentEditableWarning onBlur={(e) => setResumeData({...resumeData, certifications: e.currentTarget.textContent || ''})}>{resumeData.certifications}</div>
                    <div className="text-[12.5px] leading-relaxed whitespace-pre-wrap outline-none text-slate-800" contentEditable suppressContentEditableWarning onBlur={(e) => setResumeData({...resumeData, extracurricular: e.currentTarget.textContent || ''})}>{resumeData.extracurricular}</div>
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