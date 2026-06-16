// Path to your JSON file
const jsonFilePath = 'JSONS/levels.json';

function createProfileLink(name) {
    const link = document.createElement('a');
    link.href = `profile.html?name=${encodeURIComponent(name)}`;
    link.textContent = name;
    link.className = 'person-link';
    return link;
}

function addPerson(people, name, role, points, item) {
    if (!name) return;

    if (!people[name]) {
        people[name] = {
            name,
            points: 0,
            verifications: 0,
            victors: 0,
            verifiedLevels: [],
            victorLevels: [],
            seenLevelIds: new Set()
        };
    }

    const person = people[name];

    if (!person.seenLevelIds.has(item.id)) {
        person.points += points;
        person.seenLevelIds.add(item.id);
    }

    if (role === 'verifier') {
        person.verifications += 1;
        person.verifiedLevels.push(item);
    }

    if (role === 'victor') {
        person.victors += 1;
        person.victorLevels.push(item);
    }
}

// Fetch the data from the file path
fetch(jsonFilePath)
    .then(response => {
        if (!response.ok) {
            throw new Error(`Could not fetch file: ${response.status}`);
        }
        return response.json();
    })
    .then(gdLevels => {
        if (!Array.isArray(gdLevels)) throw new Error('JSON did not return an array');

        gdLevels.sort((a, b) => Number(b.points) - Number(a.points));

        const people = {};
        gdLevels.forEach(item => {
            const points = Number(item.points) || 0;
            addPerson(people, item.verifier, 'verifier', points, item);
            if (Array.isArray(item.victors)) {
                item.victors.forEach(victor => {
                    addPerson(people, victor, 'victor', points, item);
                });
            }
        });

        let listContainer = document.getElementById('level-list');
        if (!listContainer) {
            console.warn('No #level-list element found — creating one');
            listContainer = document.createElement('ol');
            listContainer.id = 'level-list';
            document.body.appendChild(listContainer);
        }

        gdLevels.forEach((item, idx) => {
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = `level.html?id=${encodeURIComponent(item.id)}`;
            link.className = 'level-link';
            // thumbnail (png -> jpg fallback). images are in project root /Thumbnails
            const img = document.createElement('img');
            img.className = 'level-thumb';
            let thumbTried = 0;
            img.onerror = () => {
                if (thumbTried === 0) {
                    thumbTried = 1;
                    img.src = `thumbnails/${encodeURIComponent(item.id)}.jpg`;
                } else {
                    img.remove();
                }
            };
            img.src = `thumbnails/${encodeURIComponent(item.id)}.png`;

            const title = document.createElement('h2');
            const rank = idx + 1;
            title.textContent = `#${rank} - ${item.level}`;

            const points = document.createElement('h3');
            const pts = Number(item.points);
            points.textContent = `${isNaN(pts) ? item.points : pts} points`;

            const details = document.createElement('p');
            details.className = 'level-meta';
            details.appendChild(document.createTextNode('Verifier: '));
            details.appendChild(createProfileLink(item.verifier || 'Unknown'));

            if (Array.isArray(item.victors) && item.victors.length) {
                details.appendChild(document.createTextNode(' • Victors: '));
                item.victors.forEach((victor, index) => {
                    details.appendChild(createProfileLink(victor));
                    if (index < item.victors.length - 1) {
                        details.appendChild(document.createTextNode(', '));
                    }
                });
            }

            // group the textual content so the thumbnail can sit to the right
            const content = document.createElement('div');
            content.className = 'level-content';
            content.appendChild(title);
            content.appendChild(points);
            content.appendChild(details);

            link.appendChild(content);
            // thumbnail sits to the right and will scale until constrained
            link.appendChild(img);
            listItem.appendChild(link);
            listContainer.appendChild(listItem);
        });

        const leaderboardContainer = document.getElementById('leaderboard');
        if (leaderboardContainer) {
                const peopleArray = Object.values(people);
                peopleArray.sort((a, b) => {
                    const pointsDiff = b.points - a.points;
                    if (pointsDiff !== 0) return pointsDiff;
                    const verifyDiff = b.verifications - a.verifications;
                    if (verifyDiff !== 0) return verifyDiff;
                    return a.name.localeCompare(b.name);
                });

                peopleArray.forEach((person, idx) => {
                    const item = document.createElement('li');

                    const rankSpan = document.createElement('span');
                    rankSpan.className = 'rank-badge';
                    rankSpan.textContent = `#${idx + 1}`;
                    item.appendChild(rankSpan);

                    const personLink = createProfileLink(person.name);
                    item.appendChild(personLink);

                    const summary = document.createElement('span');
                    summary.textContent = ` — ${person.points} points, ${person.verifications} verifications, ${person.victors} victors`;
                    item.appendChild(summary);
                    leaderboardContainer.appendChild(item);
                });
        }
    })
    .catch(error => {
        console.error('Error loading the GD levels:', error);
    });
