// small wrapper around fetch: adds the access token and refreshes it once on 401
const BASE = '/api';
let refreshing = null;

export const saveTokens = (d) => {
  localStorage.setItem('accessToken', d.accessToken);
  localStorage.setItem('refreshToken', d.refreshToken);
};
export const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

async function refreshAccess() {
  const res = await fetch(`${BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: localStorage.getItem('refreshToken') }),
  });
  if (!res.ok) throw new Error('refresh failed');
  saveTokens(await res.json());
}

export async function api(path, { method = 'GET', body } = {}, retry = true) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  const token = localStorage.getItem('accessToken');
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });

  if (res.status === 401 && retry && localStorage.getItem('refreshToken') && !path.startsWith('/auth/')) {
    try {
      refreshing = refreshing || refreshAccess();
      await refreshing;
    } catch {
      clearTokens();
      window.dispatchEvent(new Event('auth:logout'));
      throw new Error('Session expired. Please login again.');
    } finally {
      refreshing = null;
    }
    return api(path, { method, body }, false);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
}
