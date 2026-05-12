import api from '../api/api';

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

export const fetchUserResumes = async (email: string, fallback: string): Promise<Resume[]> => {
  const res = await api.get('/resume/my-resumes', {
    headers: { 'User-Email': email },
  });

  const raw = res.data;

  return raw.map((r: any) => {
    let pContent: any = {};
    try {
        if (r.content) pContent = JSON.parse(r.content);
    } catch {
      pContent = {};
    }

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
  await api.delete(`/resume/delete/${id}`, {
    headers: { 'User-Email': email },
  });
};

export const saveResume = async (payload: ResumePayload, email: string, id?: number): Promise<void> => {
  const isUpd = Boolean(id);
  const url = isUpd ? `/resume/update/${id}` : '/resume/create';

  if (isUpd) {
    await api.put(url, payload, { headers: { 'User-Email': email } });
    return;
  }

  await api.post(url, payload, { headers: { 'User-Email': email } });
};
