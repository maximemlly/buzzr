import { createBrandLogo } from "./brandLogo.js";
import { navigateTo, getPath } from "../utils/navigation.js";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/dashboard", key: "dashboard" },
  { label: "Mes quiz", path: "/quizzes", key: "quizzes" },
  { label: "Rechercher", path: "/explore", key: "explore" },
];

function createNavLink({ label, path, key }, activeNav) {
  const link = document.createElement("a");
  link.href = path;
  link.className = activeNav === key ? "app-nav-link active" : "app-nav-link";
  link.textContent = label;
  link.addEventListener("click", (e) => {
    e.preventDefault();
    if (getPath() !== path) navigateTo(path);
  });
  return link;
}

export function createAppPage({ activeNav = null, showNav = true } = {}) {
  const shell = document.createElement("div");
  shell.className = "app-shell";

  const header = document.createElement("header");
  header.className = "topbar";

  header.append(createBrandLogo({ linkTo: "/dashboard" }));

  if (showNav) {
    const nav = document.createElement("nav");
    nav.className = "app-nav";
    nav.setAttribute("aria-label", "Navigation principale");
    for (const item of NAV_ITEMS) {
      nav.append(createNavLink(item, activeNav));
    }
    header.append(nav);
  } else {
    const spacer = document.createElement("div");
    spacer.className = "topbar-spacer";
    header.append(spacer);
  }

  const profileSlot = document.createElement("div");
  profileSlot.className = "app-profile-slot";
  profileSlot.id = "app-profile-slot";
  header.append(profileSlot);

  const main = document.createElement("main");
  main.className = "app-main";

  shell.append(header, main);
  return { page: shell, main, profileSlot };
}
