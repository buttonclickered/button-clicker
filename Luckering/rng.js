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
    { name: "Eldritch", points: 5000000000, p: 1e-28 },
    { name: "Abyssal", points: 10000000000, p: 1e-29 },
    { name: "Sovereign", points: 25000000000, p: 1e-30 },
    { name: "Empyrean", points: 50000000000, p: 1e-31 },
    { name: "Seraphic", points: 100000000000, p: 1e-32 },
    { name: "Primeval", points: 250000000000, p: 1e-33 },
    { name: "Axiom", points: 500000000000, p: 1e-34 },
    { name: "Nexus", points: 1000000000000, p: 1e-35 },
    { name: "Zenith", points: 2500000000000, p: 1e-36 },
    { name: "Apex", points: 5000000000000, p: 1e-37 },
    { name: "Infinitum", points: 10000000000000, p: 1e-38 },
    { name: "Omega", points: 25000000000000, p: 1e-39 },
    { name: "Alpha", points: 50000000000000, p: 1e-40 },
    { name: "Paragon", points: 100000000000000, p: 1e-41 },
    { name: "Ascendant", points: 250000000000000, p: 1e-42 },
    { name: "Cataclysm", points: 500000000000000, p: 1e-43 },
    { name: "Oblivion", points: 1000000000000000, p: 1e-44 },
    { name: "Everlasting", points: 2500000000000000, p: 1e-45 },
    { name: "Beyond", points: 5000000000000000, p: 1e-46 },
    { name: "Finality", points: 10000000000000000, p: 1e-47 },
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
    if (m) SHOP.push({ el: b, amount: Number(m[1]), cost: Number(m[2]) });
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
// Upgrade effects (set by recomputeUpgrades)
let ownedUp = [];        // ids of owned upgrades
let upPointMult = 1;     // total points multiplier from upgrades
let autoMult = 1;        // multiplier on auto rolls per second
let rollsPerClick = 1;   // rolls per manual click
let bonusLuck = 0;       // extra luck added
let luckMulti = 1;       // luck multiplier
let donChance = 0.5;     // Double Or Nothing win chance
let achPct = 0.02;       // points bonus per achievement
let extraTiers = 0;      // autoclicker tiers created after buying the top one
let autoCarry = 0;       // leftover fraction of auto rolls

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
            // at astronomically big numbers the leftover is just rounding noise
            if (!(n >= 0 && n < N)) n = 0;
        }
        next[i] = newInterval(i);
        // n is now smaller than 3 intervals, so this can only loop a few times.
        // The counter makes sure a bad number can never freeze the page.
        for (let guard = 0; n >= next[i] && guard < 10; guard++) {
            n -= next[i];
            hits++;
            next[i] = newInterval(i);
        }
        if (n >= next[i]) n = 0;
    }
    next[i] -= n;
    if (!(next[i] > 0)) next[i] = newInterval(i); // never leave a broken countdown
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
    setText(bonusEl, 'Points Multiplier: x' + pointMult().toFixed(2));
    setText(rollInfoEl, 'Rolls per click: ' + rollsPerClick + ' | Cooldown: ' + cooldown.toFixed(1) + 's');
    setText(luckBtn, luckLevel >= MAX_LUCK
        ? 'Luck MAXED (x' + luckMult().toFixed(1) + ')'
        : 'Luck +10% (Level ' + luckLevel + '/' + MAX_LUCK + ') - ' + formatNumber(luckCost()) + ' points');
    for (const s of SHOP) greyOut(s.el, points < s.cost);
    greyOut(luckBtn, luckLevel >= MAX_LUCK || points < luckCost());
    greyOut(donBtn, points <= 0);
    updateUpgradeButtons();
}

function greyOut(el, cant) {
    if (el && el._cant !== cant) {
        el._cant = cant;
        el.classList.toggle('cant', cant);
    }
}

function updateCPS() {
    setText(cps, 'Auto Rolls Per Second: ' + formatNumber(Math.floor(autoclick * autoMult)));
}

// ===== Luck, bonuses, achievements =====
// Luck multiplies the odds of Legendary and above (not Common..Epic).
function luckMult() { return (1 + 0.1 * luckLevel + bonusLuck) * luckMulti; }
function luckCost() { return Math.floor(500 * Math.pow(1.6, luckLevel)); }
// Every unlocked achievement gives +2% points.
function pointMult() { return (1 + achPct * unlocked.length) * upPointMult; }

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
        ['points', 'rollCount', 'autoclick', 'luckLevel', 'donWins', 'achievements', 'upgrades', 'extraTiers']
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

