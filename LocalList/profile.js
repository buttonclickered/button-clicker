const params = new URLSearchParams(location.search);
const name = params.get('name');
const jsonFilePath = 'JSONS/levels.json';
const container = document.getElementById('profile-content');

if (!name) {
    container.innerHTML = '<p>No profile name provided.</p>';
} else {
    fetch(jsonFilePath)
        .then(r => {
            if (!r.ok) throw new Error('Could not fetch JSON');
            return r.json();
        })
        .then(list => {
            const person = {
                name,
                points: 0,
                verifications: 0,
                victors: 0,
                verifiedLevels: [],
                victorLevels: [],
                seenLevelIds: new Set()
            };

            list.forEach(item => {
                const pts = Number(item.points) || 0;
                const isVerifier = item.verifier === name;
                const isVictor = Array.isArray(item.victors) && item.victors.includes(name);

                if (isVerifier) {
                    person.verifications += 1;
                    person.verifiedLevels.push(item);
                }
                if (isVictor) {
                    person.victors += 1;
                    person.victorLevels.push(item);
                }
                if ((isVerifier || isVictor) && !person.seenLevelIds.has(item.id)) {
                    person.points += pts;
                    person.seenLevelIds.add(item.id);
                }
            });

            // Build a people map so we can compute global ranks
            const people = {};
            function ensurePerson(n) {
                if (!n) return null;
                if (!people[n]) people[n] = { name: n, points: 0, verifications: 0, victors: 0, seen: new Set() };
                return people[n];
            }

            list.forEach(item => {
                const pts = Number(item.points) || 0;
                if (item.verifier) {
                    const p = ensurePerson(item.verifier);
                    if (p && !p.seen.has(item.id)) {
                        p.points += pts;
                        p.seen.add(item.id);
                    }
                    if (p) p.verifications = (p.verifications || 0) + 1;
                }
                if (Array.isArray(item.victors)) {
                    item.victors.forEach(v => {
                        const p = ensurePerson(v);
                        if (p && !p.seen.has(item.id)) {
                            p.points += pts;
                            p.seen.add(item.id);
                        }
                        if (p) p.victors = (p.victors || 0) + 1;
                    });
                }
            });

            const peopleArray = Object.values(people);
            peopleArray.sort((a, b) => {
                const pointsDiff = b.points - a.points;
                if (pointsDiff !== 0) return pointsDiff;
                const verifyDiff = (b.verifications || 0) - (a.verifications || 0);
                if (verifyDiff !== 0) return verifyDiff;
                return a.name.localeCompare(b.name);
            });

            const rankIndex = peopleArray.findIndex(p => p.name === name);
            const rankText = rankIndex >= 0 ? `#${rankIndex + 1}` : 'Unranked';

            const title = document.createElement('h1');
            title.textContent = name;
            title.style.textAlign = 'center';

            const summary = document.createElement('p');
            summary.innerHTML = `<strong>Rank:</strong> ${rankText} <br><strong>Points:</strong> ${person.points} <br><strong>Verifications:</strong> ${person.verifications} <br><strong>Victors:</strong> ${person.victors}`;

            // Compute hardest ever beaten or verified (highest points among completed levels)
            let hardest = null;
            const addHardestCandidate = it => {
                const pts = Number(it.points) || 0;
                if (!hardest || pts > (Number(hardest.points) || 0)) {
                    hardest = it;
                }
            };

            // Include both victor and verified levels, but avoid duplicates by item id.
            const uniqueCompleted = new Set();
            person.verifiedLevels.forEach(it => {
                if (!uniqueCompleted.has(it.id)) {
                    uniqueCompleted.add(it.id);
                    addHardestCandidate(it);
                }
            });
            person.victorLevels.forEach(it => {
                if (!uniqueCompleted.has(it.id)) {
                    uniqueCompleted.add(it.id);
                    addHardestCandidate(it);
                }
            });

            const hardestSection = document.createElement('div');
            hardestSection.className = 'detail-section';
            const hardestTitle = document.createElement('h2');
            hardestTitle.textContent = 'Hardest Ever Beaten';
            hardestSection.appendChild(hardestTitle);
            const hardestContent = document.createElement('p');
            if (hardest) {
                const link = document.createElement('a');
                link.href = `level.html?id=${encodeURIComponent(hardest.id)}`;
                link.textContent = `${hardest.level} (${hardest.points} points)`;
                hardestContent.appendChild(link);
            } else {
                hardestContent.textContent = 'None';
            }
            hardestSection.appendChild(hardestContent);

            const verifiedSection = document.createElement('div');
            verifiedSection.className = 'detail-section';
            const verifiedTitle = document.createElement('h2');
            verifiedTitle.textContent = 'Verified Levels';
            verifiedSection.appendChild(verifiedTitle);
            const verifiedList = document.createElement('ul');
            if (person.verifiedLevels.length) {
                person.verifiedLevels.forEach(item => {
                    const li = document.createElement('li');
                    const link = document.createElement('a');
                    link.href = `level.html?id=${encodeURIComponent(item.id)}`;
                    link.textContent = `${item.level} (${item.points} points)`;
                    li.appendChild(link);
                    verifiedList.appendChild(li);
                });
            } else {
                verifiedList.innerHTML = '<li>None</li>';
            }
            verifiedSection.appendChild(verifiedList);

            const victorSection = document.createElement('div');
            victorSection.className = 'detail-section';
            const victorTitle = document.createElement('h2');
            victorTitle.textContent = 'Victor Levels';
            victorSection.appendChild(victorTitle);
            const victorList = document.createElement('ul');
            if (person.victorLevels.length) {
                person.victorLevels.forEach(item => {
                    const li = document.createElement('li');
                    const link = document.createElement('a');
                    link.href = `level.html?id=${encodeURIComponent(item.id)}`;
                    link.textContent = `${item.level} (${item.points} points)`;
                    li.appendChild(link);
                    victorList.appendChild(li);
                });
            } else {
                victorList.innerHTML = '<li>None</li>';
            }
            victorSection.appendChild(victorList);

            container.appendChild(title);
            container.appendChild(summary);
            container.appendChild(hardestSection);
            container.appendChild(verifiedSection);
            container.appendChild(victorSection);
        })
        .catch(err => {
            container.innerHTML = `<p>Error loading profile: ${err.message}</p>`;
        });
}
