// Disable right-click context menu for the whole page
document.addEventListener('contextmenu', function(e) {
  e.preventDefault();
});

// Load saved values or use defaults
let idk = Number(localStorage.getItem('idk')) || 0;
let persec = Number(localStorage.getItem('persec')) || 0;
let perclick = Number(localStorage.getItem('perclick')) || 1;
let intervalId = null;
const headerDiv = document.getElementById("header");
const APS = document.getElementById("APS");
const CPS = document.getElementById("CPS");

function saveGame() {
  localStorage.setItem('idk', idk);
  localStorage.setItem('persec', persec);
  localStorage.setItem('perclick', perclick);
}
 const infobox = document.getElementById('infobox');
function updateHeader() {
  headerDiv.textContent = idk;
  saveGame();
}


function Add() {
  idk = idk + perclick;
  updateHeader();
}


function startPerSecond() {
  if (intervalId !== null) return;
  intervalId = setInterval(() => {
    idk += persec;
    updateHeader();
  }, 1000);
}

// Update APS and CPS display every 100ms for faster feedback
setInterval(() => {
  APS.textContent = 'Money Per Second: ' + persec;
  CPS.textContent = 'Money Per Click: ' + perclick;
}, 100);

function showNotification(message) {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.style.display = 'block';
  setTimeout(() => {
    notification.style.display = 'none';
  }, 2000);
}

function addsec(amount,cost) {
  if (idk >= cost) {
    persec = persec + amount;
    idk -= cost;
    updateHeader();
    saveGame();
  } else {
    showNotification('Not enough money!');
  }
}
function addclick(amount,cost) {
  if (idk >= cost) {
    perclick = perclick + amount;
    idk -= cost;
    updateHeader();
    saveGame();
  } else {
    showNotification('Not enough money!');
  }
}
function roll() {
  const amountEl = document.getElementById('amount');
  const amountStr = amountEl.innerText || amountEl.textContent;
  const amount = Number(amountStr);

  console.log("amountStr:", amountStr);
  console.log("amount:", amount);

  if (isNaN(amount) || amount <= 0) {
    showNotification('Invalid bet amount!');
    return;
  }
  if (amount > idk) {
    showNotification('Not enough money!');
    return;
  }

  let random = Math.floor(Math.random() * 2);
  if (random === 0) {
    idk += amount;
    showNotification('You won!');
  } else {
    idk -= amount;
    showNotification('You lost!');
  }

  updateHeader();
  saveGame();
}
let opened = 0;
function info() {
  if (opened === 0) {
   alert("If you want to play the knockoff version, click the button again.");
    opened = 1;
  } else {
    window.location.href = "https://sahebsinghdhatt-eng.github.io/school/";
    opened = 0;
  }
}
function closeinfo() {
  const infobox = document.getElementById('infobox');
  infobox.style.display = 'none';
  infobox.textContent = "";
  infobox.style.backgroundColor = "transparent";
}

// On first load, update header to show loaded values
updateHeader();
startPerSecond();