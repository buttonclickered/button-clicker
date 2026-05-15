console.log("Script loaded");

const result = document.getElementById('result');
const rolledsEl = document.getElementById('rolleds');
const cps = document.getElementById('CPS');

let points = 0;
let rolltimes = 0
let autoclick = 0; 

let commonRolled = 0;
let uncommonRolled = 0;
let rareRolled = 0;
let epicRolled = 0;
let legendaryRolled = 0;

const commonRolledEl = document.getElementById('commonrolled');
const uncommonRolledEl = document.getElementById('uncommonrolled');
const rareRolledEl = document.getElementById('rarerolled');
const epicRolledEl = document.getElementById('epicrolled');
const legendaryRolledEl = document.getElementById('legendaryrolled');

let common = 1;
let uncommon = 2;
let rare = 3;
let epic = 5;
let legendary = 9;

let cooldown = 1;

// persisted state
let rollCount = 0;

function formatNumber(num) {
    if (num < 1000) return num;
    const units = ['k', 'M', 'B', 'T', 'Q'];
    let unitIndex = -1;
    while (num >= 1000 && unitIndex < units.length - 1) {
        num /= 1000;
        unitIndex++;
    }
    return num.toFixed(1) + units[unitIndex];
}

function addauto(amount,cost) {
  if (points >= cost) {
    autoclick = autoclick + amount;
    points -= cost;
    document.getElementById('money').innerHTML = 'Points: ' + formatNumber(points);
    saveState();
  } else {
    showNotification('Not enough points!');
  }}

function hide(Element) {
    Element.style.opacity = '0';
    Element.style.pointerEvents = 'none';
}
function show(Element) {
    Element.style.opacity = '1';
    Element.style.pointerEvents = 'auto';
}
hide(result);
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

function showNotification(message) {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.style.display = 'block';
  setTimeout(() => {
    notification.style.display = 'none';
  }, 2000);
}
function roll() {
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

    // increment persisted roll count and update UI
    rollCount += 1;
    if (rolledsEl) rolledsEl.innerHTML = 'Rolls: ' + formatNumber(rollCount);

    console.log("Rolled!");

    show(result);
    let randomNumber = secureRandomInt(1, 100);
if (randomNumber <= 50) {
    result.innerHTML = 'You got: ' + "Common";
    points += common;
    commonRolled += 1;
    commonRolledEl.innerHTML = 'Common: ' + formatNumber(commonRolled);
} else if (randomNumber > 50 && randomNumber <= 75) {
    result.innerHTML = 'You got: ' + "Uncommon";
    points += uncommon;
    uncommonRolled += 1;
    uncommonRolledEl.innerHTML = 'Uncommon: ' + formatNumber(uncommonRolled);
} else if (randomNumber > 75 && randomNumber <= 90) {
    result.innerHTML = 'You got: ' + "‌​‌​‌​‌​‌​Rare";
    points += rare;
    rareRolled += 1;
    rareRolledEl.innerHTML = 'Rare: ' + formatNumber(rareRolled);
} else if (randomNumber > 90 && randomNumber <= 99) {
    result.innerHTML = 'You got: ' + "Epic";
    points += epic;
    epicRolled += 1;
    epicRolledEl.innerHTML = 'Epic: ' + formatNumber(epicRolled);
} else if (randomNumber === 100) {
    result.innerHTML = 'You got: ' + "Legendary";
    points += legendary;
    legendaryRolled += 1;
    legendaryRolledEl.innerHTML = 'Legendary: ' + formatNumber(legendaryRolled);
}
    document.getElementById('money').innerHTML = 'Points: ' + formatNumber(points);
    // persist immediately after each roll
    saveState();
}

