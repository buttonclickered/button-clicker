const express = require("express");
const fs = require("fs");
const app = express();

app.use(express.json());

const FILE = "leaderboard.json";

function load() {
    if (!fs.existsSync(FILE)) {
        return { easy: [], medium: [], hard: [] };
    }
    return JSON.parse(fs.readFileSync(FILE));
}

function save(data) {
    fs.writeFileSync(FILE, JSON.stringify(data));
}

app.get("/leaderboard/:mode", (req,res)=>{
    let data = load();
    res.json(data[req.params.mode] || []);
});

app.post("/leaderboard", (req,res)=>{
    let { name, mode, score } = req.body;

    let data = load();

    data[mode].push({ name, score });

    data[mode].sort((a,b)=>b.score-a.score);

    data[mode] = data[mode].slice(0,10);

    save(data);

    res.json({ ok:true });
});

app.listen(3000, ()=>console.log("Leaderboard running"));