import { createBrandLogo } from "./brandLogo.js";

export function wrapAuthPage(formEl) {
  const shell = document.createElement("div");
  shell.className = "auth-shell";

  const header = document.createElement("header");
  header.className = "topbar";
  header.append(createBrandLogo());

  const content = document.createElement("div");
  content.className = "auth-content";
  content.append(formEl);

  shell.append(header, content);
  formEl.classList.add("auth-form-inner");

  return shell;
}
