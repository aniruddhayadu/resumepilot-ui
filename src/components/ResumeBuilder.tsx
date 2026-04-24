import React, { useState, useEffect } from 'react';
import { saveResume } from '../services/resumeService';
import { generateSummaryWithAI } from '../services/aiService'; // 👈 Naya Import
import type { Resume, ResumePayload } from '../types/resume';
import { getUserEmail } from '../utils/storage';
import { CheckCircle2, Sparkles, X, Zap } from 'lucide-react'; // 👈 Zap icon for AI speed

interface ResumeBuilderProps {
  existingResume?: Resume | null;
  onSuccessReturn: () => void;
}

const ResumeBuilder: React.FC<ResumeBuilderProps> = ({ existingResume, onSuccessReturn }) => {
  const [fullName, setFullName] = useState('');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('');
  const [education, setEducation] = useState('');
  
  const [statusMessage, setStatusMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // 👈 AI Loading State
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  useEffect(() => {
    if (existingResume) {
      setFullName(existingResume.fullName || '');
      setTitle(existingResume.title || '');
      setSummary(existingResume.summary || '');
      setSkills(existingResume.skills || '');
      setExperience(existingResume.experience || '');
      setEducation(existingResume.education || '');
    }
  }, [existingResume]);

  // 👈 THE AI ENGINE HANDLER
  const handleAIGenerate = async () => {
    if (!title.trim()) {
      setStatusMessage('Please enter a Resume Title first so AI knows what to write!');
      setIsSuccess(false);
      return;
    }

    setIsGeneratingAI(true);
    setStatusMessage('Groq AI is thinking... ⚡');
    setIsSuccess(true);

    try {
      const generatedText = await generateSummaryWithAI(title);
      setSummary(generatedText);
      setStatusMessage('AI Summary generated successfully! ✨');
      setIsSuccess(true);
    } catch (err) {
      setStatusMessage('Failed to connect to AI Service. Ensure port 8085 is running.');
      setIsSuccess(false);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage('');

    const resumeContentObj = { fullName, summary, skills, experience, education };
    const payload: ResumePayload = {
      title,
      content: JSON.stringify(resumeContentObj)
    };

    const userEmail = getUserEmail();
    const isUpdating = !!existingResume?.id;
    
    try {
      await saveResume(payload, userEmail, existingResume?.id);
      setStatusMessage(isUpdating ? 'Resume updated successfully!' : 'Resume saved successfully!');
      setIsSuccess(true);
      setTimeout(() => { onSuccessReturn(); }, 1500);
    } catch {
      setStatusMessage('Failed to save resume. Ensure Resume Service (8082) is running.');
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-2 max-w-5xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <div className="border-b border-slate-200/80 bg-gradient-to-r from-slate-950 to-slate-800 px-6 py-6 text-white sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-200">
              <Sparkles className="h-3.5 w-3.5 text-teal-300" />
              Resume editor
            </div>
            <h2 className="mt-4 font-['Space_Grotesk'] text-3xl font-bold tracking-tight sm:text-4xl">
              {existingResume ? 'Edit Resume' : 'Create New Resume'}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Keep the content focused and export-ready. Each section is structured for clean preview and print output.
            </p>
          </div>
          <button onClick={onSuccessReturn} className="inline-flex items-center gap-2 self-start rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15">
            <X className="h-4 w-4" />
            Cancel
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className={`mx-6 mt-6 rounded-2xl border px-4 py-3 text-sm font-medium sm:mx-8 ${isSuccess ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
          <div className="flex items-center gap-2">
            {isSuccess ? <CheckCircle2 className="h-4 w-4" /> : <X className="h-4 w-4" />}
            <span>{statusMessage}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6 sm:px-8 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g., Virat Kohli"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Resume Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Senior Java Developer"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>

            <div>
              {/* 👈 MAGIC BUTTON INTEGRATION YAHAN HAI */}
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-semibold text-slate-700">Professional Summary</label>
                <button
                  type="button"
                  onClick={handleAIGenerate}
                  disabled={isGeneratingAI || !title}
                  className="group inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-teal-400 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:scale-105 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-sm"
                >
                  <Zap className={`h-3 w-3 ${isGeneratingAI ? 'animate-pulse' : 'transition group-hover:scale-110'}`} />
                  {isGeneratingAI ? 'Generating...' : 'Generate with AI'}
                </button>
              </div>
              <textarea
                rows={5}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Brief overview of your career and goals..."
                className={`w-full resize-none rounded-2xl border bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 ${isGeneratingAI ? 'border-indigo-300 shadow-inner' : 'border-slate-200'}`}
              />
            </div>
          </div>

          <div className="space-y-6 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Technical Skills</label>
              <textarea
                rows={5}
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="Java, Spring Boot, React, MySQL..."
                className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Experience</label>
                <textarea
                  rows={8}
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="Company Name, Role, Dates, Achievements..."
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Education</label>
                <textarea
                  rows={8}
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  placeholder="Degree, University, Graduation Year..."
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">Your changes are saved to the resume service when you submit.</p>
          <button
            type="submit"
            disabled={isLoading || isGeneratingAI}
            className={`inline-flex items-center justify-center rounded-2xl px-6 py-3.5 font-semibold text-white shadow-lg shadow-slate-950/15 transition ${isLoading || isGeneratingAI ? 'cursor-not-allowed bg-indigo-400' : 'bg-slate-950 hover:-translate-y-0.5 hover:bg-indigo-600'}`}
          >
            {isLoading ? 'Saving...' : (existingResume ? 'Update Resume' : 'Save Resume')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResumeBuilder;