const urlParams = new URLSearchParams(window.location.search);
const queryValue = urlParams.get('query');
const resultsSpan = document.getElementById('results');
const displayQuery = document.getElementById('display-query');

if (queryValue) {
    displayQuery.textContent = queryValue;
    searchByFilename(queryValue.toLowerCase());
} else {
    displayQuery.textContent = "nothing";
}

async function searchByFilename(term) {
    resultsSpan.innerHTML = "Searching...";

    try {
        // 1. Fetch your JSON list of filenames
        const response = await fetch('Words/files.json');
        if (!response.ok) throw new Error("Could not find Words/files.json");
        
        const files = await response.json();
        resultsSpan.innerHTML = ""; // Clear "Searching..."

        // 2. Filter the list based on the filename
        const matches = files.filter(fileName => 
            fileName.toLowerCase().includes(term)
        );

        // 3. Display the matching filenames as links
        if (matches.length > 0) {
            matches.forEach(file => {
                const link = document.createElement('a');
                link.href = `Words/${file}`;
                // This shows "Apple" instead of "apple.html"
                link.textContent = file.replace('.html', ''); 
                
                link.style.display = "block";
                link.style.marginBottom = "8px";
                link.style.fontSize = "1.2rem";
                resultsSpan.appendChild(link);
            });
        } else {
            resultsSpan.textContent = "No filenames match your search.";
        }

    } catch (err) {
        console.error(err);
        resultsSpan.textContent = "Error: Could not load the file list.";
    }
}
