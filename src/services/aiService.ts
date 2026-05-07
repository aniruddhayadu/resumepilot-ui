const AI_BASE_URL = (import.meta.env.VITE_AI_BASE_URL || '/ai').replace(/\/$/, '');

const getAiHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token')?.replace(/^Bearer\s+/i, '').trim() || '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const getAiErrorMessage = async (response: Response): Promise<string> => {
  const fallback = 'AI service request failed';
  try {
    const data = await response.json();
    return data?.message || data?.error || data?.detail || data?.title || fallback;
  } catch {
    return fallback;
  }
};

export interface SummaryContext {
  skills?: string;
  experience?: string;
  education?: string;
  projects?: string;
  achievements?: string;
  certifications?: string;
}

const normalizeRoleTitle = (jobTitle: string): string => jobTitle.trim().replace(/\s+/g, ' ');

const buildSummaryContext = (context?: SummaryContext): string => {
  if (!context) return '';
  return [
    context.skills && `Skills: ${context.skills}`,
    context.experience && `Experience: ${context.experience}`,
    context.projects && `Projects: ${context.projects}`,
    context.education && `Education: ${context.education}`,
    context.achievements && `Achievements: ${context.achievements}`,
    context.certifications && `Certifications: ${context.certifications}`,
  ].filter(Boolean).join('\n');
};

export const generateSummaryWithAI = async (jobTitle: string, context?: SummaryContext): Promise<string> => {
  const normalizedTitle = normalizeRoleTitle(jobTitle);

  const response = await fetch(`${AI_BASE_URL}/generate-summary`, {
    method: 'POST',
    headers: getAiHeaders(),
    body: JSON.stringify({ jobTitle: normalizedTitle, resumeContent: buildSummaryContext(context) }),
  });
  if (!response.ok) throw new Error(await getAiErrorMessage(response));
  const data = await response.json();
  const generatedSummary = typeof data?.generatedSummary === 'string' ? data.generatedSummary.trim() : '';
  if (!generatedSummary) throw new Error('AI returned an empty summary');
  return generatedSummary;
};

export const checkAtsScore = async (jobTitle: string, resumeContent: string): Promise<{score: number, feedback: string}> => {
  const response = await fetch(`${AI_BASE_URL}/analyze-ats`, {
    method: 'POST',
    headers: getAiHeaders(),
    body: JSON.stringify({ jobTitle, resumeContent }),
  });
  
  if (!response.ok) throw new Error(await getAiErrorMessage(response));
  
  const textResponse = await response.text();
  try {
    const data = JSON.parse(textResponse);
    return {
      score: Number(data?.score ?? 0),
      feedback: typeof data?.feedback === 'string' ? data.feedback : 'No feedback returned.',
    };
  } catch {
    throw new Error('AI returned invalid format');
  }
};

export const extractTextFromPdf = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${AI_BASE_URL}/extract-pdf`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) throw new Error(await getAiErrorMessage(response));
  
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  
  return data.text;
};
