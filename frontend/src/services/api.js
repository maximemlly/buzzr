const API_URL = "http://localhost:3000";

const TOKEN_KEY = "token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body: options.body != null ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Erreur serveur");
  }

  return data;
}

export function register(username, email, password) {
  return request("/api/auth/register", {
    method: "POST",
    body: { username, email, password },
  });
}

export function login(email, password) {
  return request("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function getMe() {
  return request("/api/auth/me", {
    method: "GET",
  });
}
