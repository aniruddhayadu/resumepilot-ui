export interface Resume {
  id: number;
  title: string;
  fullName?: string;
  templateId?: number;
  summary: string;
  skills: string;
  experience: string;
  education: string;
  content?: string; 
}

export interface ResumePayload {
  title: string;
  content: string;
}

const BASE_URL = import.meta.env.VITE_RESUME_BASE_URL || 'http://localhost:8082';

export const fetchUserResumes = async (email: string, fallback: string): Promise<Resume[]> => {
  const res = await fetch(`${BASE_URL}/resume/my-resumes`, {
    method: 'GET',
    headers: { 'User-Email': email },
  });

  if (!res.ok) throw new Error('Fetch failed');

  const raw = await res.json();

  return raw.map((r: any) => {
    let pContent: any = {};
    try {
        if (r.content) pContent = JSON.parse(r.content);
    } catch (e) {}

    return {
      id: r.id,
      title: r.title,
      fullName: pContent.fullName || fallback,
      templateId: Number(pContent.templateId) || 1,
      summary: pContent.summary || pContent.objective || '',
      skills: pContent.skills || '',
      experience: pContent.experience || '',
      education: pContent.education || '',
      content: r.content 
    };
  });
};

export const deleteResume = async (id: number, email: string): Promise<void> => {
  const res = await fetch(`${BASE_URL}/resume/delete/${id}`, {
    method: 'DELETE',
    headers: { 'User-Email': email },
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
};

export const saveResume = async (payload: ResumePayload, email: string, id?: number): Promise<void> => {
  const isUpd = Boolean(id);
  const url = isUpd ? `${BASE_URL}/resume/update/${id}` : `${BASE_URL}/resume/create`;
  
  const res = await fetch(url, {
    method: isUpd ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Email': email },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error('Save failed');
};