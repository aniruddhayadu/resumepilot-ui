import React, { useEffect, useMemo, useState } from 'react';
import { Activity, BriefcaseBusiness, MapPin, Search, Sparkles, ExternalLink, Brain, Loader2, AlertCircle, CheckCircle2, Lightbulb, TriangleAlert } from 'lucide-react';
import { analyzeMatch, fetchJobs } from '../services/jobMatchService';
import { fetchUserResumes } from '../services/resumeService';
import type { AiAnalysis, Job } from '../types/jobMatch';
import type { Resume } from '../services/resumeService';

interface JobMatchDashboardProps {
  resumeId?: number;
  userId?: number;
}

type JobCardState = {
  loading: boolean;
  analysis: AiAnalysis | null;
  error: string;
};

const AUTO_RECOVER_PREFIX = 'resumepilot_autorecover_';

const buildResumeText = (resumeData: any): string => {
  if (!resumeData || typeof resumeData !== 'object') return '';

  const parts: string[] = [];

  const textFields = [
    resumeData.fullName,
    resumeData.title,
    resumeData.email,
    resumeData.phone,
    resumeData.location,
    resumeData.linkedinText,
    resumeData.githubText,
    resumeData.objective,
    resumeData.skills,
    resumeData.achievements,
    resumeData.certifications,
    resumeData.extracurricular,
  ];

  textFields.forEach((field) => {
    if (typeof field === 'string' && field.trim()) parts.push(field.trim());
  });

  if (Array.isArray(resumeData.experiences)) {
    resumeData.experiences.forEach((experience: any) => {
      parts.push(
        [experience.company, experience.role, experience.duration, experience.desc]
          .filter((value) => typeof value === 'string' && value.trim())
          .join(' '),
      );
    });
  }

  if (Array.isArray(resumeData.projects)) {
    resumeData.projects.forEach((project: any) => {
      parts.push(
        [project.name, project.duration, project.desc]
          .filter((value) => typeof value === 'string' && value.trim())
          .join(' '),
      );
    });
  }

  if (Array.isArray(resumeData.educations)) {
    resumeData.educations.forEach((education: any) => {
      parts.push(
        [education.inst, education.degree, education.grade, education.duration]
          .filter((value) => typeof value === 'string' && value.trim())
          .join(' '),
      );
    });
  }

  return parts.join('\n').trim();
};

