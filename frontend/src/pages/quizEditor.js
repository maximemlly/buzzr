import {
  getQuiz,
  addQuestion,
  deleteQuestion,
} from "../services/api.js";
import { navigateTo } from "../utils/navigation.js";

async function renderQuestions(quiz, listEl, errorEl) {
  listEl.replaceChildren();

  if (quiz.questions.length === 0) {
    const empty = document.createElement("p");
    empty.className = "quiz-empty";
    empty.textContent = "Aucune question pour l'instant.";
    listEl.append(empty);
    return;
  }

  for (const question of quiz.questions) {
    const li = document.createElement("li");

    const label = document.createElement("span");
    label.textContent = question.label;

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn-danger";
    deleteBtn.textContent = "Supprimer";
    deleteBtn.addEventListener("click", async () => {
      if (!confirm("Supprimer cette question ?")) return;

      try {
        await deleteQuestion(quiz.id, question.id);
        const data = await getQuiz(quiz.id);
        await renderQuestions(data.quiz, listEl, errorEl);
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.hidden = false;
      }
    });

    li.append(label, deleteBtn);
    listEl.append(li);
  }
}

export function renderQuizEditor(container, quizId) {
  container.replaceChildren();

  const section = document.createElement("section");
  section.className = "dashboard";

  const heading = document.createElement("h1");
  heading.textContent = "Chargement…";

  const questionsTitle = document.createElement("h2");
  questionsTitle.textContent = "Questions";

  const questionsList = document.createElement("ul");
  questionsList.className = "quiz-list";

  const addForm = document.createElement("form");
  addForm.className = "auth-form";

  const formTitle = document.createElement("h2");
  formTitle.textContent = "Ajouter une question";
  addForm.append(formTitle);

  const labelField = document.createElement("label");
  labelField.textContent = "Question";
  const labelInput = document.createElement("input");
  labelInput.type = "text";
  labelInput.required = true;
  labelField.append(labelInput);

  const timerField = document.createElement("label");
  timerField.textContent = "Durée (secondes)";
  const timerInput = document.createElement("input");
  timerInput.type = "number";
  timerInput.min = "5";
  timerInput.value = "20";
  timerField.append(timerInput);

  const answersWrap = document.createElement("div");
  answersWrap.className = "answers-wrap";

  const answerFields = [];
  for (let i = 0; i < 4; i++) {
    const row = document.createElement("label");
    row.className = "answer-row";
    row.textContent = `Réponse ${i + 1}`;

    const textInput = document.createElement("input");
    textInput.type = "text";
    if (i < 2) textInput.required = true;

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "correct-answer";
    radio.value = String(i);
    if (i === 0) radio.checked = true;

    const correctLabel = document.createElement("span");
    correctLabel.textContent = "Correcte";
    correctLabel.className = "correct-label";

    row.append(textInput, correctLabel, radio);
    answersWrap.append(row);
    answerFields.push({ textInput, radio });
  }

  const errorEl = document.createElement("p");
  errorEl.className = "error";
  errorEl.hidden = true;

  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.textContent = "Ajouter la question";

  const backLink = document.createElement("a");
  backLink.href = "/dashboard";
  backLink.className = "auth-link";
  backLink.textContent = "Retour au dashboard";
  backLink.addEventListener("click", (e) => {
    e.preventDefault();
    navigateTo("/dashboard");
  });

  addForm.append(labelField, timerField, answersWrap, errorEl, submitBtn);
  section.append(heading, questionsTitle, questionsList, addForm, backLink);
  container.append(section);

  let currentQuiz = null;

  getQuiz(quizId)
    .then((data) => {
      currentQuiz = data.quiz;
      heading.textContent = currentQuiz.title;
      return renderQuestions(currentQuiz, questionsList, errorEl);
    })
    .catch((err) => {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
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
      await renderQuestions(currentQuiz, questionsList, errorEl);
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
    }
  });
}
