export const generateSummaryWithAI = async (jobTitle: string): Promise<string> => {
  // Vite proxy '/ai' ko use karega backend (8085) se connect karne ke liye
  const response = await fetch('/ai/generate-summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobTitle }),
  });

  if (!response.ok) {
    throw new Error('Failed to connect to AI Service. Is port 8085 running?');
  }

  const data = await response.json();
  return data.generatedSummary;
};