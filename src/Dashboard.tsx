import React, { useState, useEffect } from 'react';
import ResumeBuilder from './components/ResumeBuilder'; // Path check kar lena

interface Resume {
  id: number;
  fullName?: string; // Naya field
  title: string;
  summary: string;
  skills: string;
  experience: string;
  education: string;
}

const Dashboard: React.FC = () => {
  const userName = localStorage.getItem('userName') || 'User';
  const userEmail = localStorage.getItem('userEmail') || 'testuser@capgemini.com';
  
  const [currentView, setCurrentView] = useState<'dashboard' | 'create' | 'preview' | 'edit'>('dashboard');
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (currentView === 'dashboard') {
      fetchResumes();
    }
  }, [currentView]);

  const fetchResumes = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8082/resume/my-resumes', {
        method: 'GET',
        headers: { 'User-Email': userEmail }
      });

      if (response.ok) {
        const rawData = await response.json();
        
        const formattedResumes = rawData.map((res: any) => {
          let parsedContent = { fullName: '', summary: '', skills: '', experience: '', education: '' };
          if (res.content) {
            try { parsedContent = JSON.parse(res.content); } 
            catch (e) { console.error("Error parsing resume content", e); }
          }
          return {
            id: res.id,
            fullName: parsedContent.fullName || userName, // Agar JSON mein naam hai, wo use karo, warna account ka naam
            title: res.title,
            summary: parsedContent.summary,
            skills: parsedContent.skills,
            experience: parsedContent.experience,
            education: parsedContent.education
          };
        });
        setResumes(formattedResumes);
      } else {
        setError('Failed to fetch resumes. Server returned an error.');
      }
    } catch (err) {
      setError('Unable to connect. Please ensure Resume Service (8082) is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this resume? This cannot be undone.")) return;
    try {
      const response = await fetch(`http://localhost:8082/resume/delete/${id}`, {
        method: 'DELETE',
        headers: { 'User-Email': userEmail }
      });
      if (response.ok) {
        setResumes(resumes.filter(resume => resume.id !== id));
      } else {
        const errorText = await response.text();
        alert(`Server Error ${response.status}: ${errorText}`);
      }
    } catch (err: any) {
      alert(`Network Error: ${err.message}. Ensure Resume Service (8082) is running!`);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
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
    
    alert("Generating your professional PDF... Please wait.");

    try {
      // Hardcoded userId 101 for now, as before
      const response = await fetch(`http://localhost:8083/exports/pdf/${selectedResume.id}/101`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: "professional" }) 
      });

      if (response.ok) {
        const jobData = await response.json();
        if (jobData.fileUrl) {
           window.open(jobData.fileUrl, '_blank');
        } else {
           alert("PDF is still processing. Check back in a minute.");
        }
      } else {
        alert('Failed to generate PDF. Server returned an error.');
      }
    } catch (err) {
      alert('Unable to connect. Please ensure Export Service (8083) is running.');
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans print:bg-white">
      <aside className="w-64 bg-gray-900 text-white flex flex-col shadow-xl print:hidden">
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
            Overview / <span className="text-gray-900 font-medium capitalize">{currentView === 'dashboard' ? 'My Resumes' : currentView.replace('-', ' ')}</span>
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
          
          {currentView === 'preview' && selectedResume && (
             <div className="max-w-4xl mx-auto bg-white p-10 rounded-2xl shadow-lg border border-gray-100 print:shadow-none print:border-none print:p-0 print:max-w-full">
              <div className="flex justify-between items-center mb-8 print:hidden">
                <button onClick={() => setCurrentView('dashboard')} className="text-indigo-600 font-semibold hover:underline flex items-center">
                  &larr; Back to My Resumes
                </button>
                <div className="space-x-4">
                  <button onClick={() => handleEdit(selectedResume)} className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg transition-colors">
                    Edit Info
                  </button>
                  <button onClick={handleDownloadPDF} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-colors inline-flex items-center">
                    Download PDF
                  </button>
                </div>
              </div>
              <div className="print:text-black">
                {/* YAHAN BHI UPDATE KIYA HAI: Display the resume's specific full name */}
                <h1 className="text-5xl font-extrabold text-gray-900 mb-2">{selectedResume.fullName || userName}</h1>
                <h2 className="text-2xl text-gray-600 mb-8 border-b-2 border-gray-800 pb-4">{selectedResume.title}</h2>
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
                        {/* Title dikha rahe hain, naam nahi (Card View mein) */}
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