import api from '../api/api';
import type { AiAnalysis, Job } from '../types/jobMatch';

const cleanText = (value: unknown, fallback = ''): string => {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text || ['null', 'undefined', 'n/a', 'na'].includes(text.toLowerCase())) return fallback;
  return text;
};

export const fetchJobs = async (jobTitle: string, location: string): Promise<Job[]> => {
  const response = await api.post('/api/jobmatch/fetchLinkedIn', {
    jobTitle,
    location,
  });

  const jobs = Array.isArray(response.data) ? response.data : response.data?.jobs || [];

  return jobs.map((job: any) => ({
    title: cleanText(job.title || job.jobTitle, 'Untitled Role'),
    company: cleanText(job.company || job.companyName, 'Unknown Company'),
    location: cleanText(job.location, cleanText(location, 'Remote')),
    url: cleanText(job.url || job.link, '#'),
  }));
};

export const analyzeMatch = async (
  resumeId: number,
  userId: number,
  jobTitle: string,
  jobDescription: string,
  resumeContent: string,
): Promise<AiAnalysis> => {
  const response = await api.post(`/api/jobmatch/analyze/${resumeId}`, {
    userId,
    jobTitle,
    jobDescription,
    resumeContent,
  });

  const data = response.data || {};

  return {
    matchScore: Number(data.matchScore ?? data.score ?? 0),
    missingSkills: data.missingSkills ?? '',
    recommendations: data.recommendations ?? '',
  };
};
