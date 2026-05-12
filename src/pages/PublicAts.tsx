import React, { useState } from 'react';
import { extractTextFromPdf, checkAtsScore } from '../services/aiService';
import { UploadCloud, Activity, CheckCircle2 } from 'lucide-react';

const PublicAts: React.FC = () => {
  const [extJobTitle, setExtJobTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extAtsData, setExtAtsData] = useState<{score: number, feedback: string} | null>(null);
  const [isExtAnalyzing, setIsExtAnalyzing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleExternalATSCheck = async () => {
    if (!extJobTitle.trim() || !selectedFile) {
      alert('Please enter a Job Title and upload a PDF Resume!');
      return;
    }
    setIsExtAnalyzing(true);
    setExtAtsData(null);
    try {
      const extractedText = await extractTextFromPdf(selectedFile);
      const result = await checkAtsScore(extJobTitle, extractedText);
      setExtAtsData(result);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Analysis failed. Ensure AI Service is running.');
    } finally {
      setIsExtAnalyzing(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.20),_transparent_34%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] px-4 py-12 text-slate-100 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl animate-fadeIn rounded-3xl border border-white/10 bg-slate-900/75 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-10">
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-300/20 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-100">
            <Activity className="h-4 w-4" /> Free AI-Powered Analysis
          </div>
          <h2 className="mb-4 text-4xl font-extrabold text-white sm:text-5xl">ATS Resume Analyzer</h2>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-400">
            Check how well your resume matches any job role with AI. See exactly what employers will see. No signup needed.
          </p>
        </div>

        {extAtsData && (
          <div className="mb-8 flex flex-col items-center gap-8 rounded-2xl border border-purple-300/20 bg-purple-500/10 p-8 shadow-lg animate-slideUp md:flex-row">
            <div className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full border-4 border-purple-300/30 bg-slate-950 shadow-lg">
              <svg className="absolute inset-0 h-full w-full -rotate-90 transform">
                <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-800" />
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={301.6}
                  strokeDashoffset={301.6 - (301.6 * extAtsData.score) / 100}
                  className={`transition-all duration-1000 ${extAtsData.score > 75 ? 'text-emerald-400' : extAtsData.score > 50 ? 'text-amber-400' : 'text-rose-400'}`}
                />
              </svg>
              <span className="text-4xl font-black text-white">{extAtsData.score}</span>
            </div>
            <div className="flex-1">
              <h3 className="mb-3 flex items-center gap-3 text-2xl font-bold text-white">
                <CheckCircle2 className="h-6 w-6 text-purple-300" /> AI Analysis Complete
              </h3>
              <p className="text-base leading-relaxed text-slate-300">{extAtsData.feedback}</p>
              <div className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-400">
                <span className="inline-block h-2 w-2 rounded-full bg-purple-400" />
                Score: {extAtsData.score > 75 ? 'Excellent' : extAtsData.score > 50 ? 'Good' : 'Needs Improvement'}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-7">
          <div className="animate-slideInLeft">
            <label className="mb-3 block text-sm font-bold uppercase tracking-wider text-slate-400">Target Job Role</label>
            <input
              type="text"
              placeholder="e.g., Senior Full-Stack Developer"
              value={extJobTitle}
              onChange={(e) => setExtJobTitle(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3.5 text-white outline-none transition-all placeholder:text-slate-600 hover:border-slate-600 focus:border-purple-400 focus:ring-4 focus:ring-purple-500/15"
            />
          </div>

          <div className="animate-slideInRight">
            <label className="mb-3 block text-sm font-bold uppercase tracking-wider text-slate-400">Upload Resume (PDF)</label>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files?.[0]?.type === 'application/pdf') setSelectedFile(e.dataTransfer.files[0]);
              }}
              className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-300 ${isDragging ? 'scale-105 border-purple-400 bg-purple-500/15' : selectedFile ? 'border-purple-400 bg-purple-500/10' : 'border-slate-700 hover:border-slate-500 hover:bg-white/5'}`}
            >
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
              />
              <UploadCloud className={`mx-auto mb-4 h-14 w-14 transition-all ${selectedFile ? 'text-purple-300' : 'text-slate-500'} ${isDragging ? 'scale-125' : ''}`} />
              <p className="text-lg font-bold text-slate-100">{selectedFile ? `Selected: ${selectedFile.name}` : 'Drop PDF or Click to Upload'}</p>
              <p className="mt-2 text-sm text-slate-500">PDF format only - Max 10MB</p>
            </div>
          </div>

          <button
            onClick={handleExternalATSCheck}
            disabled={isExtAnalyzing || !extJobTitle || !selectedFile}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 font-bold text-white shadow-lg shadow-purple-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Activity className={`h-5 w-5 ${isExtAnalyzing ? 'animate-spin' : ''}`} />
            {isExtAnalyzing ? 'Analyzing Your Resume...' : 'Scan Resume Score'}
          </button>

          <p className="text-center text-xs font-medium text-slate-500">
            Tip: Your resume will be analyzed instantly. Results are never stored or shared.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicAts;
