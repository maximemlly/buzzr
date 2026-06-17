import { PRIVACY_POLICY } from "../content/privacyPolicy.js";
import { navigateTo } from "../utils/navigation.js";

export function renderPrivacy(container) {
  container.replaceChildren();

  const article = document.createElement("article");
  article.className = "legal-page";

  const header = document.createElement("header");
  header.className = "legal-header";

  const title = document.createElement("h1");
  title.textContent = PRIVACY_POLICY.title;

  const updated = document.createElement("p");
  updated.className = "legal-updated";
  updated.textContent = `Dernière mise à jour : ${PRIVACY_POLICY.lastUpdated}`;

  const backBtn = document.createElement("button");
  backBtn.type = "button";
  backBtn.textContent = "Retour";
  backBtn.addEventListener("click", () => {
    if (window.history.length > 1) {
      history.back();
    } else {
      navigateTo("/login");
    }
  });

  header.append(title, updated, backBtn);
  article.append(header);

  const intro = document.createElement("p");
  intro.className = "legal-intro";
  intro.textContent = PRIVACY_POLICY.intro;
  article.append(intro);

  for (const section of PRIVACY_POLICY.sections) {
    const sectionEl = document.createElement("section");
    sectionEl.className = "legal-section";

    const heading = document.createElement("h2");
    heading.textContent = section.title;
    sectionEl.append(heading);

    for (const text of section.paragraphs) {
      const p = document.createElement("p");
      p.textContent = text;
      sectionEl.append(p);
    }

    article.append(sectionEl);
  }

  container.append(article);
}
