import api from '../api/api';

interface ExportJobResponse {
  fileUrl?: string;
  pdfUrl?: string;
  downloadUrl?: string;
  url?: string;
  message?: string;
  jobId?: string;
  status?: string;
}

interface ExportRequestOptions {
  userId?: number;
  userEmail?: string;
  token?: string;
}

interface JwtPayload {
  userId?: number | string;
  user_id?: number | string;
  id?: number | string;
  sub?: string;
}

const DEFAULT_EXPORT_USER_ID = Number(import.meta.env.VITE_EXPORT_DEFAULT_USER_ID || 101);

const decodeJwtPayload = (token: string): JwtPayload | null => {
  try {
    const [, payloadPart] = token.split('.');
    if (!payloadPart) return null;
    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64).split('').map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`).join(''),
    );
    return JSON.parse(jsonPayload) as JwtPayload;
  } catch {
    return null;
  }
};

const resolveUserId = (options: ExportRequestOptions): number => {
  if (typeof options.userId === 'number' && Number.isFinite(options.userId)) return options.userId;
  if (options.token) {
    const payload = decodeJwtPayload(options.token);
    const candidates = [payload?.userId, payload?.user_id, payload?.id, payload?.sub];
    for (const candidate of candidates) {
      const parsed = Number(candidate);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
  }
  return DEFAULT_EXPORT_USER_ID;
};

export const requestResumePdf = async (
  resumeId: number,
  templateId: number = 1,
  options: ExportRequestOptions = {},
): Promise<string | null> => {
  const resolvedUserId = resolveUserId(options);

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.userEmail) headers['User-Email'] = options.userEmail;
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  const endpointCandidates: string[] = [
    `/exports/pdf/${resumeId}/${resolvedUserId}`,
    `/export/pdf/${resumeId}/${resolvedUserId}`,
    `/exports/pdf/${resumeId}`,
    `/export/pdf/${resumeId}`,
  ];

  let lastErrorMessage = 'Failed to generate PDF due to an unexpected export service response.';

  for (const endpoint of Array.from(new Set(endpointCandidates))) {
    try {
      const response = await api.post(endpoint, { theme: 'professional', templateId: templateId.toString() }, { headers });
      const job = response.data as ExportJobResponse;
      
      if (job.status === 'COMPLETED' && job.fileUrl) return job.fileUrl;
      
      return new Promise((resolve, reject) => {
        let attempts = 0;
        const interval = setInterval(async () => {
            attempts++;
            try {
            const statusRes = await api.get(`/export/status/${job.jobId}`);
            const statusData = statusRes.data;
            
            if (statusData.status === 'COMPLETED' && statusData.fileUrl) {
              clearInterval(interval);
              resolve(statusData.fileUrl);
            } else if (statusData.status === 'FAILED' || attempts > 20) {
              clearInterval(interval);
              reject(new Error('PDF generation failed or timed out.'));
            }
          } catch (err) {
            clearInterval(interval);
            reject(err);
          }
        }, 2000);
      });

    } catch {
      lastErrorMessage = 'Unable to reach Export Service.';
      continue;
    }
  }
  throw new Error(lastErrorMessage);
};
