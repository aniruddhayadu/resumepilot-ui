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
      alert("Analysis failed. Ensure AI Service is running.");
    } finally {
      setIsExtAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full bg-white/70 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl border border-slate-200/60 animate-fadeIn">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 mb-4">
            <Activity className="w-4 h-4" /> Free AI-Powered Analysis
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-slate-900 to-purple-900 bg-clip-text text-transparent mb-4">ATS Resume Analyzer</h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed">Check how well your resume matches any job role with AI. See exactly what employers will see. No signup needed.</p>
        </div>

        {extAtsData && (
          <div className="mb-8 p-8 bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 border border-purple-200/60 rounded-2xl flex flex-col md:flex-row gap-8 items-center animate-slideUp shadow-lg">
            <div className="relative w-32 h-32 shrink-0 flex items-center justify-center rounded-full bg-white shadow-lg border-4 border-purple-200">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-purple-100" />
                <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="4" fill="transparent" 
                  strokeDasharray={301.6} strokeDashoffset={301.6 - (301.6 * extAtsData.score) / 100} 
                  className={`transition-all duration-1000 ${extAtsData.score > 75 ? 'text-emerald-500' : extAtsData.score > 50 ? 'text-amber-500' : 'text-rose-500'}`} />
              </svg>
              <span className="text-4xl font-black text-slate-800">{extAtsData.score}</span>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3 mb-3">
                <CheckCircle2 className="w-6 h-6 text-purple-600" /> AI Analysis Complete
              </h3>
              <p className="text-slate-700 text-base leading-relaxed">{extAtsData.feedback}</p>
              <div className="mt-4 text-xs font-medium text-slate-600 flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-purple-600 rounded-full"></span>
                Score: {extAtsData.score > 75 ? 'Excellent' : extAtsData.score > 50 ? 'Good' : 'Needs Improvement'}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-7">
          <div className="animate-slideInLeft">
            <label className="block text-sm font-bold uppercase tracking-wider text-slate-600 mb-3">Target Job Role</label>
            <input type="text" placeholder="e.g., Senior Full-Stack Developer" value={extJobTitle} onChange={(e) => setExtJobTitle(e.target.value)}
              className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3.5 text-slate-900 outline-none transition-all focus:border-purple-400 focus:ring-4 focus:ring-purple-500/15 focus:bg-slate-50 hover:border-slate-300" />
          </div>
          
          <div className="animate-slideInRight">
            <label className="block text-sm font-bold uppercase tracking-wider text-slate-600 mb-3">Upload Resume (PDF)</label>
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDrop={(e) => {
                e.preventDefault(); setIsDragging(false);
                if (e.dataTransfer.files?.[0]?.type === 'application/pdf') setSelectedFile(e.dataTransfer.files[0]);
              }}
              className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer ${isDragging ? 'border-purple-600 bg-purple-100 scale-105' : selectedFile ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-blue-50' : 'border-slate-300 hover:border-slate-400'}`}
            >
              <input type="file" accept=".pdf" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <UploadCloud className={`w-14 h-14 mx-auto mb-4 transition-all ${selectedFile ? 'text-purple-600' : 'text-slate-400'} ${isDragging ? 'scale-125' : ''}`} />
              <p className="font-bold text-slate-800 text-lg">{selectedFile ? '✓ ' + selectedFile.name : 'Drop PDF or Click to Upload'}</p>
              <p className="text-slate-500 text-sm mt-2">PDF format only • Max 10MB</p>
            </div>
          </div>

          <button 
            onClick={handleExternalATSCheck} disabled={isExtAnalyzing || !extJobTitle || !selectedFile}
            className="w-full bg-gradient-to-r from-slate-900 to-purple-900 hover:to-purple-800 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-xl hover:shadow-purple-500/30 active:scale-95"
          >
            <Activity className={`w-5 h-5 ${isExtAnalyzing ? 'animate-spin' : ''}`} />
            {isExtAnalyzing ? 'Analyzing Your Resume...' : 'Scan Resume Score'}
          </button>

          <p className="text-center text-xs text-slate-500 font-medium">💡 Tip: Your resume will be analyzed instantly. Results are never stored or shared.</p>
        </div>
      </div>
    </div>
  );
};

export default PublicAts;