console.log("Script loaded");

// ===== Rarity table =====
// Common..Epic are picked by weight (50/25/15/9). Every tier after that is an
// independent "1 in X" check, tested from rarest to most common.
// The id (name in lowercase) is used for the HTML element id ("<id>rolled")
// and the localStorage key ("<id>Rolled"), so old saves keep working.
const RARITIES = [
    { name: "Common",       points: 1,       weight: 50 },
    { name: "Uncommon",     points: 2,       weight: 25 },
    { name: "Rare",         points: 3,       weight: 15 },
    { name: "Epic",         points: 5,       weight: 9 },
    { name: "Legendary",    points: 9,       p: 1e-2 },
    { name: "Galaxy",       points: 20,      p: 1e-3 },
    { name: "Celestial",    points: 50,      p: 1e-4 },
    { name: "Void",         points: 100,     p: 1e-5 },
    { name: "Infinite",     points: 250,     p: 1e-6 },
    { name: "Omniscient",   points: 500,     p: 1e-7 },
    { name: "Divine",       points: 1000,    p: 1e-8 },
    { name: "Cosmic",       points: 2500,    p: 1e-9 },
    { name: "Eternal",      points: 5000,    p: 1e-10 },
    { name: "Transcendent", points: 10000,   p: 1e-11 },
    { name: "Primordial",   points: 25000,   p: 1e-12 },
    { name: "Ethereal",     points: 50000,   p: 1e-13 },
    { name: "Paradox",      points: 100000,  p: 1e-14 },
    { name: "Singularity",  points: 250000,  p: 1e-15 },
    { name: "Genesis",      points: 500000,  p: 1e-16 },
    { name: "Absolute",     points: 1000000, p: 1e-17 },
    { name: "Mythic",       points: 2500000,    p: 1e-18 },
    { name: "Immortal",     points: 5000000,    p: 1e-19 },
    { name: "Arcane",       points: 10000000,   p: 1e-20 },
    { name: "Forbidden",    points: 25000000,   p: 1e-21 },
    { name: "Unfathomable", points: 50000000,   p: 1e-22 },
    { name: "Boundless",    points: 100000000,  p: 1e-23 },
    { name: "Timeless",     points: 250000000,  p: 1e-24 },
    { name: "Omnipotent",   points: 500000000,  p: 1e-25 },
    { name: "Multiversal",  points: 1000000000, p: 1e-26 },
    { name: "Ultimate",     points: 2500000000, p: 1e-27 },
];

const WEIGHTED_COUNT = 4; // Common, Uncommon, Rare, Epic
const WEIGHT_TOTAL = RARITIES.slice(0, WEIGHTED_COUNT).reduce((s, r) => s + r.weight, 0);

RARITIES.forEach((r) => {
    r.id = r.name.toLowerCase();
    r.rolled = 0;
    r.avg = r.p ? 1 / r.p : 0; // average rolls between drops
    r.el = document.getElementById(r.id + "rolled");
});

// ===== Elements =====
const result = document.getElementById('result');
const rolledsEl = document.getElementById('rolleds');
const cps = document.getElementById('CPS');
const moneyEl = document.getElementById('money');
const rarestEl = document.getElementById('rarest');
const luckEl = document.getElementById('luck');
const bonusEl = document.getElementById('bonus');
const luckBtn = document.getElementById('luckbtn');
const achTitleEl = document.getElementById('achtitle');
const donBtn = document.querySelector('button[onclick="don()"]');
// Shop buttons + their costs (read from each button's addauto(amount, cost))
const SHOP = [];
document.querySelectorAll('button.upgrade').forEach((b) => {
    const m = /addauto\(\s*(\d+)\s*,\s*(\d+)\s*\)/.exec(b.getAttribute('onclick') || '');
    if (m) SHOP.push({ el: b, cost: Number(m[2]) });
});

// ===== State =====
let points = 0;
let autoclick = 0;
let rollCount = 0;
let cooldown = 1; // seconds between manual rolls
let blocked = false; // true when another tab has taken over
let luckLevel = 0;   // each level = +10% luck (Legendary and above)
let donWins = 0;
let unlocked = [];   // ids of unlocked achievements
const MAX_LUCK = 50;

