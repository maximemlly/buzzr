import { getToken } from "./services/api.js";
import { getPath, navigateTo, onNavigation } from "./utils/navigation.js";
import { renderLogin } from "./pages/login.js";
import { renderRegister } from "./pages/register.js";
import { renderDashboard } from "./pages/dashboard.js";

const publicPaths = ["/login", "/register"];

const routes = {
  "/login": renderLogin,
  "/register": renderRegister,
  "/dashboard": renderDashboard,
};

export function initRouter() {
  const app = document.querySelector("#app");

  function navigate() {
    // Anciennes URLs en #/login → /login
    if (window.location.hash) {
      const legacy = window.location.hash.slice(1).split("#")[0];
      const path = legacy.startsWith("/") ? legacy : `/${legacy}`;
      navigateTo(path, { replace: true });
      return;
    }

    let path = getPath();

    if (window.location.pathname !== path) {
      navigateTo(path, { replace: true });
      return;
    }

    if (!getToken() && !publicPaths.includes(path)) {
      navigateTo("/login", { replace: true });
      return;
    }

    if (getToken() && publicPaths.includes(path)) {
      navigateTo("/dashboard", { replace: true });
      return;
    }

    const render = routes[path] ?? renderLogin;
    app.replaceChildren();
    render(app);
  }

  onNavigation(navigate);
  window.addEventListener("popstate", navigate);
  navigate();
}