const JobMatchDashboard: React.FC<JobMatchDashboardProps> = ({ resumeId = 1, userId = 1 }) => {
  const [jobTitle, setJobTitle] = useState('Java Developer');
  const [location, setLocation] = useState('Remote');
  const [searchLocation, setSearchLocation] = useState('Remote');
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<number>(resumeId);
  const [selectedResumeText, setSelectedResumeText] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingResumes, setIsLoadingResumes] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [cardState, setCardState] = useState<Record<string, JobCardState>>({});
  const [resumeTextSource, setResumeTextSource] = useState('');

  useEffect(() => {
    const loadResumes = async () => {
      setIsLoadingResumes(true);
      try {
        const userEmail = localStorage.getItem('userEmail') || 'testuser@capgemini.com';
        const fetchedResumes = await fetchUserResumes(userEmail, 'Resume');
        setResumes(fetchedResumes);

        const initialResume = fetchedResumes.find((item) => item.id === selectedResumeId) || fetchedResumes[0] || null;
        if (initialResume) {
          setSelectedResumeId(initialResume.id);
          setSelectedResumeText(buildResumeText(initialResume));
          setResumeTextSource('Loaded from your saved resumes');
        }
      } catch {
        setResumes([]);
      } finally {
        setIsLoadingResumes(false);
      }
    };

    loadResumes();
    // load once on mount; resume selection updates are handled locally
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedResumeId && resumes.length > 0) {
      const matched = resumes.find((item) => item.id === selectedResumeId);
      if (matched) {
        setSelectedResumeText(buildResumeText(matched));
        setResumeTextSource('Loaded from your saved resumes');
        return;
      }
    }

    let latestTimestamp = 0;
    let latestResumeText = '';

    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key || !key.startsWith(AUTO_RECOVER_PREFIX)) continue;

      try {
        const stored = localStorage.getItem(key);
        if (!stored) continue;

        const parsed = JSON.parse(stored);
        const candidateTimestamp = Number(parsed?.timestamp || 0);
        const candidateText = buildResumeText(parsed?.resumeData);

        if (candidateText && candidateTimestamp >= latestTimestamp) {
          latestTimestamp = candidateTimestamp;
          latestResumeText = candidateText;
        }
      } catch {
        continue;
      }
    }

    if (latestResumeText && !selectedResumeText) {
      setSelectedResumeText(latestResumeText);
      setResumeTextSource('Loaded from your latest saved draft');
    }
  }, [resumes, selectedResumeId, selectedResumeText]);

  const handleResumeChange = (resumeIdValue: number) => {
    setSelectedResumeId(resumeIdValue);
    const matched = resumes.find((item) => item.id === resumeIdValue);
    const text = matched ? buildResumeText(matched) : '';
    setSelectedResumeText(text);
    setResumeTextSource(text ? 'Loaded from your saved resumes' : '');
  };

  const hasResults = jobs.length > 0;

  const ensureCardState = (job: Job): JobCardState => {
    const key = `${job.title}-${job.company}-${job.location}`;
    return cardState[key] || { loading: false, analysis: null, error: '' };
  };

  const resolveLocation = (jobLocation: string | null | undefined) => {
    const cleaned = typeof jobLocation === 'string' ? jobLocation.trim() : '';
    if (cleaned) return cleaned;
    return searchLocation || 'Location not specified';
  };

  const handleSearch = async () => {
    const trimmedTitle = jobTitle.trim();
    const trimmedLocation = location.trim();
    if (!trimmedTitle) {
      setSearchError('Please enter a job title to search.');
      return;
    }

    setIsSearching(true);
    setSearchError('');
    setJobs([]);
    setCardState({});
    setSearchLocation(trimmedLocation || 'Remote');

    try {
      const data = await fetchJobs(trimmedTitle, trimmedLocation);
      setJobs(data);
    } catch {
      setSearchError('Unable to fetch jobs right now. Please check the backend on port 8087.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAnalyze = async (job: Job) => {
    const key = `${job.title}-${job.company}-${job.location}`;
    setCardState((prev) => ({
      ...prev,
      [key]: { loading: true, analysis: prev[key]?.analysis || null, error: '' },
    }));

    if (!selectedResumeText.trim()) {
      setCardState((prev) => ({
        ...prev,
        [key]: { loading: false, analysis: null, error: '' },
      }));
      alert('Please build or upload a resume first.');
      return;
    }

    try {
      const jobDescription = `${job.title} at ${job.company} in ${resolveLocation(job.location)}`;
      const analysis = await analyzeMatch(selectedResumeId || resumeId, userId, job.title, jobDescription, selectedResumeText);
      setCardState((prev) => ({
        ...prev,
        [key]: { loading: false, analysis, error: '' },
      }));
    } catch {
      setCardState((prev) => ({
        ...prev,
        [key]: { loading: false, analysis: null, error: 'AI analysis failed. Try again.' },
      }));
    }
  };

  const skeletonCards = useMemo(() => Array.from({ length: 6 }, (_, index) => index), []);

  const getScoreClass = (score: number) => {
    if (score > 75) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score >= 50) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
  };

  const getScoreTone = (score: number) => {
    if (score > 75) return { stroke: '#10b981', ring: 'from-emerald-500 to-emerald-600', text: 'text-emerald-600', bg: 'bg-emerald-50' };
    if (score >= 50) return { stroke: '#f59e0b', ring: 'from-amber-500 to-orange-500', text: 'text-amber-600', bg: 'bg-amber-50' };
    return { stroke: '#ef4444', ring: 'from-rose-500 to-red-500', text: 'text-rose-600', bg: 'bg-rose-50' };
  };

  const renderScoreRing = (score: number) => {
    const clampedScore = Math.max(0, Math.min(100, score));
    const radius = 44;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (clampedScore / 100) * circumference;
    const tone = getScoreTone(clampedScore);

    return (
      <div className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative h-28 w-28 shrink-0">
          <svg viewBox="0 0 110 110" className="h-full w-full -rotate-90 transform">
            <circle cx="55" cy="55" r={radius} stroke="#e2e8f0" strokeWidth="10" fill="transparent" />
            <circle
              cx="55"
              cy="55"
              r={radius}
              stroke={tone.stroke}
              strokeWidth="10"
              fill="transparent"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-[stroke-dashoffset] duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-black ${tone.text}`}>{clampedScore}%</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">Match</span>
          </div>
        </div>
        <div>
          <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${getScoreClass(clampedScore)}`}>
            <CheckCircle2 className="h-3.5 w-3.5" /> AI Match Score
          </div>
          <p className={`mt-3 text-sm font-semibold ${tone.text}`}>Resume match is being evaluated against this role.</p>
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-full overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.16),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(20,184,166,0.14),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-2xl shadow-slate-200/40 backdrop-blur-xl sm:p-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-indigo-700">
              <Sparkles className="h-4 w-4" /> Job Match Dashboard
            </div>
            <div>
              <h1 className="font-['Space_Grotesk'] text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Find roles and measure resume fit in one place.
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Search LinkedIn-style jobs from your Spring Boot backend, then run a quick AI fit analysis for each role.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm sm:w-fit sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Backend</div>
              <div className="mt-1 font-semibold text-slate-900">Port 8087</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Resume Id</div>
              <div className="mt-1 font-semibold text-slate-900">{resumeId}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500">User Id</div>
              <div className="mt-1 font-semibold text-slate-900">{userId}</div>
            </div>
          </div>
        </div>

        <div className="mb-4 rounded-2xl border border-slate-200/70 bg-white/85 px-4 py-4 shadow-sm backdrop-blur-sm">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
            <BriefcaseBusiness className="h-4 w-4 text-indigo-500" /> Resume Selector
          </div>
          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Select Resume</label>
              <select
                value={selectedResumeId}
                onChange={(e) => handleResumeChange(Number(e.target.value))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                disabled={isLoadingResumes || resumes.length === 0}
              >
                {resumes.length === 0 ? (
                  <option value={selectedResumeId}>No resumes available</option>
                ) : (
                  resumes.map((resume) => (
                    <option key={resume.id} value={resume.id}>
                      {resume.title} {resume.fullName ? `- ${resume.fullName}` : ''}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Resume Status</div>
              <div className="mt-1 font-semibold text-slate-900">
                {isLoadingResumes ? 'Loading resumes...' : selectedResumeText ? 'Ready for AI analysis' : 'No resume selected'}
              </div>
            </div>
          </div>
          {resumeTextSource && (
            <div className="mt-3 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              {resumeTextSource}
            </div>
          )}
        </div>

        <div className="mb-8 rounded-[2rem] border border-slate-200/70 bg-white/80 p-5 shadow-xl shadow-slate-200/40 backdrop-blur-xl sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[1fr_0.6fr_auto]">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Job Title</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Java Developer"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Location</label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Remote"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 font-bold text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
                {isSearching ? 'Searching...' : 'Search Jobs'}
              </button>
            </div>
          </div>

          {searchError && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              <AlertCircle className="h-4 w-4" />
              {searchError}
            </div>
          )}
        </div>

        {isSearching && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {skeletonCards.map((index) => (
              <div key={index} className="animate-pulse rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-lg">
                <div className="h-5 w-24 rounded-full bg-slate-200" />
                <div className="mt-4 h-7 w-3/4 rounded-xl bg-slate-200" />
                <div className="mt-3 h-4 w-1/2 rounded-xl bg-slate-100" />
                <div className="mt-5 space-y-3">
                  <div className="h-3 rounded bg-slate-100" />
                  <div className="h-3 rounded bg-slate-100" />
                  <div className="h-3 w-5/6 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isSearching && hasResults && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {jobs.map((job) => {
              const key = `${job.title}-${job.company}-${job.location}`;
              const state = ensureCardState(job);
              const analysis = state.analysis;

              return (
                <article key={key} className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                  <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white p-5">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">
                      <BriefcaseBusiness className="h-3.5 w-3.5" /> Job Match
                    </div>
                    <h3 className="text-xl font-extrabold tracking-tight text-slate-900">{job.title}</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-600">{job.company}</p>
                    <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                      <MapPin className="h-4 w-4" />
                      <span>{resolveLocation(job.location)}</span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center gap-3">
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                      >
                        <ExternalLink className="h-4 w-4" /> Apply Now
                      </a>
                      <button
                        onClick={() => handleAnalyze(job)}
                        disabled={state.loading}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {state.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                        {state.loading ? 'Analyzing...' : 'Analyze AI Fit'}
                      </button>
                    </div>

                    {state.loading && (
                      <div className="mt-5 rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-cyan-50 p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10">
                            <span className="absolute inset-0 animate-ping rounded-full bg-indigo-400/30" />
                            <span className="absolute inset-2 rounded-full bg-indigo-600/20" />
                            <Brain className="absolute inset-0 m-auto h-5 w-5 animate-pulse text-indigo-600" />
                          </div>
                          <div>
                            <p className="text-sm font-extrabold text-slate-900">AI is Analyzing...</p>
                            <p className="text-xs font-medium text-slate-500">Please wait while we compare this role with your selected resume.</p>
                          </div>
                        </div>
                        <div className="mt-4 space-y-2">
                          <div className="h-2 w-full animate-pulse rounded-full bg-slate-200" />
                          <div className="h-2 w-5/6 animate-pulse rounded-full bg-slate-200" />
                          <div className="h-2 w-2/3 animate-pulse rounded-full bg-slate-200" />
                        </div>
                      </div>
                    )}

                    {state.error && (
                      <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                        {state.error}
                      </div>
                    )}

                    {analysis && (
                      <div className="mt-5 space-y-4">
                        {renderScoreRing(analysis.matchScore)}
                        <div className="grid gap-3">
                          <div className="rounded-3xl border border-rose-100 bg-rose-50/80 p-4 shadow-sm">
                            <div className="mb-2 flex items-center gap-2 text-sm font-extrabold text-rose-800">
                              <TriangleAlert className="h-4 w-4" /> Missing Skills
                            </div>
                            <p className="whitespace-pre-wrap text-sm leading-6 text-rose-900/80">{analysis.missingSkills || 'No missing skills returned.'}</p>
                          </div>
                          <div className="rounded-3xl border border-sky-100 bg-sky-50/80 p-4 shadow-sm">
                            <div className="mb-2 flex items-center gap-2 text-sm font-extrabold text-sky-800">
                              <Lightbulb className="h-4 w-4" /> Recommendations
                            </div>
                            <p className="whitespace-pre-wrap text-sm leading-6 text-sky-900/80">{analysis.recommendations || 'No recommendations returned.'}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!isSearching && !hasResults && !searchError && (
          <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/70 p-10 text-center shadow-sm backdrop-blur-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <Search className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-2xl font-extrabold text-slate-900">Search to discover matching jobs</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
              Enter a role and location above to load jobs from your Spring Boot service, then analyze each job against your resume.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobMatchDashboard;
