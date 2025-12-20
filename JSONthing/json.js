// Get the output element
const output = document.getElementById("output");

// Run when a file is selected
function displayOutput() {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0]; // get the first selected file

  if (!file) {
    output.textContent = "No file selected!";
    return;
  }

  const reader = new FileReader();

  reader.onload = function(e) {
    try {
      // e.target.result contains the file text
      const fileText = e.target.result;
      
      // Parse the JSON text into an object
      const data = JSON.parse(fileText);

      // Grab the "text" field and show it
      output.textContent = data.text;
    } catch (err) {
      // If JSON is invalid or text missing
      output.textContent = "Invalid JSON file";
      console.error(err);
    }
  };

  // Actually read the file as text
  reader.readAsText(file);
}

// Listen for file selection changes
document.getElementById("fileInput")
  .addEventListener("change", displayOutput);

function submit() {
  const text = document.getElementById("jsonInput").value;
  const data = { text: text };
  const jsonString = JSON.stringify(data, null, 2);

  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "data.json";
  a.click();

  URL.revokeObjectURL(url);
}
