import type { RawResume, Resume, ResumeContent, ResumePayload } from '../types/resume';

const RESUME_BASE_URL = import.meta.env.VITE_RESUME_BASE_URL || '';

const parseResumeContent = (content?: string): ResumeContent => {
  if (!content) {
    return {
      fullName: '',
      summary: '',
      skills: '',
      experience: '',
      education: '',
    };
  }

  try {
    return JSON.parse(content) as ResumeContent;
  } catch {
    return {
      fullName: '',
      summary: '',
      skills: '',
      experience: '',
      education: '',
    };
  }
};

export const fetchUserResumes = async (userEmail: string, fallbackName: string): Promise<Resume[]> => {
  const response = await fetch(`${RESUME_BASE_URL}/resume/my-resumes`, {
    method: 'GET',
    headers: { 'User-Email': userEmail },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch resumes. Server returned an error.');
  }

  const rawData = (await response.json()) as RawResume[];

  return rawData.map((resume) => {
    const content = parseResumeContent(resume.content);
    return {
      id: resume.id,
      title: resume.title,
      fullName: content.fullName || fallbackName,
      summary: content.summary,
      skills: content.skills,
      experience: content.experience,
      education: content.education,
    };
  });
};

export const deleteResume = async (id: number, userEmail: string): Promise<void> => {
  const response = await fetch(`${RESUME_BASE_URL}/resume/delete/${id}`, {
    method: 'DELETE',
    headers: { 'User-Email': userEmail },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Server Error ${response.status}: ${errorText}`);
  }
};

export const saveResume = async (
  payload: ResumePayload,
  userEmail: string,
  resumeId?: number,
): Promise<void> => {
  const isUpdate = Boolean(resumeId);
  const endpoint = isUpdate
    ? `${RESUME_BASE_URL}/resume/update/${resumeId}`
    : `${RESUME_BASE_URL}/resume/create`;

  const response = await fetch(endpoint, {
    method: isUpdate ? 'PUT' : 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Email': userEmail,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to save resume. Server rejected the request.');
  }
};
