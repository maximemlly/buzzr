import { navigateTo } from "../utils/navigation.js";

export function createPrivacyLink(label = "Politique de confidentialité") {
  const link = document.createElement("a");
  link.href = "/privacy";
  link.className = "auth-link";
  link.textContent = label;
  link.addEventListener("click", (e) => {
    e.preventDefault();
    navigateTo("/privacy");
  });
  return link;
}
