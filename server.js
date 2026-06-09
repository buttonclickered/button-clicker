const express = require("express");
const cors = require("cors");

const app = express();

// IMPORTANT: allows your website to talk to this server
app.use(cors({
  origin: "https://buttonclicker.ca"
}));

app.use(express.json());

// In-memory leaderboard storage (resets if server restarts)
let leaderboards = {
  easy: [],
  medium: [],
  hard: []
};

// =====================
// GET leaderboard
// =====================
app.get("/leaderboard/:mode", (req, res) => {
  const mode = req.params.mode;

  if (!leaderboards[mode]) {
    return res.json([]);
  }

  // sort highest score first
  const sorted = leaderboards[mode]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  res.json(sorted);
});

// =====================
// POST score
// =====================
app.post("/leaderboard/:mode", (req, res) => {
  const mode = req.params.mode;

  const { name, score } = req.body;

  if (!leaderboards[mode]) {
    leaderboards[mode] = [];
  }

  if (!name || typeof score !== "number") {
    return res.status(400).json({ error: "Invalid data" });
  }

  leaderboards[mode].push({
    name,
    score,
    time: Date.now()
  });

  res.json({ success: true });
});

// =====================
// START SERVER (IMPORTANT for Render)
// =====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Leaderboard running on port " + PORT);
});