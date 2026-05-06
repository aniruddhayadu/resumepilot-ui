export interface Job {
  title: string;
  company: string;
  location: string;
  url: string;
}

export interface AiAnalysis {
  matchScore: number;
  missingSkills: string;
  recommendations: string;
}