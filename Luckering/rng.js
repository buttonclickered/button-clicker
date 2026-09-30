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
    { name: "Legendary",    points: 9,       p: 9e-3 },
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
];

const WEIGHTED_COUNT = 4; // Common, Uncommon, Rare, Epic
const WEIGHT_TOTAL = RARITIES.slice(0, WEIGHTED_COUNT).reduce((s, r) => s + r.weight, 0);

RARITIES.forEach((r) => {
    r.id = r.name.toLowerCase();
    r.rolled = 0;
    r.el = document.getElementById(r.id + "rolled");
});

// ===== Elements =====
const result = document.getElementById('result');
const rolledsEl = document.getElementById('rolleds');
const cps = document.getElementById('CPS');
const moneyEl = document.getElementById('money');

// ===== State =====
let points = 0;
let autoclick = 0;
let rollCount = 0;
let cooldown = 1; // seconds between manual rolls
let blocked = false; // true when another tab has taken over

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
function formatNumber(num) {
    if (num < 1000) return num;
    if (num >= 1e18) return num.toExponential(2).replace('+', '');
    const units = ['k', 'M', 'B', 'T', 'Q'];
    let unitIndex = -1;
    while (num >= 1000 && unitIndex < units.length - 1) {
        num /= 1000;
        unitIndex++;
    }
    return num.toFixed(1) + units[unitIndex];
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

// ===== Picking a rarity =====
// A single random float only has ~1e-16 precision, so tiers rarer than 1e-9
// are done as two independent checks whose probabilities multiply to p.
function pickRarity(rand) {
    for (let i = RARITIES.length - 1; i >= WEIGHTED_COUNT; i--) {
        const p = RARITIES[i].p;
        if (p < 1e-9) {
            const s = Math.sqrt(p);
            if (rand() < s && rand() < s) return i;
        } else if (rand() < p) {
            return i;
        }
    }
    let r = rand() * WEIGHT_TOTAL;
    for (let i = 0; i < WEIGHTED_COUNT; i++) {
        r -= RARITIES[i].weight;
        if (r < 0) return i;
    }
    return 0;
}

// ===== Auto rolls: expected-value system (no per-roll simulation) =====
// Auto rolls don't roll one by one. Each rarity gets its expected share of the
// rolls (rolls * chance), and the leftover fraction carries over to the next
// second. So at 100 rolls/s you get about 1 Legendary every second, and a
// 1-in-1M tier at 1,000 rolls/s shows up about every 1,000 seconds.
// A little jitter keeps it from feeling robotic.
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
        acc[i] += n * RARITIES[i].p * jitter();
        const take = Math.min(Math.floor(acc[i]), remaining);
        acc[i] -= take;
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
}

function updateCPS() {
    setText(cps, 'Auto Rolls Per Second: ' + formatNumber(autoclick));
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
    points += r.points;

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
        points += delta[i] * RARITIES[i].points;
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
        if (p !== null) points = Number(p) || 0;
        if (r !== null) rollCount = Number(r) || 0;
    } catch (e) {
        console.warn('Could not load state from localStorage', e);
    }
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