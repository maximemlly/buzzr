require("dotenv").config();

const http = require("http");
const express = require("express");
const cors = require("cors");
const { getAllowedOrigins } = require("./src/config/cors");
const pool = require("./src/config/db");
const initSocket = require("./src/config/socket");
const authRoutes = require("./src/routes/auth");
const quizRoutes = require("./src/routes/quizzes");
const sessionRoutes = require("./src/routes/sessions");
const adminRoutes = require("./src/routes/admin");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: getAllowedOrigins() }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/admin", adminRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "Route introuvable" });
});

async function start() {
  try {
    await pool.query("SELECT 1");
    console.log("MySQL connecté");
  } catch (err) {
    console.error(
      "Impossible de se connecter à MySQL :",
      err.code,
      err.message,
      err.sqlMessage,
    );
    process.exit(1);
  }

  initSocket(server);

  server.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
  });
}

start();
