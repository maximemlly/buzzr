import {
  getQuiz,
  addQuestion,
  deleteQuestion,
  updateQuiz,
} from "../services/api.js";
import { createAppPage } from "../components/appLayout.js";
import { createBackLink } from "../components/backLink.js";

async function renderQuestions(quiz, listEl, errorEl, countEl) {
  listEl.replaceChildren();
  if (countEl) countEl.textContent = String(quiz.questions.length);

  if (quiz.questions.length === 0) {
    const empty = document.createElement("p");
    empty.className = "quiz-empty";
    empty.textContent = "Aucune question pour l'instant.";
    listEl.append(empty);
    return;
  }

  quiz.questions.forEach((question, index) => {
    const li = document.createElement("li");
    li.className = "question-card";

    const num = document.createElement("span");
    num.className = "question-num";
    num.textContent = String(index + 1);

    const body = document.createElement("div");
    body.className = "question-body";

    const label = document.createElement("p");
    label.className = "question-label";
    label.textContent = question.label;

    const meta = document.createElement("p");
    meta.className = "question-meta";
    const answers = question.answers ?? [];
    const correct = answers.find((a) => a.is_correct);
    meta.textContent = `${question.timer_seconds ?? 20}s · ${answers.length} réponses`;
    if (correct) {
      meta.append(" · ");
      const ok = document.createElement("span");
      ok.className = "question-correct";
      ok.textContent = `✓ ${correct.label}`;
      meta.append(ok);
    }

    body.append(label, meta);

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn btn-ghost-danger btn-sm";
    deleteBtn.textContent = "Supprimer";
    deleteBtn.setAttribute("aria-label", `Supprimer la question ${index + 1}`);
    deleteBtn.addEventListener("click", async () => {
      if (!confirm(`Supprimer la question « ${question.label} » ?`)) return;

      deleteBtn.disabled = true;
      try {
        await deleteQuestion(quiz.id, question.id);
        const data = await getQuiz(quiz.id);
        await renderQuestions(data.quiz, listEl, errorEl, countEl);
      } catch (err) {
        deleteBtn.disabled = false;
        errorEl.textContent = err.message;
        errorEl.hidden = false;
      }
    });

    li.append(num, body, deleteBtn);
    listEl.append(li);
  });
}

