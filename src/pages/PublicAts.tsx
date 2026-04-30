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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full bg-white p-10 rounded-2xl shadow-xl border border-gray-200">
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Free AI ATS Analyzer</h2>
          <p className="text-gray-500 text-lg">Check your resume's compatibility with any job role instantly. No login required.</p>
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
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Upload Resume (PDF)</label>
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDrop={(e) => {
                e.preventDefault(); setIsDragging(false);
                if (e.dataTransfer.files?.[0]?.type === 'application/pdf') setSelectedFile(e.dataTransfer.files[0]);
              }}
              className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all ${isDragging ? 'border-purple-600 bg-purple-100' : selectedFile ? 'border-purple-500 bg-purple-50' : 'border-slate-300'}`}
            >
              <input type="file" accept=".pdf" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <UploadCloud className={`w-12 h-12 mx-auto mb-3 ${selectedFile ? 'text-purple-600' : 'text-slate-400'}`} />
              <p className="font-bold text-slate-700 text-lg">{selectedFile ? selectedFile.name : "Drop PDF Here or Click to Upload"}</p>
            </div>
          </div>

          <button 
            onClick={handleExternalATSCheck} disabled={isExtAnalyzing || !extJobTitle || !selectedFile}
            className="w-full bg-slate-900 hover:bg-purple-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
          >
            <Activity className={`w-5 h-5 ${isExtAnalyzing ? 'animate-spin' : ''}`} />
            {isExtAnalyzing ? 'Analyzing Score...' : 'Scan Resume'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublicAts;