import { getMe, clearToken } from "../services/api.js";
import { navigateTo } from "../utils/navigation.js";

export function renderDashboard(container) {
  container.replaceChildren();

  const section = document.createElement("section");
  section.className = "dashboard";

  const greeting = document.createElement("h1");
  greeting.textContent = "Chargement…";

  const logoutBtn = document.createElement("button");
  logoutBtn.type = "button";
  logoutBtn.textContent = "Déconnexion";

  section.append(greeting, logoutBtn);
  container.append(section);

  getMe()
    .then((data) => {
      greeting.textContent = `Bonjour, ${data.user.username} !`;
    })
    .catch(() => {
      clearToken();
      navigateTo("/login");
    });

  logoutBtn.addEventListener("click", () => {
    clearToken();
    navigateTo("/login");
  });
}