function rollNoDelay() {
    // enforce cooldown: disable button for `cooldown` seconds to prevent spamming
    const rngButton = document.getElementById('roll');
    rngButton.disabled = true;
    rngButton.style.opacity = '0.6';
    setTimeout(() => {
        rngButton.disabled = false;
        rngButton.style.opacity = '1';
    }, cooldown * 1000);

    // increment persisted roll count and update UI
    rollCount += 1;
    if (rolledsEl) rolledsEl.innerHTML = 'Rolls: ' + formatNumber(rollCount);

    console.log("Rolled!");

    show(result);
    let randomNumber = secureRandomInt(1, 100);
if (randomNumber <= 50) {
    result.innerHTML = 'You got: ' + "Common";
    points += common;
    commonRolled += 1;
    commonRolledEl.innerHTML = 'Common: ' + formatNumber(commonRolled);
} else if (randomNumber > 50 && randomNumber <= 75) {
    result.innerHTML = 'You got: ' + "Uncommon";
    points += uncommon;
    uncommonRolled += 1;
    uncommonRolledEl.innerHTML = 'Uncommon: ' + formatNumber(uncommonRolled);
} else if (randomNumber > 75 && randomNumber <= 90) {
    result.innerHTML = 'You got: ' + "‌​‌​‌​‌​‌​Rare";
    points += rare;
    rareRolled += 1;
    rareRolledEl.innerHTML = 'Rare: ' + formatNumber(rareRolled);
} else if (randomNumber > 90 && randomNumber <= 99) {
    result.innerHTML = 'You got: ' + "Epic";
    points += epic;
    epicRolled += 1;
    epicRolledEl.innerHTML = 'Epic: ' + formatNumber(epicRolled);
} else if (randomNumber === 100) {
    result.innerHTML = 'You got: ' + "Legendary";
    points += legendary;
    legendaryRolled += 1;
    legendaryRolledEl.innerHTML = 'Legendary: ' + formatNumber(legendaryRolled);
}
    document.getElementById('money').innerHTML = 'Points: ' + formatNumber(points);
    // persist immediately after each roll
    saveState();
}
// Save and load state using localStorage
function saveState() {
    try {
        localStorage.setItem('points', String(points));
        localStorage.setItem('rollCount', String(rollCount));
        localStorage.setItem('autoclick', String(autoclick));
        localStorage.setItem('commonRolled', String(commonRolled));
        localStorage.setItem('uncommonRolled', String(uncommonRolled));
        localStorage.setItem('rareRolled', String(rareRolled));
        localStorage.setItem('epicRolled', String(epicRolled));
        localStorage.setItem('legendaryRolled', String(legendaryRolled));
    } catch (e) {
        console.warn('Could not save state to localStorage', e);
    }
}

function loadState() {
    try {
        const p = localStorage.getItem('points');
        const r = localStorage.getItem('rollCount');
        const a = localStorage.getItem('autoclick');
        commonRolled = Number(localStorage.getItem('commonRolled')) || 0;
        uncommonRolled = Number(localStorage.getItem('uncommonRolled')) || 0;
        rareRolled = Number(localStorage.getItem('rareRolled')) || 0;
        epicRolled = Number(localStorage.getItem('epicRolled')) || 0;
        legendaryRolled = Number(localStorage.getItem('legendaryRolled')) || 0;

        commonRolledEl.innerHTML = 'Common: ' + formatNumber(commonRolled);
        uncommonRolledEl.innerHTML = 'Uncommon: ' + formatNumber(uncommonRolled);
        rareRolledEl.innerHTML = 'Rare: ' + formatNumber(rareRolled);
        epicRolledEl.innerHTML = 'Epic: ' + formatNumber(epicRolled);
        legendaryRolledEl.innerHTML = 'Legendary: ' + formatNumber(legendaryRolled);
        if (a !== null) autoclick = Number(a) || 0;
        if (p !== null) points = Number(p) || 0;
        if (r !== null) rollCount = Number(r) || 0;
    } catch (e) {
        console.warn('Could not load state from localStorage', e);
    }
    // update UI
    const moneyEl = document.getElementById('money');

    if (moneyEl) moneyEl.innerHTML = 'Points: ' + formatNumber(points);
    if (rolledsEl) rolledsEl.innerHTML = 'Rolls: ' + formatNumber(rollCount);
    if (cps) cps.innerHTML = 'Auto Rolls Per Second: ' + formatNumber(autoclick);
}

function don() {
    if (points > 0) {
        const gamble = secureRandomInt(1, 2);
        if (gamble === 1) {
            points *= 2;
        showNotification('You won! Your points have been doubled to ' + formatNumber(points));
        } else {
            points = 0;
            showNotification('You lost! Your points have been reset to 0');
        }
        document.getElementById('money').innerHTML = 'Points: ' + formatNumber(points);
        saveState();
    } else {
    }
}

// load saved state on script run
loadState();

// persist on unload as a fallback
window.addEventListener('beforeunload', saveState);

// block context menu (existing behavior)
document.addEventListener('contextmenu', (event) => {
  event.preventDefault(); // blocks the context menu
});

setInterval(() => {
    const startTime = Date.now();
    rolltimes = 0;
    while (rolltimes < autoclick && (Date.now() - startTime) < 900) {
        rolltimes++;
        rollNoDelay();
    }

    cps.innerHTML = 'Auto Rolls Per Second: ' + formatNumber(autoclick);
    document.getElementById('money').innerHTML = 'Points: ' + formatNumber(points);
    saveState();
}, 1000);
setInterval(() => {
 cps.innerHTML = 'Auto Rolls Per Second: ' + formatNumber(autoclick);
}, 75);