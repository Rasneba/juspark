const API_BASE = "";

async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  return res;
}

export const api = {
  get: (path: string, token?: string) =>
    apiFetch(path, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),

  post: (path: string, body: any, token?: string) =>
    apiFetch(path, {
      method: "POST",
      body: JSON.stringify(body),
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),

  put: (path: string, body: any, token?: string) =>
    apiFetch(path, {
      method: "PUT",
      body: JSON.stringify(body),
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),

  patch: (path: string, body: any, token?: string) =>
    apiFetch(path, {
      method: "PATCH",
      body: JSON.stringify(body),
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),

  delete: (path: string, token?: string) =>
    apiFetch(path, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),
};
