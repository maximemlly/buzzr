const MAX_QUESTION_POINTS = 1000;
const MIN_QUESTION_POINTS = 100;

function computeSpeedPoints(durationMs, remainingMs) {
  if (durationMs <= 0) return MIN_QUESTION_POINTS;

  const clampedRemaining = Math.max(0, Math.min(remainingMs, durationMs));
  const ratio = clampedRemaining / durationMs;

  return Math.round(
    MIN_QUESTION_POINTS + (MAX_QUESTION_POINTS - MIN_QUESTION_POINTS) * ratio,
  );
}

module.exports = {
  MAX_QUESTION_POINTS,
  MIN_QUESTION_POINTS,
  computeSpeedPoints,
};
