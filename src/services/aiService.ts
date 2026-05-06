const AI_BASE_URL = (import.meta.env.VITE_AI_BASE_URL || '/ai').replace(/\/$/, '');

const getAiHeaders = (): HeadersInit => ({
  'Content-Type': 'application/json',
  'User-Email': localStorage.getItem('userEmail') || '',
  'User-Role': localStorage.getItem('userRole') || 'FREE',
  'Subscription-Plan': localStorage.getItem('subscriptionPlan') || 'FREE',
});

const getAiErrorMessage = async (response: Response): Promise<string> => {
  if (response.status === 429) {
    const limit = response.headers.get('X-AI-Free-Limit') || '5';
    return `Free AI limit reached. You can use AI ${limit} times per day.`;
  }
  const fallback = 'AI service request failed';
  try {
    const data = await response.json();
    return data?.message || data?.error || fallback;
  } catch {
    return fallback;
  }
};

export const generateSummaryWithAI = async (jobTitle: string): Promise<string> => {
  const response = await fetch(`${AI_BASE_URL}/generate-summary`, {
    method: 'POST',
    headers: getAiHeaders(),
    body: JSON.stringify({ jobTitle }),
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
