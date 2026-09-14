function getAllowedOrigins() {
  const origin = process.env.CORS_ORIGIN;
  if (!origin || origin.trim() === "*" || origin.trim() === "") {
    return "*";
  }

  const list = origin
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean);

  if (list.length === 0) return "*";
  if (list.length === 1) return list[0];
  return list;
}

module.exports = { getAllowedOrigins };
