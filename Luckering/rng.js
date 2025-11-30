console.log("Script loaded");

const result = document.getElementById('result');
const rolledsEl = document.getElementById('rolleds');
const cps = document.getElementById('CPS');

let points = 0;

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

function addauto(amount,cost) {
  if (points >= cost) {
    autoclick = autoclick + amount;
    points -= cost;
    document.getElementById('money').innerHTML = 'Points: ' + points;
    saveState();
  } else {
    alert('Not enough points!');
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
function roll() {
    // increment persisted roll count and update UI
    rollCount += 1;
    if (rolledsEl) rolledsEl.innerHTML = 'Rolls: ' + rollCount;

    const rngButton = document.getElementById('roll');
    console.log("Rolled!");

    show(result);
    let randomNumber = secureRandomInt(1, 100);
if (randomNumber <= 50) {
    result.innerHTML = 'You got: ' + "Common";
    points += common;
    commonRolled += 1;
    commonRolledEl.innerHTML = 'Common: ' + commonRolled;
} else if (randomNumber > 50 && randomNumber <= 75) {
    result.innerHTML = 'You got: ' + "Uncommon";
    points += uncommon;
    uncommonRolled += 1;
    uncommonRolledEl.innerHTML = 'Uncommon: ' + uncommonRolled;
} else if (randomNumber > 75 && randomNumber <= 90) {
    result.innerHTML = 'You got: ' + "‌​‌​‌​‌​‌​Rare";
    points += rare;
    rareRolled += 1;
    rareRolledEl.innerHTML = 'Rare: ' + rareRolled;
} else if (randomNumber > 90 && randomNumber <= 99) {
    result.innerHTML = 'You got: ' + "Epic";
    points += epic;
    epicRolled += 1;
    epicRolledEl.innerHTML = 'Epic: ' + epicRolled;
} else if (randomNumber === 100) {
    result.innerHTML = 'You got: ' + "Legendary";
    points += legendary;
    legendaryRolled += 1;
    legendaryRolledEl.innerHTML = 'Legendary: ' + legendaryRolled;
}
    document.getElementById('money').innerHTML = 'Points: ' + points;
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

        commonRolledEl.innerHTML = 'Common: ' + commonRolled;
        uncommonRolledEl.innerHTML = 'Uncommon: ' + uncommonRolled;
        rareRolledEl.innerHTML = 'Rare: ' + rareRolled;
        epicRolledEl.innerHTML = 'Epic: ' + epicRolled;
        legendaryRolledEl.innerHTML = 'Legendary: ' + legendaryRolled;
        if (a !== null) autoclick = Number(a) || 0;
        if (p !== null) points = Number(p) || 0;
        if (r !== null) rollCount = Number(r) || 0;
    } catch (e) {
        console.warn('Could not load state from localStorage', e);
    }
    // update UI
    const moneyEl = document.getElementById('money');

    if (moneyEl) moneyEl.innerHTML = 'Points: ' + points;
    if (rolledsEl) rolledsEl.innerHTML = 'Rolls: ' + rollCount;
    if (cps) cps.innerHTML = 'Auto Rolls Per Second: ' + autoclick;
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
 points += autoclick;
 cps.innerHTML = 'Auto Rolls Per Second: ' + autoclick;
 document.getElementById('money').innerHTML = 'Points: ' + points;
 saveState();
}, 1000);
setInterval(() => {
 cps.innerHTML = 'Auto Rolls Per Second: ' + autoclick;
}, 75);