// ===== Upgrades (50) =====
// Built from a few chains. Each tier needs the one before it.
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
const UPGRADES = [];

function addChain(prefix, title, count, baseCost, costMul, make) {
    for (let k = 0; k < count; k++) {
        const u = make(k);
        u.id = prefix + (k + 1);
        u.name = title + ' ' + ROMAN[k];
        u.cost = Math.round(baseCost * Math.pow(costMul, k));
        u.req = k > 0 ? prefix + k : null;
        UPGRADES.push(u);
    }
}

// 10: points x1.5 each
addChain('pm', 'Point Boost', 10, 5e3, 8, () => ({ type: 'points', value: 1.5, desc: 'Points x1.5' }));
// 8: auto rolls x1.5 each
addChain('am', 'Auto Boost', 8, 2e4, 10, () => ({ type: 'auto', value: 1.5, desc: 'Auto rolls x1.5' }));
// 8: roll cooldown 0.9s down to 0.2s
addChain('cd', 'Quick Roll', 8, 1e3, 4, (k) => {
    const v = +(0.9 - 0.1 * k).toFixed(1);
    return { type: 'cooldown', value: v, desc: 'Roll cooldown ' + v + 's' };
});
// 6: more rolls per click
addChain('mr', 'Multi-Roll', 6, 1e4, 10, (k) => {
    const v = [2, 3, 5, 8, 12, 20][k];
    return { type: 'multi', value: v, desc: 'Each click rolls ' + v + ' times' };
});
// 6: +0.5 luck each
addChain('lb', 'Luck Boost', 6, 5e3, 6, () => ({ type: 'luck', value: 0.5, desc: '+0.5 luck' }));
// 5: better Double Or Nothing odds
addChain('dn', 'Better Odds', 5, 1e3, 5, (k) => {
    const v = +(0.55 + 0.05 * k).toFixed(2);
    return { type: 'odds', value: v, desc: 'Double Or Nothing wins ' + Math.round(v * 100) + '%' };
});
// 4: bigger achievement bonus
addChain('ab', 'Trophy Case', 4, 1e5, 20, (k) => {
    const v = [0.03, 0.04, 0.05, 0.06][k];
    return { type: 'ach', value: v, desc: 'Achievements give +' + Math.round(v * 100) + '% points each' };
});
// 3: luck multipliers
addChain('lm', 'Lucky Aura', 3, 1e7, 100, (k) => {
    const v = [1.25, 1.5, 2][k];
    return { type: 'luckmult', value: v, desc: 'Luck x' + v };
});

function recomputeUpgrades() {
    let pm = 1, am = 1, cd = 1, mr = 1, bl = 0, dc = 0.5, ap = 0.02, lm = 1;
    UPGRADES.forEach((u) => {
        if (!ownedUp.includes(u.id)) return;
        if (u.type === 'points') pm *= u.value;
        else if (u.type === 'auto') am *= u.value;
        else if (u.type === 'cooldown') cd = Math.min(cd, u.value);
        else if (u.type === 'multi') mr = Math.max(mr, u.value);
        else if (u.type === 'luck') bl += u.value;
        else if (u.type === 'odds') dc = Math.max(dc, u.value);
        else if (u.type === 'ach') ap = Math.max(ap, u.value);
        else if (u.type === 'luckmult') lm *= u.value;
    });
    upPointMult = pm; autoMult = am; cooldown = cd; rollsPerClick = mr;
    bonusLuck = bl; donChance = dc; achPct = ap; luckMulti = lm;
}

function upgradeState(u) {
    if (ownedUp.includes(u.id)) return 'owned';
    if (u.req && !ownedUp.includes(u.req)) return 'locked';
    return points < u.cost ? 'cant' : 'ok';
}

function renderUpgrades() {
    const box = document.getElementById('upgrades');
    if (!box) return;
    box.innerHTML = '';
    UPGRADES.forEach((u) => {
        const b = document.createElement('button');
        b.className = 'upgrade';
        b.addEventListener('click', () => buyUpgrade(u.id));
        box.appendChild(b);
        u.btn = b;
        u._state = null; // forces a refresh in updateUpgradeButtons
    });
}

