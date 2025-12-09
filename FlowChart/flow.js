const questions = [
  "Does your shape have any right angles?",
  "Does your shape have any parallel sides?",
  "Does your shape have any lines of symmetry?",
];

document.addEventListener('DOMContentLoaded', () => {
  const yes = document.getElementById("Yes");
  const no = document.getElementById("No");
  const questionText = document.getElementById("Question");

  if (!yes || !no || !questionText) {
    console.warn('FlowChart: missing elements');
    return;
  }


  let state = 0; 
  let hasRightAngles = null; 

  questionText.innerText = questions[0];

  yes.addEventListener('click', () => {
    if (state === 0) {
      hasRightAngles = true;
      state = 2;
      questionText.innerText = questions[2]; 
      if (hasRightAngles) {
        questionText.innerText = "Your shape is Fred!";
      }
    } else if (state === 1) {
      if (!hasRightAngles) {
        questionText.innerText = "Your shape is Fredrick!";
      }
    }
  });

  no.addEventListener('click', () => {
    if (state === 0) {
      
      hasRightAngles = false;
      state = 1;
      questionText.innerText = questions[1]; 
    } else if (state === 2) {
      if (hasRightAngles) {
        questionText.innerText = "Your shape is Freddy!";
      }
    } else if (state === 1) {
      questionText.innerText = "Your shape is Fredrickton!";
    }
  });
});