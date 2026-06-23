export function showBlockedDialog(message, { onClose, title = "Accès refusé", variant = "error" } = {}) {
  const overlay = document.createElement("div");
  overlay.className = "dialog-overlay";

  const dialog = document.createElement("div");
  dialog.className = `dialog-box dialog-box--${variant}`;
  dialog.setAttribute("role", "alertdialog");
  dialog.setAttribute("aria-modal", "true");

  const titleEl = document.createElement("h2");
  titleEl.textContent = title;

  const text = document.createElement("p");
  text.textContent = message;

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.textContent = "Compris";

  function close() {
    overlay.remove();
    onClose?.();
  }

  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  dialog.append(titleEl, text, closeBtn);
  overlay.append(dialog);
  document.body.append(overlay);
  closeBtn.focus();
}