let lastAutoSaveTime = Date.now();
let nextAutoRollTime = performance.now() + 1000;

// ===== MULTI-TAB PREVENTION SYSTEM =====
const tabChannel = new BroadcastChannel('game_tab_validation');
const instanceId = Math.random().toString(36).substring(2); // Unique ID for this tab

function getOverlay() {
    let el = document.getElementById('duplicate-overlay');
    if (!el) {
        // Your HTML doesn't have one, so make a simple full-screen overlay.
        el = document.createElement('div');
        el.id = 'duplicate-overlay';
        el.textContent = 'This game is open in another tab. Close this tab, or reload it to play here.';
        el.style.cssText =
            'display:none;position:fixed;top:0;left:0;width:100%;height:100%;' +
            'background:rgba(0,0,0,0.92);color:#fff;font-size:1.6rem;' +
            'text-align:center;padding-top:30vh;z-index:99999;';
        document.body.appendChild(el);
    }
    return el;
}
const overlay = getOverlay();

function claimActiveTab() {
    // Tell all other open tabs that this new instance is taking over
    tabChannel.postMessage({ type: 'NEW_TAB_OPENED', id: instanceId });
    overlay.style.display = 'none';
}

tabChannel.onmessage = (event) => {
    // If another tab sends a takeover message, block this current tab
    if (event.data.type === 'NEW_TAB_OPENED' && event.data.id !== instanceId) {
        saveState(); // save before freezing to avoid data loss
        blocked = true; // after this, this tab can't roll or overwrite the save
        overlay.style.display = 'block';
    }
};

// Claim dominance immediately on load
claimActiveTab();
// ------------------------------------

