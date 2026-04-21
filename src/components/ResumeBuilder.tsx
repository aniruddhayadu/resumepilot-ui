import React, { useState, useEffect } from 'react';

// Define the shape of the data we expect
interface ResumeData {
  id?: number;
  title: string;
  summary: string;
  skills: string;
  experience: string;
  education: string;
}

interface ResumeBuilderProps {
  existingResume?: ResumeData | null;
  onSuccessReturn: () => void;
}

const ResumeBuilder: React.FC<ResumeBuilderProps> = ({ existingResume, onSuccessReturn }) => {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('');
  const [education, setEducation] = useState('');
  
  const [statusMessage, setStatusMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // If we are editing, pre-fill the form with the existing data
  useEffect(() => {
    if (existingResume) {
      setTitle(existingResume.title || '');
      setSummary(existingResume.summary || '');
      setSkills(existingResume.skills || '');
      setExperience(existingResume.experience || '');
      setEducation(existingResume.education || '');
    }
  }, [existingResume]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage('');

    const resumeContentObj = { summary, skills, experience, education };
    const payload = {
      title: title,
      content: JSON.stringify(resumeContentObj)
    };

    const userEmail = localStorage.getItem('userEmail') || 'testuser@capgemini.com';
    
    // Determine if we are updating or creating
    const isUpdating = !!existingResume?.id;
    
    const endpoint = isUpdating 
      ? `http://localhost:8082/resume/update/${existingResume.id}`  
      : 'http://localhost:8082/resume/create';
    const method = isUpdating ? 'PUT' : 'POST';

    try {
      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'User-Email': userEmail 
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setStatusMessage(isUpdating ? 'Resume updated successfully!' : 'Resume saved successfully!');
        setIsSuccess(true);
        
        // Wait 1.5 seconds so the user sees the success message, then return to dashboard
        setTimeout(() => {
          onSuccessReturn();
        }, 1500);
      } else {
        setStatusMessage('Failed to save resume. Server rejected the request.');
        setIsSuccess(false);
      }
    } catch (error) {
      setStatusMessage('Network error. Ensure Resume Service (8082) is running.');
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-2xl shadow-lg border border-gray-100 mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-extrabold text-gray-900">
          {existingResume ? 'Edit Resume' : 'Create New Resume'}
        </h2>
        <button onClick={onSuccessReturn} className="text-gray-500 hover:text-gray-800 font-medium">
          Cancel
        </button>
      </div>
      
      {statusMessage && (
        <div className={`p-4 mb-6 rounded-lg font-medium ${isSuccess ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {statusMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Resume Title</label>
          <input 
            type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Senior Java Developer - Capgemini"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Professional Summary</label>
          <textarea 
            rows={4} value={summary} onChange={(e) => setSummary(e.target.value)}
            placeholder="Brief overview of your career and goals..."
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-gray-900 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Technical Skills</label>
          <textarea 
            rows={3} value={skills} onChange={(e) => setSkills(e.target.value)}
            placeholder="Java, Spring Boot, React, MySQL..."
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-gray-900 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Experience</label>
            <textarea 
              rows={6} value={experience} onChange={(e) => setExperience(e.target.value)}
              placeholder="Company Name, Role, Dates, Achievements..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-gray-900 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Education</label>
            <textarea 
              rows={6} value={education} onChange={(e) => setEducation(e.target.value)}
              placeholder="Degree, University, Graduation Year..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-gray-900 resize-none"
            />
          </div>
        </div>

        <div className="pt-4">
          <button 
            type="submit" disabled={isLoading}
            className={`w-full font-bold py-4 px-8 rounded-xl transition-all shadow-md text-white ${isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg'}`}
          >
            {isLoading ? 'Saving...' : (existingResume ? 'Update Resume' : 'Save Resume')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResumeBuilder;