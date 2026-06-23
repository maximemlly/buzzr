import { getToken } from "./services/api.js";
import { getPath, navigateTo, onNavigation, getActiveLobby } from "./utils/navigation.js";
import { renderLogin } from "./pages/login.js";
import { renderRegister } from "./pages/register.js";
import { renderVerifyEmail } from "./pages/verifyEmail.js";
import { renderForgotPassword } from "./pages/forgotPassword.js";
import { renderResetPassword } from "./pages/resetPassword.js";
import { renderDashboard } from "./pages/dashboard.js";
import { renderQuizNew } from "./pages/quizNew.js";
import { renderQuizEditor } from "./pages/quizEditor.js";
import { renderJoin } from "./pages/join.js";
import { renderLobby } from "./pages/lobby.js";
import { renderAdmin } from "./pages/admin.js";
import { renderExplore } from "./pages/explore.js";
import { renderPrivacy } from "./pages/privacy.js";
import { renderAccountSettings } from "./pages/accountSettings.js";
import { mountAccountMenu, removeAccountMenu } from "./components/accountMenu.js";

const publicPaths = ["/login", "/register", "/verify-email", "/forgot-password", "/reset-password", "/privacy"];

const routes = {
  "/login": renderLogin,
  "/register": renderRegister,
  "/verify-email": renderVerifyEmail,
  "/forgot-password": renderForgotPassword,
  "/reset-password": renderResetPassword,
  "/dashboard": renderDashboard,
  "/explore": renderExplore,
  "/quiz/new": renderQuizNew,
  "/join": (app) => {
    const params = new URLSearchParams(window.location.search);
    renderJoin(app, params.get("code") ?? "");
  },
  "/admin": renderAdmin,
  "/account": renderAccountSettings,
  "/privacy": renderPrivacy,
};

function shouldShowAccountMenu(path) {
  if (publicPaths.includes(path)) return false;
  if (path.startsWith("/lobby/")) return false;
  return Boolean(getToken());
}

function canAccessPath(path) {
  if (publicPaths.includes(path)) return true;
  return Boolean(getToken());
}

function guardPath(path) {
  const lobbyMatch = path.match(/^\/lobby\/([A-Z0-9]+)$/i);
  if (lobbyMatch) {
    const code = lobbyMatch[1].toUpperCase();
    if (getActiveLobby() !== code) {
      return { path: "/dashboard", replace: true };
    }
  }

  if (!canAccessPath(path)) {
    return { path: "/login", replace: true };
  }

  if (getToken() && (path === "/login" || path === "/register")) {
    return { path: "/dashboard", replace: true };
  }

  return { path, replace: false };
}

function resolveRoute(path) {
  if (routes[path]) {
    return (app) => routes[path](app);
  }

  const editMatch = path.match(/^\/quiz\/(\d+)\/edit$/);
  if (editMatch) {
    const quizId = editMatch[1];
    return (app) => renderQuizEditor(app, quizId);
  }

  const lobbyMatch = path.match(/^\/lobby\/([A-Z0-9]+)$/i);
  if (lobbyMatch) {
    const code = lobbyMatch[1].toUpperCase();
    return (app) => renderLobby(app, code);
  }

  return (app) => renderLogin(app);
}

export function initRouter() {
  const app = document.querySelector("#app");

  function navigate() {
    if (window.location.hash) {
      const legacy = window.location.hash.slice(1).split("#")[0];
      const path = legacy.startsWith("/") ? legacy : `/${legacy}`;
      navigateTo(path, { replace: true });
      return;
    }

    let path = getPath();
    const guard = guardPath(path);

    if (guard.path !== path || guard.replace) {
      navigateTo(guard.path, { replace: true });
      return;
    }

    const render = resolveRoute(path);
    app.replaceChildren();
    render(app);

    if (shouldShowAccountMenu(path)) {
      mountAccountMenu();
    } else {
      removeAccountMenu();
    }
  }

  onNavigation(navigate);
  window.addEventListener("popstate", navigate);
  navigate();
}
