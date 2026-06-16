let onNavigate = null;

export function onNavigation(callback) {
  onNavigate = callback;
}

export function getPath() {
  const { pathname } = window.location;
  if (pathname === "/" || pathname === "") {
    return "/login";
  }
  return pathname;
}

export function navigateTo(path, { replace = false } = {}) {
  const normalized = path.startsWith("/") ? path : `/${path}`;

  if (window.location.pathname === normalized) {
    onNavigate?.();
    return;
  }

  if (replace) {
    history.replaceState(null, "", normalized);
  } else {
    history.pushState(null, "", normalized);
  }

  onNavigate?.();
}

export function setActiveLobby(code) {
  sessionStorage.setItem("activeLobby", code.toUpperCase());
}

export function getActiveLobby() {
  return sessionStorage.getItem("activeLobby");
}

export function clearLobbySession() {
  sessionStorage.removeItem("activeLobby");
  sessionStorage.removeItem("lobbyRole");
}

export function leaveLobby(path = "/dashboard") {
  clearLobbySession();
  navigateTo(path, { replace: true });
}
