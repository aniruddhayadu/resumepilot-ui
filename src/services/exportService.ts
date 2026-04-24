const EXPORT_BASE_URL = import.meta.env.VITE_EXPORT_BASE_URL || '';

interface ExportJobResponse {
  fileUrl?: string;
  pdfUrl?: string;
  downloadUrl?: string;
  url?: string;
  message?: string;
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
    if (!payloadPart) {
      return null;
    }

    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(''),
    );

    return JSON.parse(jsonPayload) as JwtPayload;
  } catch {
    return null;
  }
};

const resolveUserId = (options: ExportRequestOptions): number => {
  if (typeof options.userId === 'number' && Number.isFinite(options.userId)) {
    return options.userId;
  }

  if (options.token) {
    const payload = decodeJwtPayload(options.token);
    const candidates = [payload?.userId, payload?.user_id, payload?.id, payload?.sub];

    for (const candidate of candidates) {
      const parsed = Number(candidate);
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }
  }

  return DEFAULT_EXPORT_USER_ID;
};

const extractServerMessage = async (response: Response): Promise<string> => {
  const text = await response.text();
  const trimmed = text.trim();

  if (!trimmed) {
    return `Export request failed with status ${response.status}.`;
  }

  try {
    const payload = JSON.parse(trimmed) as ExportJobResponse;
    return payload.message || trimmed;
  } catch {
    return trimmed;
  }
};

const extractFileUrl = async (response: Response): Promise<string | null> => {
  const text = await response.text();
  const trimmed = text.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const data = JSON.parse(trimmed) as ExportJobResponse;
    return data.fileUrl || data.pdfUrl || data.downloadUrl || data.url || null;
  } catch {
    return trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : null;
  }
};

export const requestResumePdf = async (
  resumeId: number,
  options: ExportRequestOptions = {},
): Promise<string | null> => {
  const resolvedUserId = resolveUserId(options);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options.userEmail) {
    headers['User-Email'] = options.userEmail;
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const endpointCandidates: string[] = [
    `${EXPORT_BASE_URL}/exports/pdf/${resumeId}/${resolvedUserId}`,
    `${EXPORT_BASE_URL}/export/pdf/${resumeId}/${resolvedUserId}`,
    `${EXPORT_BASE_URL}/exports/pdf/${resumeId}`,
    `${EXPORT_BASE_URL}/export/pdf/${resumeId}`,
  ];

  let lastErrorMessage = 'Failed to generate PDF due to an unexpected export service response.';

  for (const endpoint of Array.from(new Set(endpointCandidates))) {
    let response: Response;

    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ theme: 'professional' }),
      });
    } catch {
      lastErrorMessage =
        'Unable to reach Export Service from browser context. Configure dev proxy or CORS allowlist for http://localhost:5173.';
      continue;
    }

    if (response.ok) {
      return await extractFileUrl(response);
    }

    const serverMessage = await extractServerMessage(response);
    lastErrorMessage = `Export failed (${response.status}). ${serverMessage}`;
  }

  throw new Error(lastErrorMessage);
};
