// Read id from querystring, fetch JSON and display details
const params = new URLSearchParams(location.search);
const id = params.get('id');
const jsonFilePath = 'JSONS/levels.json';

const container = document.getElementById('level-detail');

if (!id) {
    container.innerHTML = '<p>No id provided in the URL.</p>';
} else {
    fetch(jsonFilePath)
        .then(r => {
            if (!r.ok) throw new Error('Could not fetch JSON');
            return r.json();
        })
        .then(list => {
            const item = list.find(x => String(x.id) === String(id));
            if (!item) {
                container.innerHTML = '<p>Level not found.</p>';
                return;
            }

            const title = document.createElement('h1');
            title.textContent = item.level;
            title.style.textAlign = 'center';

            const points = document.createElement('h3');
            points.textContent = `${Number(item.points) || item.points} points`;
            points.style.textAlign = 'center';

            const verifier = document.createElement('p');
            verifier.innerHTML = `<strong>Verifier:</strong> ${item.verifier || '—'}`;

            const victors = document.createElement('p');
            const vict = Array.isArray(item.victors) && item.victors.length ? item.victors.join(', ') : 'None';
            victors.innerHTML = `<strong>Victors:</strong> ${vict}`;

            container.appendChild(title);
            container.appendChild(points);
            container.appendChild(verifier);
            container.appendChild(victors);
        })
        .catch(err => {
            container.innerHTML = `<p>Error loading details: ${err.message}</p>`;
        });
}
