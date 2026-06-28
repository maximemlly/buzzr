export function createAccentTitle(text) {
  const h1 = document.createElement("h1");
  h1.className = "page-title";

  if (!text) return h1;

  const accent = document.createElement("span");
  accent.className = "page-title-accent";
  accent.textContent = text.slice(-1);

  h1.append(text.slice(0, -1), accent);
  return h1;
}

export function createSectionTitle(text) {
  const h2 = document.createElement("h2");
  h2.className = "section-title";
  h2.textContent = text;
  return h2;
}