// ===== Number formatting =====
// 1,500 -> 1.5k, then M, B, T, Qa, Qi, Sx, Sp, Oc, No, Dc, UDc, ... all the way
// up to the biggest number JavaScript can hold (no more 1e3487 style numbers).
const SMALL_NAMES = ['', 'k', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No'];
const NAME_UNITS = ['', 'U', 'D', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No'];
const NAME_TENS = ['', 'Dc', 'Vg', 'Tg', 'Qag', 'Qig', 'Sxg', 'Spg', 'Ocg', 'Nog', 'Ce'];

function numberSuffix(i) { // i = how many groups of 3 zeros
    if (i <= 10) return SMALL_NAMES[i];
    const n = i - 1; // 11 -> Dc (decillion), 12 -> UDc, 21 -> Vg ...
    return NAME_UNITS[n % 10] + NAME_TENS[Math.floor(n / 10)];
}

function formatNumber(num) {
    if (num < 1000) return Math.floor(num);
    if (!isFinite(num)) return 'Infinity';
    let i = Math.floor(Math.log10(num) / 3);
    let v = num / Math.pow(10, 3 * i);
    if (v >= 1000) { v /= 1000; i++; } else if (v < 1) { v *= 1000; i--; }
    v = Math.floor(v * 100) / 100; // floor so it never rounds up to 1000
    return v + numberSuffix(i);
}

// ===== Helpers =====
function hide(Element) {
    Element.style.opacity = '0';
    Element.style.pointerEvents = 'none';
}
function show(Element) {
    Element.style.opacity = '1';
    Element.style.pointerEvents = 'auto';
}
hide(result);

function showNotification(message) {
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.style.cssText =
            'display:none;position:fixed;top:20px;left:50%;transform:translateX(-50%);' +
            'background:#222;color:#fff;padding:12px 24px;border-radius:8px;z-index:9999;';
        document.body.appendChild(notification);
    }
    notification.textContent = message;
    notification.style.display = 'block';
    setTimeout(() => {
        notification.style.display = 'none';
    }, 2000);
}

function secureRandomInt(min, max) {
    if (window.crypto && window.crypto.getRandomValues) {
        const range = max - min + 1;
        const maxUint32 = 0xFFFFFFFF;
        const bucket = Math.floor((maxUint32 + 1) / range) * range;
        const arr = new Uint32Array(1);
        let rnd;
        do {
            window.crypto.getRandomValues(arr);
            rnd = arr[0];
        } while (rnd >= bucket);
        return min + (rnd % range);
    }
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Secure float in [0, 1) with 53 bits of precision (for manual rolls)
function secureRandomFloat() {
    if (window.crypto && window.crypto.getRandomValues) {
        const arr = new Uint32Array(2);
        window.crypto.getRandomValues(arr);
        return (arr[0] * 2097152 + (arr[1] >>> 11)) / 9007199254740992;
    }
    return Math.random();
}

// ===== Picking a rarity (weighted "due" system) =====
// Every rarity from Legendary up has a countdown. Its average is 1 / chance
// (Legendary = 100 rolls), but each time it resets to a random 50%-150% of that,
// so a Legendary shows up somewhere between roll 50 and roll 150.
// Common..Epic are still plain weighted random (50/25/15/9).
const SPREAD = 0.5; // 0.5 = 50%-150%. Lower = steadier, 0 = exactly on average.
const next = new Array(RARITIES.length).fill(0); // rolls left until each rarity drops

function newInterval(i) {
    const avg = RARITIES[i].avg / luckMult();
    return avg * (1 - SPREAD + 2 * SPREAD * Math.random());
}
for (let i = WEIGHTED_COUNT; i < RARITIES.length; i++) next[i] = newInterval(i);

function pickRarity(rand) {
    let hit = -1;
    for (let i = RARITIES.length - 1; i >= WEIGHTED_COUNT; i--) {
        next[i] -= 1;
        // if two are due on the same roll, the rarer one wins and the other
        // stays due and drops on the next roll
        if (next[i] <= 0 && hit === -1) {
            hit = i;
            next[i] = newInterval(i);
        }
    }
    if (hit !== -1) return hit;

    let r = rand() * WEIGHT_TOTAL;
    for (let i = 0; i < WEIGHTED_COUNT; i++) {
        r -= RARITIES[i].weight;
        if (r < 0) return i;
    }
    return 0;
}

// Uses up n rolls on one rarity's countdown and returns how many drops happened.
function consume(i, n) {
    const N = RARITIES[i].avg / luckMult();
    let hits = 0;
    if (n >= next[i]) {
        n -= next[i];
        hits = 1;
        if (n >= 3 * N) { // lots of drops at once: use the average instead of looping
            const k = Math.floor(n / N);
            hits += k;
            n -= k * N;
        }
        next[i] = newInterval(i);
        while (n >= next[i]) {
            n -= next[i];
            hits++;
            next[i] = newInterval(i);
        }
    }
    next[i] -= n;
    return hits;
}

// ===== Auto rolls (no per-roll simulation) =====
// Auto rolls use the same countdowns as manual rolls, just all at once:
// n rolls are taken off each rarity's countdown and every time it hits zero
// that's a drop. Huge speeds are handled with averages so it never lags.
// Uncommon/Rare/Epic get their expected share with a little jitter.
const AUTO_JITTER = 0.2; // +-20% per rarity each second. Set 0 for perfectly steady.
const acc = new Array(RARITIES.length).fill(0);

function jitter() {
    return 1 + (Math.random() * 2 - 1) * AUTO_JITTER;
}

function expectedRolls(n) {
    const delta = new Array(RARITIES.length).fill(0);
    let remaining = n;

    // Rare tiers (Legendary and up)
    for (let i = RARITIES.length - 1; i >= WEIGHTED_COUNT; i--) {
        const take = Math.min(consume(i, n), remaining);
        delta[i] = take;
        remaining -= take;
    }

    // Uncommon, Rare, Epic (Common gets whatever is left)
    for (let i = WEIGHTED_COUNT - 1; i >= 1; i--) {
        acc[i] += n * (RARITIES[i].weight / WEIGHT_TOTAL) * jitter();
        const take = Math.min(Math.floor(acc[i]), remaining);
        acc[i] -= take;
        delta[i] = take;
        remaining -= take;
    }
    delta[0] = remaining;
    return delta;
}

// ===== UI =====
// Only touches the DOM when the text actually changed (much less lag).
function setText(el, text) {
    if (el && el._last !== text) {
        el._last = text;
        el.textContent = text;
    }
}

function updateUI() {
    setText(moneyEl, 'Points: ' + formatNumber(points));
    setText(rolledsEl, 'Rolls: ' + formatNumber(rollCount));
    for (let i = 0; i < RARITIES.length; i++) {
        const r = RARITIES[i];
        setText(r.el, r.name + ': ' + formatNumber(r.rolled));
    }
    checkAchievements(false);
    let best = -1;
    for (let i = RARITIES.length - 1; i >= 0; i--) {
        if (RARITIES[i].rolled > 0) { best = i; break; }
    }
    setText(rarestEl, 'Rarest Roll: ' + (best >= 0 ? RARITIES[best].name : 'None'));
    setText(luckEl, 'Luck: x' + luckMult().toFixed(1));
    setText(bonusEl, 'Achievement Bonus: +' + (unlocked.length * 2) + '% points');
    setText(luckBtn, luckLevel >= MAX_LUCK
        ? 'Luck MAXED (x' + luckMult().toFixed(1) + ')'
        : 'Luck +10% (Level ' + luckLevel + '/' + MAX_LUCK + ') - ' + formatNumber(luckCost()) + ' points');
    for (const s of SHOP) greyOut(s.el, points < s.cost);
    greyOut(luckBtn, luckLevel >= MAX_LUCK || points < luckCost());
    greyOut(donBtn, points <= 0);
}

function greyOut(el, cant) {
    if (el && el._cant !== cant) {
        el._cant = cant;
        el.classList.toggle('cant', cant);
    }
}

function updateCPS() {
    setText(cps, 'Auto Rolls Per Second: ' + formatNumber(autoclick));
}

// ===== Luck, bonuses, achievements =====
// Luck multiplies the odds of Legendary and above (not Common..Epic).
function luckMult() { return 1 + 0.1 * luckLevel; }
function luckCost() { return Math.floor(500 * Math.pow(1.6, luckLevel)); }
// Every unlocked achievement gives +2% points.
function pointMult() { return 1 + 0.02 * unlocked.length; }

function buyluck() {
    if (blocked) return;
    if (luckLevel >= MAX_LUCK) { showNotification('Luck is maxed!'); return; }
    const cost = luckCost();
    if (points >= cost) {
        points -= cost;
        const oldLuck = luckMult();
        luckLevel += 1;
        const f = oldLuck / luckMult();
        for (let i = WEIGHTED_COUNT; i < RARITIES.length; i++) next[i] *= f;
        updateUI();
        saveState();
    } else {
        showNotification('Not enough points!');
    }
}

function hardReset() {
    if (!confirm('Reset ALL progress? This cannot be undone.')) return;
    blocked = true; // stops the page from saving again before the reload
    try {
        ['points', 'rollCount', 'autoclick', 'luckLevel', 'donWins', 'achievements']
            .forEach((k) => localStorage.removeItem(k));
        RARITIES.forEach((r) => localStorage.removeItem(r.id + 'Rolled'));
    } catch (e) {}
    location.reload();
}

const ACHIEVEMENTS = [
    { id: "first",  name: "First Roll",        desc: "Roll once",                     test: () => rollCount >= 1 },
    { id: "r100",   name: "Getting Started",   desc: "Roll 100 times",                test: () => rollCount >= 100 },
    { id: "r10k",   name: "Dedicated",         desc: "Roll 10,000 times",             test: () => rollCount >= 1e4 },
    { id: "r1m",    name: "Roll Machine",      desc: "Roll 1 million times",          test: () => rollCount >= 1e6 },
    { id: "r1b",    name: "Unstoppable",       desc: "Roll 1 billion times",          test: () => rollCount >= 1e9 },
    { id: "p1k",    name: "Pocket Change",     desc: "Have 1,000 points",             test: () => points >= 1e3 },
    { id: "p1m",    name: "Millionaire",       desc: "Have 1 million points",         test: () => points >= 1e6 },
    { id: "p1b",    name: "Billionaire",       desc: "Have 1 billion points",         test: () => points >= 1e9 },
    { id: "p1t",    name: "Trillionaire",      desc: "Have 1 trillion points",        test: () => points >= 1e12 },
    { id: "auto",   name: "Automation",        desc: "Buy an autoclicker",            test: () => autoclick >= 1 },
    { id: "auto1k", name: "Factory",           desc: "Reach 1k auto rolls/sec",       test: () => autoclick >= 1e3 },
    { id: "auto1m", name: "Industrial Age",    desc: "Reach 1M auto rolls/sec",       test: () => autoclick >= 1e6 },
    { id: "don1",   name: "Risk Taker",        desc: "Win Double Or Nothing",         test: () => donWins >= 1 },
    { id: "don5",   name: "High Roller",       desc: "Win Double Or Nothing 5 times", test: () => donWins >= 5 },
    { id: "luck5",  name: "Feeling Lucky",     desc: "Reach Luck level 5",            test: () => luckLevel >= 5 },
    { id: "luck25", name: "Clover Farm",       desc: "Reach Luck level 25",           test: () => luckLevel >= 25 },
    { id: "luck50", name: "Luck Maxed",        desc: "Reach Luck level 50",           test: () => luckLevel >= MAX_LUCK },
    { id: "col10",  name: "Collector",         desc: "Roll 10 different rarities",    test: () => RARITIES.filter((r) => r.rolled > 0).length >= 10 },
    { id: "col20",  name: "Hoarder",           desc: "Roll 20 different rarities",    test: () => RARITIES.filter((r) => r.rolled > 0).length >= 20 },
    { id: "colall", name: "Completionist",     desc: "Roll every rarity",             test: () => RARITIES.every((r) => r.rolled > 0) },
];
// One achievement for finding each rarity from Legendary up
RARITIES.forEach((r, i) => {
    if (i >= WEIGHTED_COUNT) {
        ACHIEVEMENTS.push({ id: "get_" + r.id, name: "Found " + r.name, desc: "Roll a " + r.name, test: () => r.rolled > 0 });
    }
});

function renderAchievements() {
    const box = document.getElementById('achievements');
    if (!box) return;
    box.innerHTML = '';
    ACHIEVEMENTS.forEach((a) => {
        const d = document.createElement('div');
        d.className = 'ach' + (unlocked.includes(a.id) ? ' done' : '');
        d.id = 'ach-' + a.id;
        const t = document.createElement('b');
        t.textContent = a.name;
        const s = document.createElement('span');
        s.textContent = a.desc;
        d.appendChild(t);
        d.appendChild(s);
        box.appendChild(d);
    });
}

function checkAchievements(silent) {
    let changed = false;
    for (const a of ACHIEVEMENTS) {
        if (unlocked.includes(a.id) || !a.test()) continue;
        unlocked.push(a.id);
        changed = true;
        const el = document.getElementById('ach-' + a.id);
        if (el) el.classList.add('done');
        if (!silent) showNotification('Achievement unlocked: ' + a.name);
    }
    if (changed) saveState();
    setText(achTitleEl, 'Achievements (' + unlocked.length + '/' + ACHIEVEMENTS.length + ')');
}

// ===== Manual roll =====
function roll() {
    if (blocked) return;

    // enforce cooldown: disable button for `cooldown` seconds to prevent spamming
    const rngButton = document.getElementById('roll');
    if (!rngButton) return;
    if (rngButton.disabled) return; // still cooling down
    rngButton.disabled = true;
    rngButton.style.opacity = '0.6';
    setTimeout(() => {
        rngButton.disabled = false;
        rngButton.style.opacity = '1';
    }, cooldown * 1000);

    console.log("Rolled!");

    const i = pickRarity(secureRandomFloat);
    const r = RARITIES[i];

    rollCount += 1;
    r.rolled += 1;
    points += r.points * pointMult();

    show(result);
    result.innerHTML = 'You got: ' + r.name;
    updateUI();
    saveState(); // persist immediately after each roll
}

// ===== Auto rolls =====
function simulateRolls(count) {
    if (count <= 0) return;

    const delta = expectedRolls(count);
    for (let i = 0; i < RARITIES.length; i++) {
        RARITIES[i].rolled += delta[i];
        points += delta[i] * RARITIES[i].points * pointMult();
    }
    rollCount += count;
    updateUI();
}

function autoRollTick() {
    if (!blocked) {
        // If the tab was throttled in the background, catch up in one batch
        const ticks = Math.max(1, Math.floor((performance.now() - nextAutoRollTime) / 1000) + 1);
        if (autoclick > 0) {
            simulateRolls(autoclick * ticks);
        }
        nextAutoRollTime += 1000 * ticks;

        updateCPS();
        const now = Date.now();
        if (now - lastAutoSaveTime >= 5000) {
            saveState();
            lastAutoSaveTime = now;
        }
    } else {
        nextAutoRollTime = performance.now() + 1000;
    }
    const delay = Math.max(0, nextAutoRollTime - performance.now());
    setTimeout(autoRollTick, delay);
}

// ===== Upgrades =====
function addauto(amount, cost) {
    if (blocked) return;
    if (points >= cost) {
        autoclick = autoclick + amount;
        points -= cost;
        updateUI();
        updateCPS();
        saveState();
    } else {
        showNotification('Not enough points!');
    }
}

// Double Or Nothing: 50% double all points, 50% lose them all
function don() {
    if (blocked) return;
    if (points > 0) {
        const gamble = secureRandomInt(1, 2);
        if (gamble === 1) {
            points *= 2;
            donWins += 1;
            showNotification('You won! Your points have been doubled to ' + formatNumber(points));
        } else {
            points = 0;
            showNotification('You lost! Your points have been reset to 0');
        }
        updateUI();
        saveState();
    }
}

// ===== Save and load state using localStorage =====
// Same keys as before, so existing saves still load.
function saveState() {
    if (blocked) return; // never overwrite the save from an inactive tab
    try {
        localStorage.setItem('points', String(points));
        localStorage.setItem('rollCount', String(rollCount));
        localStorage.setItem('autoclick', String(autoclick));
        localStorage.setItem('luckLevel', String(luckLevel));
        localStorage.setItem('donWins', String(donWins));
        localStorage.setItem('achievements', JSON.stringify(unlocked));
        RARITIES.forEach((r) => {
            localStorage.setItem(r.id + 'Rolled', String(r.rolled));
        });
    } catch (e) {
        console.warn('Could not save state to localStorage', e);
    }
}

function loadState() {
    try {
        const p = localStorage.getItem('points');
        const r = localStorage.getItem('rollCount');
        const a = localStorage.getItem('autoclick');
        RARITIES.forEach((rar) => {
            rar.rolled = Number(localStorage.getItem(rar.id + 'Rolled')) || 0;
        });
        if (a !== null) autoclick = Number(a) || 0;
        luckLevel = Math.min(MAX_LUCK, Number(localStorage.getItem('luckLevel')) || 0);
        donWins = Number(localStorage.getItem('donWins')) || 0;
        const ach = JSON.parse(localStorage.getItem('achievements') || '[]');
        unlocked = Array.isArray(ach) ? ach : [];
        if (p !== null) points = Number(p) || 0;
        if (r !== null) rollCount = Number(r) || 0;
    } catch (e) {
        console.warn('Could not load state from localStorage', e);
    }
    renderAchievements();
    checkAchievements(true); // silent: no popups for things you already earned
    updateUI();
    updateCPS();
}

// load saved state on script run
loadState();

// persist on unload as a fallback
window.addEventListener('beforeunload', saveState);

// block context menu (existing behavior)
document.addEventListener('contextmenu', (event) => {
    event.preventDefault();
});

autoRollTick();