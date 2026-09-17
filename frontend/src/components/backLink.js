import { navigateTo } from "../utils/navigation.js";

const ARROW_SVG =
  '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.5 4.5 7 10l5.5 5.5"/></svg>';

/**
 * Lien "retour" affiché en haut de page, sous la topbar.
 * @param {{ to?: string, label?: string, onClick?: () => void }} options
 */
export function createBackLink({ to = "/dashboard", label = "Retour au dashboard", onClick } = {}) {
  const link = document.createElement("a");
  link.href = to;
  link.className = "back-link";
  link.innerHTML = ARROW_SVG;
  link.append(label);
  link.addEventListener("click", (e) => {
    e.preventDefault();
    if (onClick) onClick();
    else navigateTo(to);
  });
  return link;
}