function updateUpgradeButtons() {
    for (const u of UPGRADES) {
        if (!u.btn) continue;
        const s = upgradeState(u);
        if (u._state === s) continue;
        u._state = s;
        u.btn.classList.toggle('owned', s === 'owned');
        u.btn.classList.toggle('cant', s === 'cant' || s === 'locked');
        u.btn.textContent = u.name + ': ' + u.desc + (s === 'owned' ? ' (owned)' : ' (' + formatNumber(u.cost) + ' points)');
    }
}

function buyUpgrade(id) {
    if (blocked) return;
    const u = UPGRADES.find((x) => x.id === id);
    if (!u) return;
    const s = upgradeState(u);
    if (s === 'owned') { showNotification('You already own that'); return; }
    if (s === 'locked') { showNotification('Buy ' + UPGRADES.find((x) => x.id === u.req).name + ' first'); return; }
    if (s === 'cant') { showNotification('Not enough points!'); return; }
    points -= u.cost;
    const oldLuck = luckMult();
    ownedUp.push(u.id);
    recomputeUpgrades();
    const f = oldLuck / luckMult(); // luck changes speed up the current countdowns
    for (let i = WEIGHTED_COUNT; i < RARITIES.length; i++) next[i] *= f;
    updateUI();
    updateCPS();
    saveState();
}

const rollInfoEl = document.getElementById('rollinfo');

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

    let best = 0;
    for (let k = 0; k < rollsPerClick; k++) {
        const i = pickRarity(secureRandomFloat);
        RARITIES[i].rolled += 1;
        points += RARITIES[i].points * pointMult();
        if (i > best) best = i;
    }
    rollCount += rollsPerClick;

    show(result);
    result.innerHTML = 'You got: ' + RARITIES[best].name + (rollsPerClick > 1 ? ' (best of ' + rollsPerClick + ')' : '');
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
    if (!Number.isFinite(points)) points = 1e300;
    if (!Number.isFinite(rollCount)) rollCount = 1e300;
    updateUI();
}

function autoRollTick() {
    if (!blocked) {
        // If the tab was throttled in the background, catch up in one batch
        const ticks = Math.max(1, Math.floor((performance.now() - nextAutoRollTime) / 1000) + 1);
        autoCarry += autoclick * autoMult * ticks;
        const n = Math.floor(autoCarry);
        autoCarry -= n;
        if (n > 0) simulateRolls(n);
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
// Adds a new top autoclicker: double the auto rolls for double the price.
function addShopTier(silent) {
    const top = SHOP[SHOP.length - 1];
    if (!top) return;
    const amount = top.amount * 2;
    const cost = top.cost * 2;
    if (!Number.isFinite(amount) || !Number.isFinite(cost)) return;
    const b = document.createElement('button');
    b.className = 'upgrade';
    b.textContent = formatNumber(amount) + ' CPS Autoclicker (' + formatNumber(cost) + ' points)';
    b.addEventListener('click', () => addauto(amount, cost));
    top.el.insertAdjacentElement('afterend', b);
    SHOP.push({ el: b, amount: amount, cost: cost });
    extraTiers += 1;
    if (!silent) saveState();
}

function addauto(amount, cost) {
    if (blocked) return;
    if (points >= cost) {
        autoclick = autoclick + amount;
        points -= cost;
        // bought the top one? unlock a new top one (double rolls, double price)
        const top = SHOP[SHOP.length - 1];
        if (top && top.amount === amount && top.cost === cost) addShopTier(true);
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
        if (secureRandomFloat() < donChance) {
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
        localStorage.setItem('upgrades', JSON.stringify(ownedUp));
        localStorage.setItem('extraTiers', String(extraTiers));
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
        const up = JSON.parse(localStorage.getItem('upgrades') || '[]');
        ownedUp = Array.isArray(up) ? up : [];
        if (p !== null) points = Number(p) || 0;
        if (r !== null) rollCount = Number(r) || 0;
    } catch (e) {
        console.warn('Could not load state from localStorage', e);
    }
    const tiers = Math.min(Math.floor(Number(localStorage.getItem('extraTiers')) || 0), 2000);
    for (let k = 0; k < tiers; k++) addShopTier(true); // rebuild the extra autoclickers
    recomputeUpgrades();
    for (let i = WEIGHTED_COUNT; i < RARITIES.length; i++) next[i] = newInterval(i); // use loaded luck
    renderAchievements();
    renderUpgrades();
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

// ===== Cloud save + leaderboard (Supabase) =====
const SUPABASE_URL = 'https://zwoosenbneiywhhopzrg.supabase.co';
const SUPABASE_KEY = 'sb_publishable__TXkovSYBzRCrc9XKB72jA_4GDcZC1-'; // publishable key (safe to be public)
const CLOUD_EVERY_MS = 90 * 1000; // every 1 minute 30 seconds
const NAME_RE = /^[A-Za-z0-9 _.-]{3,16}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
let pushing = false;
let nameModalOpen = false;

function getPlayerId() {
    let id = localStorage.getItem('playerId');
    if (!id) {
        id = (window.crypto && crypto.randomUUID)
            ? crypto.randomUUID()
            : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                const r = Math.random() * 16 | 0;
                return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });
        localStorage.setItem('playerId', id);
    }
    return id;
}

async function sbRpc(fn, body, keepalive) {
    const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/' + fn, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY },
        body: JSON.stringify(body),
        keepalive: !!keepalive, // lets the last save finish while the page closes
    });
    if (!res.ok) throw new Error(await res.text());
    const text = await res.text();
    return text ? JSON.parse(text) : null;
}

