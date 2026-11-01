// Read id from querystring, fetch JSON and display details
const params = new URLSearchParams(location.search);
const id = params.get('id');
const jsonFilePath = 'JSONS/levels.json';

const container = document.getElementById('level-detail');

async function loadLevelThumbnail(img, id) {
    const encodedId = encodeURIComponent(id);
    for (const extension of ['png', 'jpg']) {
        try {
            const response = await fetch(`thumbnails/${encodedId}.${extension}`);
            if (!response.ok) continue;

            const imageBlob = await response.blob();
            const header = new Uint8Array(await imageBlob.slice(0, 8).arrayBuffer());
            const mimeType = header[0] === 0xff && header[1] === 0xd8
                ? 'image/jpeg'
                : header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47
                    ? 'image/png'
                    : imageBlob.type;
            const objectUrl = URL.createObjectURL(new Blob([imageBlob], { type: mimeType }));

            img.onload = () => URL.revokeObjectURL(objectUrl);
            img.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                img.remove();
            };
            img.src = objectUrl;
            return;
        } catch {
            // Try the next supported image extension.
        }
    }
    img.remove();
}

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

            // Load either image extension and correct mislabeled image MIME types.
            const thumb = document.createElement('img');
            thumb.className = 'level-thumb';
            loadLevelThumbnail(thumb, item.id);
            thumb.style.display = 'block';
            thumb.style.margin = '0 auto 0.7rem auto';

            const points = document.createElement('h3');
            points.textContent = `${Number(item.points) || item.points} points`;
            points.style.textAlign = 'center';

            const idLine = document.createElement('p');
            idLine.style.textAlign = 'center';
            const idLabel = document.createElement('strong');
            idLabel.textContent = 'ID: ';
            const idButton = document.createElement('button');
            idButton.type = 'button';
            idButton.textContent = item.id;
            idButton.title = 'Copy level ID';
            idButton.style.background = 'none';
            idButton.style.border = 'none';
            idButton.style.color = '#007bff';
            idButton.style.cursor = 'pointer';
            idButton.style.padding = '0';
            idButton.style.textDecoration = 'underline';
            idButton.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(String(item.id));
                    idButton.textContent = 'Copied!';
                    setTimeout(() => {
                        idButton.textContent = item.id;
                    }, 1200);
                } catch (err) {
                    console.error('Could not copy level ID:', err);
                }
            });
            idLine.appendChild(idLabel);
            idLine.appendChild(idButton);

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

            const video = document.createElement('video');
            video.className = 'level-video';
            video.controls = true;
            video.preload = 'metadata';
            video.playsInline = true;
            video.style.display = 'block';
            video.style.margin = '1rem auto 0';
            video.onerror = () => {
                video.remove();
            };
            video.src = `videos/${encodeURIComponent(item.id)}.mp4`;

            container.appendChild(thumb);
            container.appendChild(title);
            container.appendChild(points);
            container.appendChild(idLine);
            container.appendChild(verifier);
            container.appendChild(victors);
            container.appendChild(video);
        })
        .catch(err => {
            container.innerHTML = `<p>Error loading details: ${err.message}</p>`;
        });
}
