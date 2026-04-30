// src/services/exportService.ts
const EXPORT_BASE_URL = import.meta.env.VITE_EXPORT_BASE_URL || 'http://localhost:8083';

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

// 👇 NAYA UPDATE: templateId parameter add kiya (default 1)
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
    `${EXPORT_BASE_URL}/exports/pdf/${resumeId}/${resolvedUserId}`,
    `${EXPORT_BASE_URL}/export/pdf/${resumeId}/${resolvedUserId}`,
    `${EXPORT_BASE_URL}/exports/pdf/${resumeId}`,
    `${EXPORT_BASE_URL}/export/pdf/${resumeId}`,
  ];

  let lastErrorMessage = 'Failed to generate PDF due to an unexpected export service response.';

  for (const endpoint of Array.from(new Set(endpointCandidates))) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        // NAYA: templateId ko backend bhejna zaroori hai!
        body: JSON.stringify({ theme: 'professional', templateId: templateId.toString() }),
      });

      if (!response.ok) {
        lastErrorMessage = `Export failed (${response.status}).`;
        continue;
      }

      const job = await response.json() as ExportJobResponse;
      
      // Polling Logic: Agar turant mil jaye toh theek, warna wait karega
      if (job.status === 'COMPLETED' && job.fileUrl) return job.fileUrl;
      
      return new Promise((resolve, reject) => {
        let attempts = 0;
        const interval = setInterval(async () => {
          attempts++;
          try {
            const statusRes = await fetch(`${EXPORT_BASE_URL}/export/status/${job.jobId}`);
            const statusData = await statusRes.json();
            
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