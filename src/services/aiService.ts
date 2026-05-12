import api from '../api/api';

const getAiErrorMessage = (error: unknown): string => {
  const fallback = 'AI service request failed';
  const data = (error as any)?.response?.data;
  return data?.message || data?.error || data?.detail || data?.title || (error as any)?.message || fallback;
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

  let data: any;
  try {
    const response = await api.post('/ai/generate-summary', { jobTitle: normalizedTitle, resumeContent: buildSummaryContext(context) });
    data = response.data;
  } catch (error) {
    throw new Error(getAiErrorMessage(error));
  }
  const generatedSummary = typeof data?.generatedSummary === 'string' ? data.generatedSummary.trim() : '';
  if (!generatedSummary) throw new Error('AI returned an empty summary');
  return generatedSummary;
};

export const checkAtsScore = async (jobTitle: string, resumeContent: string): Promise<{score: number, feedback: string}> => {
  let textResponse = '';
  try {
    const response = await api.post('/ai/analyze-ats', { jobTitle, resumeContent }, { responseType: 'text' });
    textResponse = response.data;
    const data = typeof textResponse === 'string' ? JSON.parse(textResponse) : textResponse;
    return {
      score: Number(data?.score ?? 0),
      feedback: typeof data?.feedback === 'string' ? data.feedback : 'No feedback returned.',
    };
  } catch (error) {
    if (!textResponse) throw new Error(getAiErrorMessage(error));
    throw new Error('AI returned invalid format');
  }
};

export const extractTextFromPdf = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  let data: any;
  try {
    const response = await api.post('/ai/extract-pdf', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    data = response.data;
  } catch (error) {
    throw new Error(getAiErrorMessage(error));
  }
  if (data.error) throw new Error(data.error);
  
  return data.text;
};
