// Read id from querystring, fetch JSON and display details
const params = new URLSearchParams(location.search);
const id = params.get('id');
const jsonFilePath = 'JSONS/levels.json';

const container = document.getElementById('level-detail');

function createProfileLink(name) {
    if (!name) return document.createTextNode('—');
    const link = document.createElement('a');
    link.href = `profile.html?name=${encodeURIComponent(name)}`;
    link.textContent = name;
    link.className = 'person-link';
    return link;
}

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
            verifier.appendChild(document.createElement('strong')).textContent = 'Verifier: ';
            verifier.appendChild(createProfileLink(item.verifier));

            const victors = document.createElement('p');
            const strongVictors = document.createElement('strong');
            strongVictors.textContent = 'Victors: ';
            victors.appendChild(strongVictors);

            if (Array.isArray(item.victors) && item.victors.length) {
                item.victors.forEach((victor, index) => {
                    victors.appendChild(createProfileLink(victor));
                    if (index < item.victors.length - 1) {
                        victors.appendChild(document.createTextNode(', '));
                    }
                });
            } else {
                victors.appendChild(document.createTextNode('None'));
            }

            container.appendChild(title);
            container.appendChild(points);
            container.appendChild(verifier);
            container.appendChild(victors);
        })
        .catch(err => {
            container.innerHTML = `<p>Error loading details: ${err.message}</p>`;
        });
}
