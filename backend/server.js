require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./src/config/db");
const authRoutes = require("./src/routes/auth");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);

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

  app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
  });
}

start();
