import axios from 'axios';
import type { AiAnalysis, Job } from '../types/jobMatch';

const JOB_MATCH_BASE_URL = 'http://localhost:8087/job-matches';

export const fetchJobs = async (jobTitle: string, location: string): Promise<Job[]> => {
  const response = await axios.post(`${JOB_MATCH_BASE_URL}/fetchLinkedIn`, {
    jobTitle,
    location,
  });

  const jobs = Array.isArray(response.data) ? response.data : response.data?.jobs || [];

  return jobs.map((job: any) => ({
    title: job.title || job.jobTitle || 'Untitled Role',
    company: job.company || job.companyName || 'Unknown Company',
    location: job.location || 'Remote',
    url: job.url || job.link || '#',
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