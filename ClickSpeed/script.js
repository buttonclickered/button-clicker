let customTest = document.querySelector('#Custom');
let customValue = 0;
let customDone = false;

customTest.addEventListener('click', () => {
  customValue = prompt("How long do you want the test to be? (in seconds)");

  customValue = Number(customValue);

  if (!isNaN(customValue) && customValue > 0) {
    customDone = true;
  } else {
    while (!customDone) {
      customValue = prompt("Please enter a valid number greater than 0.");
      customValue = Number(customValue);

      if (!isNaN(customValue) && customValue > 0) {
        customDone = true;
      }
    }
  }

  if (customDone) {
    alert("Started with " + customValue);
  }
});
