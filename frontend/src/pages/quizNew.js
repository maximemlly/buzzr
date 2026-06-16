import { createQuiz } from "../services/api.js";
import { navigateTo } from "../utils/navigation.js";

export function renderQuizNew(container) {
  container.replaceChildren();

  const form = document.createElement("form");
  form.className = "auth-form";

  const title = document.createElement("h1");
  title.textContent = "Nouveau quiz";
  form.append(title);

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
  submitBtn.textContent = "Créer";

  const backLink = document.createElement("a");
  backLink.href = "/dashboard";
  backLink.className = "auth-link";
  backLink.textContent = "Retour au dashboard";
  backLink.addEventListener("click", (e) => {
    e.preventDefault();
    navigateTo("/dashboard");
  });

  form.append(titleLabel, descLabel, errorEl, submitBtn, backLink);
  container.append(form);

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
