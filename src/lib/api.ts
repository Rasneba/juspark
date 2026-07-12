const API_BASE = "";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`${API_BASE}${path}`, { ...options, headers });
}

export const api = {
  get: (path: string) => apiFetch(path),

  post: (path: string, body: Record<string, unknown>) =>
    apiFetch(path, { method: "POST", body: JSON.stringify(body) }),

  put: (path: string, body: Record<string, unknown>) =>
    apiFetch(path, { method: "PUT", body: JSON.stringify(body) }),

  patch: (path: string, body: Record<string, unknown>) =>
    apiFetch(path, { method: "PATCH", body: JSON.stringify(body) }),

  delete: (path: string) => apiFetch(path, { method: "DELETE" }),

  checkAuth: (): boolean => !!getToken(),
};
