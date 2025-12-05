
document.addEventListener('DOMContentLoaded', () => {
    const noteTitle = document.getElementById('note-title');
    const noteContent = document.getElementById('note-content');
  
    const saveButton = document.getElementById('save-note') || document.getElementById('save-button');
    const loadButton = document.getElementById('load-note') || document.getElementById('load-button');
    const loadTitle = document.getElementById('load-title');

    if (!noteTitle || !noteContent) {
        console.warn('Notes: missing `note-title` or `note-content` elements');
        return;
    }

    function keyBase(name) {
       
        const base = (name && String(name).trim()) || noteTitle.value.trim() || 'default';
        return 'note:' + base;
    }

    function saveNote(name) {
        const base = keyBase(name || (loadTitle && loadTitle.value));
        try {
            localStorage.setItem(base + ':Title', noteTitle.value);
            localStorage.setItem(base + ':Content', noteContent.value);
            alert('Note saved to "' + base + '"');
        } catch (e) {
            console.warn('Could not save note', e);
            alert('Unable to save note (storage may be disabled)');
        }
    }

    function loadNote(name) {
        const base = keyBase(name || (loadTitle && loadTitle.value));
        try {
            const savedTitle = localStorage.getItem(base + ':Title');
            const savedContent = localStorage.getItem(base + ':Content');
            if (savedTitle !== null) noteTitle.value = savedTitle;
            if (savedContent !== null) noteContent.value = savedContent;
            if (savedTitle === null && savedContent === null) alert('No saved note for "' + base + '"');
        } catch (e) {
            console.warn('Could not load note', e);
            alert('Unable to load note');
        }
    }

    if (saveButton) saveButton.addEventListener('click', () => saveNote());
    if (loadButton) loadButton.addEventListener('click', () => loadNote());

    if (loadTitle && loadTitle.value) {
        loadNote(loadTitle.value);
    } else {
     
        const defaultBase = keyBase('default');
        if (localStorage.getItem(defaultBase + ':Title') !== null || localStorage.getItem(defaultBase + ':Content') !== null) {
            loadNote('default');
        }
    }
});