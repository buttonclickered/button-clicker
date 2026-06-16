// Path to your JSON file
const jsonFilePath = 'JSONS/levels.json';

// Fetch the data from the file path
fetch(jsonFilePath)
    .then(response => {
        // Check if the file was found successfully
        if (!response.ok) {
            throw new Error(`Could not fetch file: ${response.status}`);
        }
        return response.json(); // Convert raw text into a JS array
    })
    .then(gdLevels => {
        if (!Array.isArray(gdLevels)) throw new Error('JSON did not return an array');

        // 1. Sort levels from highest points (1st) to lowest points (last)
        gdLevels.sort((a, b) => Number(b.points) - Number(a.points));

        // 2. Target the HTML ordered list element
        let listContainer = document.getElementById('level-list');
        if (!listContainer) {
            console.warn('No #level-list element found — creating one');
            listContainer = document.createElement('ol');
            listContainer.id = 'level-list';
            document.body.appendChild(listContainer);
        }

        // 3. Loop through the sorted levels and add them to the HTML
        gdLevels.forEach((item, idx) => {
            const listItem = document.createElement('li');

            // Make the entire card a link to the detail page
            const link = document.createElement('a');
            link.href = `level.html?id=${encodeURIComponent(item.id)}`;
            link.className = 'level-link';

            const title = document.createElement('h2');
            const rank = idx + 1;
            title.textContent = `#${rank} - ${item.level}`;

            const points = document.createElement('h3');
            const pts = Number(item.points);
            points.textContent = `${isNaN(pts) ? item.points : pts} points`;

            link.appendChild(title);
            link.appendChild(points);
            listItem.appendChild(link);
            listContainer.appendChild(listItem);
            console.log('added', item.level, pts);
        });
    })
    .catch(error => {
        console.error('Error loading the GD levels:', error);
    });
