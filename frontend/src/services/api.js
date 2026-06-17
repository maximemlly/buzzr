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
    const err = new Error(data.message || "Erreur serveur");
    err.code = data.code;
    err.email = data.email;
    throw err;
  }

  return data;
}

export function register(username, email, password, passwordConfirm) {
  return request("/api/auth/register", {
    method: "POST",
    body: { username, email, password, passwordConfirm },
  });
}

export function login(email, password) {
  return request("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function verifyEmail(token) {
  return request(`/api/auth/verify-email/${encodeURIComponent(token)}`, {
    method: "GET",
  });
}

export function resendVerification(email) {
  return request("/api/auth/resend-verification", {
    method: "POST",
    body: { email },
  });
}

export function forgotPassword(email) {
  return request("/api/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
}

export function resetPassword(token, password, passwordConfirm) {
  return request("/api/auth/reset-password", {
    method: "POST",
    body: { token, password, passwordConfirm },
  });
}

export function getMe() {
  return request("/api/auth/me", {
    method: "GET",
  });
}

export function getQuizzes() {
  return request("/api/quizzes", { method: "GET" });
}

export function createQuiz(title, description) {
  return request("/api/quizzes", {
    method: "POST",
    body: { title, description },
  });
}

export function getQuiz(id) {
  return request(`/api/quizzes/${id}`, { method: "GET" });
}

export function updateQuiz(id, { title, description, is_published }) {
  return request(`/api/quizzes/${id}`, {
    method: "PUT",
    body: { title, description, is_published },
  });
}

export function deleteQuiz(id) {
  return request(`/api/quizzes/${id}`, { method: "DELETE" });
}

export function addQuestion(quizId, question) {
  return request(`/api/quizzes/${quizId}/questions`, {
    method: "POST",
    body: question,
  });
}

export function deleteQuestion(quizId, questionId) {
  return request(`/api/quizzes/${quizId}/questions/${questionId}`, {
    method: "DELETE",
  });
}

export function createSession(quizId) {
  return request("/api/sessions", {
    method: "POST",
    body: { quiz_id: quizId },
  });
}

export function getSession(code) {
  return request(`/api/sessions/${code}`, { method: "GET" });
}

export function getAdminUsers(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/api/admin/users${query ? `?${query}` : ""}`, { method: "GET" });
}

export function getAdminUser(id) {
  return request(`/api/admin/users/${id}`, { method: "GET" });
}

export function setAdminUserStatus(id, isActive) {
  return request(`/api/admin/users/${id}/status`, {
    method: "PATCH",
    body: { is_active: isActive },
  });
}

export function eraseAdminUser(id) {
  return request(`/api/admin/users/${id}`, { method: "DELETE" });
}

export function getAdminQuizzes(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/api/admin/quizzes${query ? `?${query}` : ""}`, { method: "GET" });
}

export function unpublishAdminQuiz(id) {
  return request(`/api/admin/quizzes/${id}/unpublish`, { method: "PATCH" });
}

export function deleteAdminQuiz(id) {
  return request(`/api/admin/quizzes/${id}`, { method: "DELETE" });
}
