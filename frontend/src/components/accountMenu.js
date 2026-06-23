import { getMe, clearToken } from "../services/api.js";
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

export function mountAccountMenu() {
  removeAccountMenu();

  menuEl = document.createElement("div");
  menuEl.className = "account-menu";

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "account-menu-trigger";
  trigger.textContent = "Mon compte";
  trigger.setAttribute("aria-haspopup", "true");
  trigger.setAttribute("aria-expanded", "false");

  const dropdown = document.createElement("div");
  dropdown.className = "account-menu-dropdown";

  const settingsBtn = document.createElement("button");
  settingsBtn.type = "button";
  settingsBtn.textContent = "Paramètres du compte";
  settingsBtn.addEventListener("click", () => {
    closeDropdown();
    navigateTo("/account");
  });

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

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = dropdown.classList.toggle("open");
    trigger.setAttribute("aria-expanded", String(isOpen));
  });

  dropdown.append(settingsBtn, logoutBtn);
  menuEl.append(trigger, dropdown);
  document.body.append(menuEl);

  document.addEventListener("click", handleOutsideClick);

  getMe()
    .then((data) => {
      if (!menuEl) return;

      trigger.textContent = data.user.username;

      if (data.user.role === "admin") {
        const adminBtn = document.createElement("button");
        adminBtn.type = "button";
        adminBtn.textContent = "Administration";
        adminBtn.addEventListener("click", () => {
          closeDropdown();
          navigateTo("/admin");
        });
        dropdown.insertBefore(adminBtn, logoutBtn);
      }
    })
    .catch(() => {
      removeAccountMenu();
    });
}
