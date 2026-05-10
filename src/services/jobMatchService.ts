import axios from 'axios';
import type { AiAnalysis, Job } from '../types/jobMatch';

const JOB_MATCH_BASE_URL = (import.meta.env.VITE_JOB_MATCH_BASE_URL || '/api/jobmatch').replace(/\/$/, '');

const cleanText = (value: unknown, fallback = ''): string => {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text || ['null', 'undefined', 'n/a', 'na'].includes(text.toLowerCase())) return fallback;
  return text;
};

export const fetchJobs = async (jobTitle: string, location: string): Promise<Job[]> => {
  const response = await axios.post(`${JOB_MATCH_BASE_URL}/fetchLinkedIn`, {
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
  const response = await axios.post(`${JOB_MATCH_BASE_URL}/analyze/${resumeId}`, {
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
