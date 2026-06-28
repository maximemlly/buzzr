import { navigateTo } from "../utils/navigation.js";

export function createBrandLogo({ linkTo = null } = {}) {
  const wrap = linkTo ? document.createElement("a") : document.createElement("div");
  wrap.className = "brand-logo";
  if (linkTo) {
    wrap.href = linkTo;
    wrap.addEventListener("click", (e) => {
      e.preventDefault();
      navigateTo(linkTo);
    });
  }

  const buzz = document.createElement("span");
  buzz.className = "brand-logo-buzz";
  buzz.textContent = "Buzz";

  const r = document.createElement("span");
  r.className = "brand-logo-r";
  r.textContent = "r";

  wrap.append(buzz, r);
  return wrap;
}
