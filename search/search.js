const urlParams = new URLSearchParams(window.location.search);
const queryValue = urlParams.get('query').toLowerCase();
const conjugateValue = urlParams.get('conjugate');
const resultsSpan = document.getElementById('results');
const displayQuery = document.getElementById('display-query');

if (queryValue) {
   // 
    displayQuery.textContent = queryValue;
    searchByFilename(queryValue.toLowerCase());
   
} else {
    displayQuery.textContent = "nothing";
}
if (conjugateValue === "on") {
    window.location.href = "Words/conjugator.html?word=" + encodeURIComponent(queryValue);
}

async function searchByFilename(term) {
    resultsSpan.innerHTML = "Searching...";

    try {
        // 1. Fetch your JSON list of filenames
        const response = await fetch('Words/files.json');
        if (!response.ok) throw new Error("Could not find Words/files.json");
        
        const files = await response.json();
        resultsSpan.innerHTML = ""; // Clear "Searching..."

        const results = await Promise.all(files.map(async fileName => {
            const lowerName = fileName.toLowerCase();
            const filenameMatch = lowerName.includes(term);
            let contentMatch = false;

            if (!filenameMatch) {
                try {
                    const fileResponse = await fetch(`Grammer/${fileName}`);
                    if (fileResponse.ok) {
                        const html = await fileResponse.text();
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(html, 'text/html');
                        const text = doc.body.textContent || '';
                        contentMatch = text.toLowerCase().includes(term);
                    }
                } catch (e) {
                    console.warn(`Unable to search contents of ${fileName}`, e);
                }
            }

            return { fileName, filenameMatch, contentMatch };
        }));

        const matches = results.filter(result => result.filenameMatch || result.contentMatch);

        if (matches.length > 0) {
            matches.forEach(({ fileName, filenameMatch, contentMatch }) => {
                const link = document.createElement('a');
                link.href = `Grammer/${fileName}`;
                link.textContent = fileName.replace('.html', '');
                link.style.display = 'block';
                link.style.marginBottom = '8px';
                link.style.fontSize = '1.2rem';

                if (!filenameMatch && contentMatch) {
                    const note = document.createElement('span');
                    note.style.fontSize = '0.9rem';
                    note.style.color = '#555';
                    link.appendChild(note);
                }

                resultsSpan.appendChild(link);
            });
        } else {
            resultsSpan.textContent = "No rules match your search.";
        }

    } catch (err) {
        console.error(err);
        resultsSpan.textContent = "Error: Could not load the file list.";
    }

    if (queryValue == "htm") {
        displayQuery.textContent = 'htm';
    }
}

function listRules() {
    window.location.href = "search_results.html?query=htm";
}
