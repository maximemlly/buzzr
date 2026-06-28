import { createQuiz } from "../services/api.js";
import { navigateTo } from "../utils/navigation.js";
import { createAppPage } from "../components/appLayout.js";

export function renderQuizNew(container) {
  container.replaceChildren();

  const { page, main } = createAppPage({ activeNav: "quizzes" });

  const hero = document.createElement("section");
  hero.className = "hero";

  const pageTitle = document.createElement("h1");
  pageTitle.textContent = "Nouveau quiz";

  const sub = document.createElement("p");
  sub.className = "hero-sub";
  sub.textContent = "Donnez un titre et une description à votre quiz";

  hero.append(pageTitle, sub);

  const form = document.createElement("form");
  form.className = "panel-form";

  const titleLabel = document.createElement("label");
  titleLabel.textContent = "Titre";
  const titleInput = document.createElement("input");
  titleInput.type = "text";
  titleInput.name = "title";
  titleInput.required = true;
  titleLabel.append(titleInput);

  const descLabel = document.createElement("label");
  descLabel.textContent = "Description";
  const descInput = document.createElement("textarea");
  descInput.name = "description";
  descInput.rows = 3;
  descLabel.append(descInput);

  const errorEl = document.createElement("p");
  errorEl.className = "error";
  errorEl.hidden = true;

  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.className = "btn btn-primary";
  submitBtn.textContent = "Créer le quiz";

  const backLink = document.createElement("a");
  backLink.href = "/dashboard";
  backLink.className = "auth-link";
  backLink.textContent = "← Retour au dashboard";
  backLink.addEventListener("click", (e) => {
    e.preventDefault();
    navigateTo("/dashboard");
  });

  form.append(titleLabel, descLabel, errorEl, submitBtn, backLink);
  main.append(hero, form);
  container.append(page);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.hidden = true;

    try {
      const data = await createQuiz(
        titleInput.value.trim(),
        descInput.value.trim() || null,
      );
      navigateTo(`/quiz/${data.quiz.id}/edit`);
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
    }
  });
}