function safeNum(x) { return Number.isFinite(x) ? Math.min(x, 1e300) : 1e300; }

// Everything needed to restore the game
function buildSave() {
    const rolled = {};
    RARITIES.forEach((r) => { if (r.rolled > 0) rolled[r.id] = safeNum(r.rolled); });
    return {
        points: safeNum(points), rollCount: safeNum(rollCount), autoclick: safeNum(autoclick),
        luckLevel: luckLevel, donWins: donWins, achievements: unlocked, upgrades: ownedUp, extraTiers: extraTiers, rolled: rolled,
    };
}

// Sends your save + leaderboard score. Returns 'ok', 'name_taken', 'bad_name',
// 'too_fast', 'error', 'noname' or 'skip'.
async function pushScore(keepalive) {
    if (blocked || pushing) return 'skip';
    const name = localStorage.getItem('playerName');
    if (!name) return 'noname';
    let best = 0;
    RARITIES.forEach((r, i) => { if (r.rolled > 0) best = i; });
    pushing = true;
    try {
        return await sbRpc('submit_score', {
            p_id: getPlayerId(),
            p_name: name,
            p_rarest: best,
            p_rolls: safeNum(rollCount),
            p_points: safeNum(points),
            p_save: buildSave(),
        }, keepalive);
    } catch (e) {
        console.warn(e);
        return 'error';
    } finally {
        pushing = false;
    }
}

// ----- username popup -----
function askName(message, allowCancel, prefill) {
    return new Promise((resolve) => {
        nameModalOpen = true;
        const wrap = document.createElement('div');
        wrap.id = 'namemodal';
        const box = document.createElement('div');
        box.className = 'box';
        const title = document.createElement('h2');
        title.textContent = 'Choose a username';
        const info = document.createElement('p');
        info.textContent = 'This is the name shown on the leaderboard. 3-16 letters, numbers, spaces, _ . or -';
        const input = document.createElement('input');
        input.maxLength = 16;
        input.value = prefill || '';
        const err = document.createElement('p');
        err.className = 'err';
        err.textContent = message || '';
        const ok = document.createElement('button');
        ok.textContent = 'Save';

        function done(value) {
            nameModalOpen = false;
            wrap.remove();
            resolve(value);
        }
        function submit() {
            const v = input.value.trim();
            if (!NAME_RE.test(v)) { err.textContent = 'Use 3-16 letters, numbers, spaces, _ . or -'; return; }
            done(v);
        }
        ok.addEventListener('click', submit);
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });

        box.append(title, info, input, err, ok);
        if (allowCancel) {
            const cancel = document.createElement('button');
            cancel.textContent = 'Cancel';
            cancel.addEventListener('click', () => done(null));
            box.append(cancel);
        }
        wrap.appendChild(box);
        document.body.appendChild(wrap);
        input.focus();
    });
}

async function setNameOnServer(name) {
    const old = localStorage.getItem('playerName');
    localStorage.setItem('playerName', name);
    const status = await pushScore(false);
    if (status === 'name_taken' || status === 'bad_name') { // roll back
        if (old) localStorage.setItem('playerName', old); else localStorage.removeItem('playerName');
    }
    return status;
}

// Asks until the server accepts a name. first = can't be cancelled.
async function chooseName(first, message) {
    let msg = message || '';
    for (;;) {
        const name = await askName(msg, !first, localStorage.getItem('playerName') || '');
        if (!name) return false;
        const status = await setNameOnServer(name);
        if (status === 'name_taken') { msg = 'That username is taken. Try another one.'; continue; }
        if (status === 'bad_name') { msg = 'That username is not allowed.'; continue; }
        reportSync(status);
        loadLeaderboard();
        return true;
    }
}

