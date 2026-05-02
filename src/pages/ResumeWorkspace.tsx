import React, { useState } from 'react';
import { Layout, Settings, Download, FileText, Save, Loader2, CheckCircle2, Plus, Trash2 } from 'lucide-react';

const ResumeWorkspace = () => {
  const [resumeData, setResumeData] = useState({
    title: 'Aniruddha ATS Resume',
    fullName: 'Aniruddha Yaduwanshi',
    email: 'aniruddha9131@gmail.com',
    phone: '+91-9926832993',
    location: 'Bhopal, Madhya Pradesh',
    
    linkedinText: 'LinkedIn',
    linkedinUrl: 'https://www.linkedin.com/in/aniruddha-yaduwanshi/',
    githubText: 'GitHub',
    githubUrl: 'https://github.com/aniruddha9131',

    objective: 'Results-driven Software Engineering student with a robust foundation in Data Structures, Algorithms, and enterprise backend architecture. Proven ability to architect scalable Spring Boot applications and solve complex algorithmic challenges (600+ day CodeChef streak). Seeking a Specialist Programmer role to engineer efficient, high-impact technical solutions.',
    
    educations: [
      { id: 1, inst: 'Technocrats Institute of Technology (Excellence)', degree: 'B.Tech in Computer Science', grade: 'CGPA: 8.25', duration: 'Nov 2022 - May 2026' },
      { id: 2, inst: 'MP Board (MPBSE)', degree: 'Class 12', grade: '83%', duration: '2021 - 2022' },
      { id: 3, inst: 'MP Board (MPBSE)', degree: 'Class 10', grade: '86%', duration: '2019 - 2020' }
    ],
    
    experiences: [
      { id: 1, company: 'Bridgelabz Fellowship (Capgemini)', role: 'Software Development Trainee', duration: 'Mar 2026 - Present', desc: '• Selected for an intensive, industry-focused fellowship specializing in advanced Java Full-Stack development.\n• Engineered modular backend microservices, consistently exceeding performance benchmarks.' }
    ],

    projects: [
      { id: 1, name: 'ResumePilot - AI Resume Builder', duration: '2025', desc: '• Architected a full-stack AI-driven SaaS platform for generating ATS-optimized professional resumes.\n• Engineered RESTful APIs utilizing a Microservices architecture, integrating an API Gateway and Service Registry.\n• Secured backend endpoints utilizing Spring Security and JWT.' },
      { id: 2, name: 'Quantity Measurement Application', duration: '2026', desc: '• Developed a scalable, N-Tier full-stack application, seamlessly integrating a dynamic React frontend with a high-performance Java backend.\n• Applied strict Object-Oriented Design (OOD) principles, including abstraction and polymorphism.' }
    ],

    skills: '• Languages: Java, C++, TypeScript, Python\n• Technologies: REST API, JDBC, Microservices, Spring Boot, Spring Security\n• Core: DSA, OOPS, DBMS, System Design\n• Tools & DB: Git, GitHub, Maven, MySQL',
    
    achievements: '• Maintained an exceptional 600+ day problem-solving streak on CodeChef, successfully conquering over 800 challenges.\n• Solved 250+ advanced DSA problems on LeetCode, optimizing for minimal time/space complexities.',
    
    certifications: '• Microsoft Azure Fundamentals (AZ-900) - Microsoft\n• Certified System Administrator - ServiceNow\n• Java Full Stack Development - Talent Next (Wipro)',

    extracurricular: '• Actively preparing for JLPT N5 (Japanese Language Proficiency Test).\n• NSS Member (2022-2024), demonstrating community engagement and cross-functional teamwork.'
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setResumeData({ ...resumeData, [e.target.name]: e.target.value });
  };

  const updateList = (listName: string, id: number, field: string, value: string) => {
    setResumeData({
      ...resumeData,
      [listName]: (resumeData as any)[listName].map((item: any) => item.id === id ? { ...item, [field]: value } : item)
    });
  };

  const addListItem = (listName: string) => {
    let newItem = { id: Date.now() };
    if (listName === 'educations') newItem = { ...newItem, inst: '', degree: '', grade: '', duration: '' };
    if (listName === 'experiences') newItem = { ...newItem, company: '', role: '', duration: '', desc: '' };
    if (listName === 'projects') newItem = { ...newItem, name: '', duration: '', desc: '' };
    setResumeData({ ...resumeData, [listName]: [...(resumeData as any)[listName], newItem] });
  };

  const removeListItem = (listName: string, id: number) => {
    setResumeData({
      ...resumeData,
      [listName]: (resumeData as any)[listName].filter((item: any) => item.id !== id)
    });
  };

  const handleExportPDF = () => { window.print(); };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8082/api/resumes', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: resumeData.title, content: JSON.stringify(resumeData) })
      });
      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert("Save fail ho gaya bhai!");
      }
    } catch (error) {
      alert("Spring Boot server on port 8082 chalu nahi hai!");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-screen flex bg-slate-100 overflow-hidden font-sans print:block print:bg-white print:h-auto">
      
      {/* 1️⃣ LEFT SIDEBAR */}
      <aside className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-6 gap-8 z-10 shadow-sm print:hidden">
        <div className="w-10 h-10 bg-slate-900 rounded-xl text-white flex items-center justify-center font-bold text-xl">R</div>
        <nav className="flex flex-col gap-6 w-full px-4 text-slate-500">
          <button className="p-3 bg-slate-100 text-slate-900 rounded-xl flex justify-center"><FileText size={24} /></button>
          <button className="p-3 hover:bg-slate-50 hover:text-slate-900 rounded-xl flex justify-center transition-colors"><Layout size={24} /></button>
          <button className="p-3 hover:bg-slate-50 hover:text-slate-900 rounded-xl flex justify-center transition-colors"><Settings size={24} /></button>
        </nav>
      </aside>

      {/* 2️⃣ MIDDLE PANEL (Quick Settings) */}
      <section className="w-[380px] bg-white border-r border-slate-200 flex flex-col h-full z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)] relative print:hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50 shrink-0">
          <h2 className="text-xl font-bold text-slate-900">Edit Details</h2>
          <p className="text-sm text-slate-500">Use this form or click the paper directly</p>
        </div>
        <div className="p-5 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
          
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-1">Basic Info & Links</h3>
            <input type="text" name="fullName" value={resumeData.fullName} onChange={handleChange} placeholder="Full Name" className="w-full px-3 py-2 rounded border border-slate-300 focus:border-slate-900 outline-none text-sm font-bold" />
            <div className="grid grid-cols-2 gap-2">
              <input type="text" name="email" value={resumeData.email} onChange={handleChange} placeholder="Email" className="w-full px-3 py-2 rounded border border-slate-300 outline-none text-sm" />
              <input type="text" name="phone" value={resumeData.phone} onChange={handleChange} placeholder="Phone" className="w-full px-3 py-2 rounded border border-slate-300 outline-none text-sm" />
            </div>
            <input type="text" name="location" value={resumeData.location} onChange={handleChange} placeholder="Location" className="w-full px-3 py-2 rounded border border-slate-300 outline-none text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <input type="text" name="linkedinUrl" value={resumeData.linkedinUrl} onChange={handleChange} placeholder="LinkedIn URL" className="w-full px-3 py-2 rounded border border-slate-300 outline-none text-sm" />
              <input type="text" name="githubUrl" value={resumeData.githubUrl} onChange={handleChange} placeholder="GitHub URL" className="w-full px-3 py-2 rounded border border-slate-300 outline-none text-sm" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center border-b pb-1">
              <h3 className="text-sm font-bold text-slate-800">Experience</h3>
              <button onClick={() => addListItem('experiences')} className="text-slate-600 hover:text-slate-900 flex items-center gap-1 text-xs font-bold bg-slate-100 px-2 py-1 rounded"><Plus size={12} /> Add</button>
            </div>
            {resumeData.experiences.map((exp) => (
              <div key={exp.id} className="p-3 border border-slate-200 rounded bg-slate-50 relative group space-y-2">
                <button onClick={() => removeListItem('experiences', exp.id)} className="absolute top-2 right-2 text-rose-400 hover:text-rose-600 opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                <input type="text" value={exp.company} onChange={(e) => updateList('experiences', exp.id, 'company', e.target.value)} placeholder="Company" className="w-full px-2 py-1.5 rounded border border-slate-300 text-sm outline-none font-bold" />
                <input type="text" value={exp.role} onChange={(e) => updateList('experiences', exp.id, 'role', e.target.value)} placeholder="Role" className="w-full px-2 py-1.5 rounded border border-slate-300 text-sm outline-none" />
                <textarea value={exp.desc} onChange={(e) => updateList('experiences', exp.id, 'desc', e.target.value)} placeholder="Description (use bullets)" rows={2} className="w-full px-2 py-1.5 rounded border border-slate-300 text-sm outline-none resize-none" />
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center border-b pb-1">
              <h3 className="text-sm font-bold text-slate-800">Projects</h3>
              <button onClick={() => addListItem('projects')} className="text-slate-600 hover:text-slate-900 flex items-center gap-1 text-xs font-bold bg-slate-100 px-2 py-1 rounded"><Plus size={12} /> Add</button>
            </div>
            {resumeData.projects.map((proj) => (
              <div key={proj.id} className="p-3 border border-slate-200 rounded bg-slate-50 relative group space-y-2">
                <button onClick={() => removeListItem('projects', proj.id)} className="absolute top-2 right-2 text-rose-400 hover:text-rose-600 opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                <input type="text" value={proj.name} onChange={(e) => updateList('projects', proj.id, 'name', e.target.value)} placeholder="Project Name" className="w-full px-2 py-1.5 rounded border border-slate-300 text-sm outline-none font-bold" />
                <textarea value={proj.desc} onChange={(e) => updateList('projects', proj.id, 'desc', e.target.value)} placeholder="Description" rows={2} className="w-full px-2 py-1.5 rounded border border-slate-300 text-sm outline-none resize-none" />
              </div>
            ))}
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
            <strong>Tip:</strong> Baki saare sections (Objective, Education, Skills) ko direct A4 paper par click karke edit karna fast hoga!
          </div>

        </div>
      </section>

      {/* 3️⃣ RIGHT PANEL (Live ATS Canvas) */}
      <main className="flex-1 bg-slate-300 flex flex-col relative print:bg-white print:block">
        
        {/* TOP BAR */}
        <header className="h-14 border-b border-slate-300 bg-white flex items-center justify-between px-8 sticky top-0 z-20 print:hidden shadow-sm">
          <div className="flex items-center gap-4">
            <span className="bg-slate-100 text-slate-800 px-3 py-1 rounded text-xs font-bold flex items-center gap-1 border border-slate-200">
              <span className="w-2 h-2 bg-slate-500 rounded-full"></span> 1-Page Optimized
            </span>
            {saveSuccess && <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded"><CheckCircle2 size={14} /> Saved</span>}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleSave} disabled={isSaving} className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 px-4 py-1.5 rounded text-sm font-bold flex items-center gap-2 transition-all">
              {isSaving ? <Loader2 size={16} className="animate-spin text-slate-800" /> : <Save size={16} />} Save Draft
            </button>
            <button onClick={handleExportPDF} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-1.5 rounded text-sm font-bold flex items-center gap-2 transition-all shadow">
              <Download size={16} /> Download PDF
            </button>
          </div>
        </header>

        {/* 🚀 THE ATS COMPACT PAPER 🚀 */}
        <div className="flex-1 overflow-y-auto py-8 flex justify-center items-start print:p-0 print:overflow-visible">
          {/* Changed padding from py-12 px-14 to py-8 px-10 for maximum space utilization */}
          <div className="bg-white w-[210mm] min-h-[297mm] shadow-xl rounded-sm py-8 px-10 transition-all ring-1 ring-slate-200 print:shadow-none print:ring-0 print:m-0 print:w-full print:h-full">
            
            {/* Header: Super Compact */}
            <div className="text-center mb-3">
              <h1 className="text-3xl font-serif text-slate-950 font-bold uppercase tracking-wide outline-none hover:bg-slate-50 rounded px-2 print:hover:bg-transparent" contentEditable suppressContentEditableWarning onBlur={(e) => setResumeData({...resumeData, fullName: e.currentTarget.textContent || ''})}>{resumeData.fullName}</h1>
              <div className="flex justify-center flex-wrap gap-x-2 gap-y-0.5 text-xs text-slate-800 mt-1 font-medium">
                <span contentEditable suppressContentEditableWarning onBlur={(e) => setResumeData({...resumeData, phone: e.currentTarget.textContent || ''})} className="outline-none hover:bg-slate-50">{resumeData.phone}</span>
                <span>|</span>
                <span contentEditable suppressContentEditableWarning onBlur={(e) => setResumeData({...resumeData, location: e.currentTarget.textContent || ''})} className="outline-none hover:bg-slate-50">{resumeData.location}</span>
                <span>|</span>
                <span contentEditable suppressContentEditableWarning onBlur={(e) => setResumeData({...resumeData, email: e.currentTarget.textContent || ''})} className="outline-none hover:bg-slate-50">{resumeData.email}</span>
                <span>|</span>
                <a href={resumeData.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline print:text-blue-800 print:underline">
                  <span contentEditable suppressContentEditableWarning onBlur={(e) => setResumeData({...resumeData, linkedinText: e.currentTarget.textContent || ''})} className="outline-none hover:bg-slate-50 print:hover:bg-transparent">{resumeData.linkedinText}</span>
                </a>
                <span>|</span>
                <a href={resumeData.githubUrl} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline print:text-blue-800 print:underline">
                  <span contentEditable suppressContentEditableWarning onBlur={(e) => setResumeData({...resumeData, githubText: e.currentTarget.textContent || ''})} className="outline-none hover:bg-slate-50 print:hover:bg-transparent">{resumeData.githubText}</span>
                </a>
              </div>
            </div>

            {/* Objective */}
            <div className="mb-2.5">
              <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wide border-b border-slate-900 pb-[2px] mb-1.5">Objective</h3>
              <p className="text-[12.5px] text-slate-900 leading-snug outline-none hover:bg-slate-50 rounded print:hover:bg-transparent text-justify whitespace-pre-wrap" contentEditable suppressContentEditableWarning onBlur={(e) => setResumeData({...resumeData, objective: e.currentTarget.textContent || ''})}>{resumeData.objective}</p>
            </div>

            {/* Education */}
            <div className="mb-2.5">
              <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wide border-b border-slate-900 pb-[2px] mb-1.5">Education</h3>
              <div className="space-y-1.5">
                {resumeData.educations.map((edu) => (
                  <div key={edu.id}>
                    <div className="flex justify-between items-baseline">
                      <h4 className="font-bold text-[12.5px] text-slate-900 outline-none hover:bg-slate-50 rounded" contentEditable suppressContentEditableWarning onBlur={(e) => updateList('educations', edu.id, 'inst', e.currentTarget.textContent || '')}>{edu.inst}</h4>
                      <span className="text-[12.5px] font-bold text-slate-900 outline-none hover:bg-slate-50 rounded" contentEditable suppressContentEditableWarning onBlur={(e) => updateList('educations', edu.id, 'duration', e.currentTarget.textContent || '')}>{edu.duration}</span>
                    </div>
                    <div className="flex justify-between items-baseline mt-[1px]">
                      <div className="text-[12.5px] text-slate-800 outline-none hover:bg-slate-50 rounded" contentEditable suppressContentEditableWarning onBlur={(e) => updateList('educations', edu.id, 'degree', e.currentTarget.textContent || '')}>{edu.degree}</div>
                      <div className="text-[12.5px] text-slate-800 outline-none hover:bg-slate-50 rounded" contentEditable suppressContentEditableWarning onBlur={(e) => updateList('educations', edu.id, 'grade', e.currentTarget.textContent || '')}>{edu.grade}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Experience & Training */}
            <div className="mb-2.5">
              <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wide border-b border-slate-900 pb-[2px] mb-1.5">Experience & Training</h3>
              <div className="space-y-2">
                {resumeData.experiences.map((exp) => (
                  <div key={exp.id}>
                    <div className="flex justify-between items-baseline">
                      <h4 className="font-bold text-[12.5px] text-slate-900 outline-none hover:bg-slate-50 rounded" contentEditable suppressContentEditableWarning onBlur={(e) => updateList('experiences', exp.id, 'company', e.currentTarget.textContent || '')}>{exp.company}</h4>
                      <span className="text-[12.5px] font-bold text-slate-900 outline-none hover:bg-slate-50 rounded" contentEditable suppressContentEditableWarning onBlur={(e) => updateList('experiences', exp.id, 'duration', e.currentTarget.textContent || '')}>{exp.duration}</span>
                    </div>
                    <div className="text-[12.5px] text-slate-800 italic mb-0.5 outline-none hover:bg-slate-50 rounded" contentEditable suppressContentEditableWarning onBlur={(e) => updateList('experiences', exp.id, 'role', e.currentTarget.textContent || '')}>{exp.role}</div>
                    <div className="text-[12.5px] text-slate-900 leading-snug whitespace-pre-wrap outline-none hover:bg-slate-50 rounded" contentEditable suppressContentEditableWarning onBlur={(e) => updateList('experiences', exp.id, 'desc', e.currentTarget.textContent || '')}>{exp.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Projects */}
            <div className="mb-2.5">
              <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wide border-b border-slate-900 pb-[2px] mb-1.5">Projects</h3>
              <div className="space-y-2">
                {resumeData.projects.map((proj) => (
                  <div key={proj.id}>
                    <div className="flex justify-between items-baseline mb-[1px]">
                      <h4 className="font-bold text-[12.5px] text-slate-900 outline-none hover:bg-slate-50 rounded" contentEditable suppressContentEditableWarning onBlur={(e) => updateList('projects', proj.id, 'name', e.currentTarget.textContent || '')}>{proj.name}</h4>
                      <span className="text-[12.5px] font-bold text-slate-900 outline-none hover:bg-slate-50 rounded" contentEditable suppressContentEditableWarning onBlur={(e) => updateList('projects', proj.id, 'duration', e.currentTarget.textContent || '')}>{proj.duration}</span>
                    </div>
                    <div className="text-[12.5px] text-slate-900 leading-snug whitespace-pre-wrap outline-none hover:bg-slate-50 rounded" contentEditable suppressContentEditableWarning onBlur={(e) => updateList('projects', proj.id, 'desc', e.currentTarget.textContent || '')}>{proj.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="mb-2.5">
              <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wide border-b border-slate-900 pb-[2px] mb-1.5">Skills</h3>
              <div className="text-[12.5px] text-slate-900 leading-snug whitespace-pre-wrap outline-none hover:bg-slate-50 rounded" contentEditable suppressContentEditableWarning onBlur={(e) => setResumeData({...resumeData, skills: e.currentTarget.textContent || ''})}>{resumeData.skills}</div>
            </div>

            {/* Achievements */}
            <div className="mb-2.5">
              <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wide border-b border-slate-900 pb-[2px] mb-1.5">Achievements</h3>
              <div className="text-[12.5px] text-slate-900 leading-snug whitespace-pre-wrap outline-none hover:bg-slate-50 rounded" contentEditable suppressContentEditableWarning onBlur={(e) => setResumeData({...resumeData, achievements: e.currentTarget.textContent || ''})}>{resumeData.achievements}</div>
            </div>

            {/* Certifications & Extracurricular side by side to save space */}
            <div className="flex gap-6">
              <div className="flex-1">
                <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wide border-b border-slate-900 pb-[2px] mb-1.5">Certifications</h3>
                <div className="text-[12.5px] text-slate-900 leading-snug whitespace-pre-wrap outline-none hover:bg-slate-50 rounded" contentEditable suppressContentEditableWarning onBlur={(e) => setResumeData({...resumeData, certifications: e.currentTarget.textContent || ''})}>{resumeData.certifications}</div>
              </div>
              <div className="flex-1">
                <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wide border-b border-slate-900 pb-[2px] mb-1.5">Extracurricular</h3>
                <div className="text-[12.5px] text-slate-900 leading-snug whitespace-pre-wrap outline-none hover:bg-slate-50 rounded" contentEditable suppressContentEditableWarning onBlur={(e) => setResumeData({...resumeData, extracurricular: e.currentTarget.textContent || ''})}>{resumeData.extracurricular}</div>
              </div>
            </div>

          </div>
        </div>
      </main>

    </div>
  );
};

export default ResumeWorkspace;