export function renderQuizEditor(container, quizId) {
  container.replaceChildren();

  const { page, main } = createAppPage({ activeNav: "quizzes" });

  const hero = document.createElement("section");
  hero.className = "hero";

  const heading = document.createElement("h1");
  heading.textContent = "Chargement…";

  const heroSub = document.createElement("p");
  heroSub.className = "hero-sub";
  heroSub.textContent = "Modifiez les paramètres et ajoutez des questions";

  hero.append(heading, heroSub);

  const notice = document.createElement("p");
  notice.className = "notice notice--warning";
  notice.setAttribute("role", "note");
  notice.textContent =
    "Un quiz public doit contenir au moins une question. En tant que créateur, vous ne pourrez jamais marquer de points sur vos propres quiz.";

  const settingsForm = document.createElement("form");
  settingsForm.className = "account-settings-block quiz-settings";

  const settingsTitle = document.createElement("h2");
  settingsTitle.textContent = "Paramètres du quiz";
  settingsForm.append(settingsTitle);

  const titleField = document.createElement("label");
  titleField.textContent = "Titre";
  const titleInput = document.createElement("input");
  titleInput.type = "text";
  titleInput.required = true;
  titleField.append(titleInput);

  const descField = document.createElement("label");
  descField.textContent = "Description";
  const descInput = document.createElement("textarea");
  descInput.rows = 2;
  descField.append(descInput);

  const publishLabel = document.createElement("label");
  publishLabel.className = "publish-toggle";
  const publishCheckbox = document.createElement("input");
  publishCheckbox.type = "checkbox";
  publishCheckbox.name = "is_published";
  publishCheckbox.className = "publish-toggle-input";
  const publishSwitch = document.createElement("span");
  publishSwitch.className = "publish-toggle-switch";
  publishSwitch.setAttribute("aria-hidden", "true");
  const publishText = document.createElement("span");
  publishText.className = "publish-toggle-text";
  const publishTitle = document.createElement("strong");
  publishTitle.textContent = "Rendre ce quiz public";
  const publishDesc = document.createElement("span");
  publishDesc.textContent =
    "Visible dans l'explorateur et jouable par les autres utilisateurs";
  publishText.append(publishTitle, publishDesc);
  publishLabel.append(publishCheckbox, publishSwitch, publishText);

  const settingsError = document.createElement("p");
  settingsError.className = "error";
  settingsError.hidden = true;

  const saveSettingsBtn = document.createElement("button");
  saveSettingsBtn.type = "submit";
  saveSettingsBtn.className = "btn btn-primary";
  saveSettingsBtn.textContent = "Enregistrer les paramètres";

  settingsForm.append(
    titleField,
    descField,
    publishLabel,
    settingsError,
    saveSettingsBtn,
  );

  const questionsSection = document.createElement("section");
  questionsSection.className = "questions-section";

  const questionsHeader = document.createElement("div");
  questionsHeader.className = "questions-header";
  const questionsTitle = document.createElement("h2");
  questionsTitle.className = "quiz-section-title";
  questionsTitle.textContent = "Questions";
  const questionsCount = document.createElement("span");
  questionsCount.className = "questions-count";
  questionsCount.textContent = "0";
  questionsHeader.append(questionsTitle, questionsCount);

  const questionsList = document.createElement("ul");
  questionsList.className = "quiz-list";

  const addForm = document.createElement("form");
  addForm.className = "account-settings-block add-question-form";

  const formTitle = document.createElement("h2");
  formTitle.textContent = "Ajouter une question";
  const formHint = document.createElement("p");
  formHint.className = "auth-hint add-question-hint";
  formHint.textContent =
    "Renseignez au moins 2 réponses et cochez la bonne.";
  addForm.append(formTitle, formHint);

  const mainRow = document.createElement("div");
  mainRow.className = "add-question-row";

  const labelField = document.createElement("label");
  labelField.textContent = "Question";
  const labelInput = document.createElement("input");
  labelInput.type = "text";
  labelInput.required = true;
  labelInput.placeholder = "Ex. Quelle est la capitale de l'Australie ?";
  labelField.append(labelInput);

  const timerField = document.createElement("label");
  timerField.className = "add-question-timer";
  timerField.textContent = "Durée (s)";
  const timerInput = document.createElement("input");
  timerInput.type = "number";
  timerInput.min = "5";
  timerInput.max = "120";
  timerInput.value = "20";
  timerField.append(timerInput);

  mainRow.append(labelField, timerField);

  const answersWrap = document.createElement("fieldset");
  answersWrap.className = "answers-wrap";
  const answersLegend = document.createElement("legend");
  answersLegend.textContent = "Réponses";
  answersWrap.append(answersLegend);

  const answerFields = [];
  for (let i = 0; i < 4; i++) {
    const row = document.createElement("div");
    row.className = "answer-row";
    row.style.setProperty("--answer-color", `var(--answer-${i + 1})`);

    const textInput = document.createElement("input");
    textInput.type = "text";
    textInput.placeholder = i < 2 ? `Réponse ${i + 1}` : `Réponse ${i + 1} (optionnelle)`;
    textInput.setAttribute("aria-label", `Réponse ${i + 1}`);
    if (i < 2) textInput.required = true;

    const correctLabel = document.createElement("label");
    correctLabel.className = "correct-label";
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "correct-answer";
    radio.value = String(i);
    if (i === 0) radio.checked = true;
    const correctText = document.createElement("span");
    correctText.textContent = "Bonne réponse";
    correctLabel.append(radio, correctText);

    row.append(textInput, correctLabel);
    answersWrap.append(row);
    answerFields.push({ textInput, radio });
  }

  const errorEl = document.createElement("p");
  errorEl.className = "error";
  errorEl.hidden = true;

  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.className = "btn btn-primary";
  submitBtn.textContent = "Ajouter la question";

  const backLink = createBackLink({ to: "/quizzes", label: "Retour à mes quiz" });

  addForm.append(mainRow, answersWrap, errorEl, submitBtn);
  questionsSection.append(questionsHeader, questionsList, addForm);
  main.append(backLink, hero, notice, settingsForm, questionsSection);
  container.append(page);

  let currentQuiz = null;

  getQuiz(quizId)
    .then((data) => {
      currentQuiz = data.quiz;
      heading.textContent = currentQuiz.title;
      titleInput.value = currentQuiz.title;
      descInput.value = currentQuiz.description ?? "";
      publishCheckbox.checked = Boolean(currentQuiz.is_published);
      return renderQuestions(currentQuiz, questionsList, errorEl, questionsCount);
    })
    .catch((err) => {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
    });

  settingsForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    settingsError.hidden = true;

    try {
      const data = await updateQuiz(quizId, {
        title: titleInput.value.trim(),
        description: descInput.value.trim() || null,
        is_published: publishCheckbox.checked,
      });
      currentQuiz = data.quiz;
      heading.textContent = currentQuiz.title;
      publishCheckbox.checked = Boolean(currentQuiz.is_published);
    } catch (err) {
      settingsError.textContent = err.message;
      settingsError.hidden = false;
    }
  });

  addForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.hidden = true;

    const answers = answerFields
      .map((field, index) => ({
        label: field.textInput.value.trim(),
        is_correct: field.radio.checked,
        index,
      }))
      .filter((a) => a.label);

    if (answers.length < 2) {
      errorEl.textContent = "Au moins 2 réponses sont requises";
      errorEl.hidden = false;
      return;
    }

    try {
      await addQuestion(quizId, {
        label: labelInput.value.trim(),
        timer_seconds: Number(timerInput.value) || 20,
        order_index: currentQuiz?.questions?.length ?? 0,
        answers: answers.map(({ label, is_correct }) => ({ label, is_correct })),
      });

      labelInput.value = "";
      answerFields.forEach((field, i) => {
        field.textInput.value = "";
        field.radio.checked = i === 0;
      });

      const data = await getQuiz(quizId);
      currentQuiz = data.quiz;
      await renderQuestions(currentQuiz, questionsList, errorEl, questionsCount);
      labelInput.focus();
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
    }
  });
}