function changeName() {
    if (!nameModalOpen) chooseName(false);
}

// ----- auto sync every 90 seconds -----
function reportSync(status) {
    const el = document.getElementById('lbstatus');
    if (!el) return;
    if (status === 'ok') el.textContent = 'Saved online at ' + new Date().toLocaleTimeString() + '. Auto-saves every 90 seconds.';
    else if (status === 'error') el.textContent = 'Could not reach the server. Will try again in 90 seconds.';
}

async function cloudTick() {
    if (blocked || nameModalOpen) return;
    if (!localStorage.getItem('playerName')) {
        await chooseName(true); // first time: ask for a username (also saves right away)
        return;
    }
    const status = await pushScore(false);
    if (status === 'name_taken') {
        await chooseName(true, 'Your username was taken by someone else. Pick a new one.');
        return;
    }
    reportSync(status);
    loadLeaderboard();
}

setInterval(cloudTick, CLOUD_EVERY_MS);
// one last save when you leave the page
window.addEventListener('pagehide', () => { if (localStorage.getItem('playerName')) pushScore(true); });

// ----- leaderboard (ranked by rolls) -----
async function loadLeaderboard() {
    const list = document.getElementById('leaderboard');
    if (!list) return;
    try {
        const rows = await sbRpc('get_leaderboard', {});
        const me = (localStorage.getItem('playerName') || '').toLowerCase();
        list.innerHTML = '';
        rows.forEach((r) => {
            const li = document.createElement('li');
            const rare = RARITIES[r.rarest] ? RARITIES[r.rarest].name : '?';
            // textContent (not innerHTML) so nobody can inject code through a name
            li.textContent = r.name + ' - ' + formatNumber(r.rolls) + ' rolls (rarest: ' + rare + ')';
            if (me && r.name.toLowerCase() === me) li.className = 'me';
            list.appendChild(li);
        });
        if (!rows.length) list.textContent = 'No scores yet. Be the first!';
    } catch (e) {
        console.warn(e);
        list.textContent = 'Could not load leaderboard';
    }
}

// ----- save code: restore your progress on another device -----
function copySaveCode() {
    const box = document.getElementById('savecode');
    if (!box) return;
    box.select();
    if (navigator.clipboard) {
        navigator.clipboard.writeText(box.value).then(() => showNotification('Save code copied'), () => {});
    } else {
        document.execCommand('copy');
        showNotification('Save code copied');
    }
}

function applyCloudSave(code, name, s) {
    blocked = true; // stops this page from saving over the loaded data
    try {
        localStorage.setItem('playerId', code);
        localStorage.setItem('playerName', name);
        localStorage.setItem('points', String(Number(s.points) || 0));
        localStorage.setItem('rollCount', String(Number(s.rollCount) || 0));
        localStorage.setItem('autoclick', String(Number(s.autoclick) || 0));
        localStorage.setItem('luckLevel', String(Number(s.luckLevel) || 0));
        localStorage.setItem('donWins', String(Number(s.donWins) || 0));
        localStorage.setItem('extraTiers', String(Math.min(Number(s.extraTiers) || 0, 2000)));
        localStorage.setItem('achievements', JSON.stringify(Array.isArray(s.achievements) ? s.achievements : []));
        localStorage.setItem('upgrades', JSON.stringify(Array.isArray(s.upgrades) ? s.upgrades : []));
        const rolled = s.rolled || {};
        RARITIES.forEach((r) => localStorage.setItem(r.id + 'Rolled', String(Number(rolled[r.id]) || 0)));
    } catch (e) {
        console.warn(e);
    }
    location.reload();
}

async function loadFromCode() {
    const input = document.getElementById('loadcode');
    const code = (input ? input.value : '').trim().toLowerCase();
    if (!UUID_RE.test(code)) { showNotification('That is not a valid save code'); return; }
    try {
        const rows = await sbRpc('get_save', { p_id: code });
        if (!rows || !rows.length || !rows[0].save) { showNotification('No save found for that code'); return; }
        if (!confirm('This replaces the progress in this browser with the online save. Continue?')) return;
        applyCloudSave(code, rows[0].name, rows[0].save);
    } catch (e) {
        console.warn(e);
        showNotification('Could not load that save');
    }
}

const saveCodeEl = document.getElementById('savecode');
if (saveCodeEl) saveCodeEl.value = getPlayerId();
loadLeaderboard();