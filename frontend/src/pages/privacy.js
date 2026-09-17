import { PRIVACY_POLICY } from "../content/privacyPolicy.js";
import { navigateTo } from "../utils/navigation.js";
import { createAppPage } from "../components/appLayout.js";
import { createBackLink } from "../components/backLink.js";

export function renderPrivacy(container) {
  container.replaceChildren();

  const { page, main } = createAppPage();

  const article = document.createElement("article");
  article.className = "legal-page";

  const header = document.createElement("header");
  header.className = "legal-header";

  const title = document.createElement("h1");
  title.textContent = PRIVACY_POLICY.title;

  const updated = document.createElement("p");
  updated.className = "legal-updated";
  updated.textContent = `Dernière mise à jour : ${PRIVACY_POLICY.lastUpdated}`;

  const backLink = createBackLink({
    to: "/login",
    label: "Retour",
    onClick: () => {
      if (window.history.length > 1) history.back();
      else navigateTo("/login");
    },
  });

  header.append(backLink, title, updated);
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

  main.append(article);
  container.append(page);
}
