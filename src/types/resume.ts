export interface ResumeContent {
  fullName?: string;
  summary: string;
  skills: string;
  experience: string;
  education: string;
}

export interface Resume {
  id: number;
  title: string;
  fullName?: string;
  summary: string;
  skills: string;
  experience: string;
  education: string;
}

export interface ResumePayload {
  title: string;
  content: string;
}

export interface RawResume {
  id: number;
  title: string;
  content?: string;
}
