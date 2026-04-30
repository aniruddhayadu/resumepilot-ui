// Pura file replace kar de isse
const AI_BASE_URL = 'http://localhost:8085/ai';

export const generateSummaryWithAI = async (jobTitle: string): Promise<string> => {
  const response = await fetch(`${AI_BASE_URL}/generate-summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobTitle }),
  });
  if (!response.ok) throw new Error('Failed to generate summary');
  const data = await response.json();
  return data.generatedSummary;
};

export const checkAtsScore = async (jobTitle: string, resumeContent: string): Promise<{score: number, feedback: string}> => {
  const response = await fetch(`${AI_BASE_URL}/analyze-ats`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobTitle, resumeContent }),
  });
  
  if (!response.ok) throw new Error('Failed to analyze ATS score');
  
  const textResponse = await response.text();
  try {
    return JSON.parse(textResponse); 
  } catch (e) {
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
  
  if (!response.ok) throw new Error('Failed to extract text from PDF');
  
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  
  return data.text;
};