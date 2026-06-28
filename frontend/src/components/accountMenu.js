import { clearToken } from "../services/api.js";
import { navigateTo } from "../utils/navigation.js";

let menuEl = null;

function closeDropdown() {
  menuEl?.querySelector(".account-menu-dropdown")?.classList.remove("open");
}

function handleOutsideClick(event) {
  if (!menuEl?.contains(event.target)) {
    closeDropdown();
  }
}

export function removeAccountMenu() {
  document.removeEventListener("click", handleOutsideClick);
  menuEl?.remove();
  menuEl = null;
}

function createProfileIcon() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("app-profile-icon");

  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", "12");
  circle.setAttribute("cy", "8");
  circle.setAttribute("r", "4");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute(
    "d",
    "M4 20c0-4 3.6-6 8-6s8 2 8 6",
  );

  svg.append(circle, path);
  return svg;
}

export function mountAccountMenu(container, user) {
  removeAccountMenu();
  if (!container) return;

  menuEl = document.createElement("div");
  menuEl.className = "account-menu";

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "app-profile-btn";
  trigger.setAttribute("aria-haspopup", "true");
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-label", user?.username ? `Compte de ${user.username}` : "Mon compte");
  trigger.append(createProfileIcon());

  const dropdown = document.createElement("div");
  dropdown.className = "account-menu-dropdown";

  if (user?.username) {
    const nameEl = document.createElement("p");
    nameEl.className = "account-menu-name";
    nameEl.textContent = user.username;
    dropdown.append(nameEl);
  }

  const settingsBtn = document.createElement("button");
  settingsBtn.type = "button";
  settingsBtn.textContent = "Paramètres du compte";
  settingsBtn.addEventListener("click", () => {
    closeDropdown();
    navigateTo("/account");
  });

  dropdown.append(settingsBtn);

  if (user?.role === "admin") {
    const adminBtn = document.createElement("button");
    adminBtn.type = "button";
    adminBtn.textContent = "Administration";
    adminBtn.addEventListener("click", () => {
      closeDropdown();
      navigateTo("/admin");
    });
    dropdown.append(adminBtn);
  }

  const logoutBtn = document.createElement("button");
  logoutBtn.type = "button";
  logoutBtn.className = "account-menu-logout";
  logoutBtn.textContent = "Déconnexion";
  logoutBtn.addEventListener("click", () => {
    closeDropdown();
    clearToken();
    removeAccountMenu();
    navigateTo("/login", { replace: true });
  });

  dropdown.append(logoutBtn);

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = dropdown.classList.toggle("open");
    trigger.setAttribute("aria-expanded", String(isOpen));
  });

  menuEl.append(trigger, dropdown);
  container.append(menuEl);
  document.addEventListener("click", handleOutsideClick);
}
