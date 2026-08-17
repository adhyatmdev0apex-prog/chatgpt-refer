// OpenExplorer v2 Unified Master Controller

const State = {
    files: [],
    filteredFiles: [],
    activeTab: 'files',
    games: [
        { id: 'poki', name: 'Poki Games', icon: '🟩', url: 'https://poki.com', embeddable: false },
        { id: 'crazygames', name: 'CrazyGames', icon: '🟥', url: 'https://www.crazygames.com', embeddable: false },
        { id: 'eagler', name: 'Eaglercraft Hub', icon: '🟦', url: 'https://eaglercraft.com', embeddable: true },
        { id: 'itch', name: 'itch.io Web Games', icon: '🟪', url: 'https://itch.io/games/free/web', embeddable: false }
    ],
    apps: [
        { id: 'notes', name: 'Quick Notepad', icon: '📝', type: 'internal-notes' },
        { id: 'calc', name: 'Calculator', icon: '🧮', type: 'internal-calc' }
    ]
};

// --- FILE TYPE DETECTOR ---
function detectType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    if (['png','jpg','jpeg','webp','gif','svg'].includes(ext)) return { category: 'image', icon: '🖼️', typeName: 'Image' };
    if (['mp4','webm','ogv','mov'].includes(ext)) return { category: 'video', icon: '🎬', typeName: 'Video' };
    if (['mp3','wav','aac','ogg','m4a','flac'].includes(ext)) return { category: 'audio', icon: '🎵', typeName: 'Audio' };
    if (['pdf'].includes(ext)) return { category: 'text', icon: '📕', typeName: 'PDF Document' };
    if (['txt','md','csv','log'].includes(ext)) return { category: 'text', icon: '📄', typeName: 'Text Document' };
    if (['js','html','css','py','json'].includes(ext)) return { category: 'code', icon: '💻', typeName: 'Code File' };
    if (['zip','tar','gz','7z'].includes(ext)) return { category: 'archive', icon: '📦', typeName: 'Archive' };
    return { category: 'binary', icon: '⚙️', typeName: 'Binary File' };
}

class AppController {
    constructor() {
        this.initRouter();
        this.initManifest();
        this.bindEvents();
        this.renderGames();
        this.renderApps();
    }

    // --- 🧭 HASH ROUTER ---
    initRouter() {
        const handleRoute = () => {
            const hash = window.location.hash.replace('#', '') || 'files';
            State.activeTab = hash;

            document.querySelectorAll('.tab-page').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));

            const activeSection = document.getElementById(`tab-${hash}`);
            const activeNav = document.querySelector(`.nav-btn[data-tab="${hash}"]`);

            if (activeSection) activeSection.classList.add('active');
            if (activeNav) activeNav.classList.add('active');

            if (hash === 'media') this.renderMedia();
        };

        window.addEventListener('hashchange', handleRoute);
        handleRoute();
    }

    // --- 📁 MANIFEST LOADER ---
    async initManifest() {
        try {
            const res = await fetch('./files.json');
            const data = await res.json();
            State.files = data.map(item => {
                const name = typeof item === 'string' ? item : item.name;
                const path = typeof item === 'string' ? `./files/${item}` : item.path;
                return { name, path, meta: detectType(name) };
            });
            State.filteredFiles = [...State.files];
            this.renderFiles();
        } catch (err) {
            console.error('Failed loading files.json', err);
        }
    }

    // --- 📁 RENDER FILES TAB ---
    renderFiles() {
        const grid = document.getElementById('files-grid');
        grid.innerHTML = '';

        State.filteredFiles.forEach(file => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-icon">${file.meta.icon}</div>
                <div class="card-title" title="${file.name}">${file.name}</div>
                <div class="card-sub">${file.meta.typeName}</div>
                <div class="card-btn-group">
                    <button class="btn btn-primary preview-btn">Preview</button>
                    <button class="btn btn-secondary download-btn">Download</button>
                </div>
            `;
            card.querySelector('.preview-btn').onclick = () => this.openFilePreview(file);
            card.querySelector('.download-btn').onclick = () => window.open(file.path, '_blank');
            grid.appendChild(card);
        });
    }

    // --- 🎮 RENDER GAMES TAB ---
    renderGames() {
        const grid = document.getElementById('games-grid');
        grid.innerHTML = '';
        State.games.forEach(game => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-icon">${game.icon}</div>
                <div class="card-title">${game.name}</div>
                <div class="card-sub">${game.embeddable ? 'Embed Available' : 'External Link'}</div>
                <div class="card-btn-group">
                    <button class="btn btn-primary play-btn">▶ Play</button>
                </div>
            `;
            card.querySelector('.play-btn').onclick = () => {
                if (game.embeddable) {
                    this.openIframeModal(game.name, game.url);
                } else {
                    window.open(game.url, '_blank');
                }
            };
            grid.appendChild(card);
        });
    }

    // --- 🖼️ RENDER MEDIA TAB ---
    renderMedia() {
        const imgGrid = document.getElementById('media-images-grid');
        const vidGrid = document.getElementById('media-videos-grid');
        const audGrid = document.getElementById('media-audio-grid');

        imgGrid.innerHTML = ''; vidGrid.innerHTML = ''; audGrid.innerHTML = '';

        State.files.forEach(file => {
            if (['image', 'video', 'audio'].includes(file.meta.category)) {
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <div class="card-icon">${file.meta.icon}</div>
                    <div class="card-title">${file.name}</div>
                `;
                card.onclick = () => this.openFilePreview(file);

                if (file.meta.category === 'image') imgGrid.appendChild(card);
                if (file.meta.category === 'video') vidGrid.appendChild(card);
                if (file.meta.category === 'audio') audGrid.appendChild(card);
            }
        });
    }

    // --- 🧩 RENDER APPS TAB ---
    renderApps() {
        const grid = document.getElementById('apps-grid');
        grid.innerHTML = '';
        State.apps.forEach(app => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-icon">${app.icon}</div>
                <div class="card-title">${app.name}</div>
                <div class="card-sub">Built-in App</div>
                <div class="card-btn-group">
                    <button class="btn btn-primary launch-btn">Launch</button>
                </div>
            `;
            card.querySelector('.launch-btn').onclick = () => this.launchApp(app);
            grid.appendChild(card);
        });
    }

    // --- 🔍 WEB SEARCH DISPATCHER ---
    bindEvents() {
        const fileSearchInput = document.getElementById('file-search-input');
        const categorySelect = document.getElementById('category-select');

        const filterHandler = () => {
            const query = fileSearchInput.value.toLowerCase();
            const cat = categorySelect.value;
            State.filteredFiles = State.files.filter(f => {
                const matchesQ = f.name.toLowerCase().includes(query);
                const matchesC = cat === 'all' || f.meta.category === cat;
                return matchesQ && matchesC;
            });
            this.renderFiles();
        };

        if (fileSearchInput) fileSearchInput.oninput = filterHandler;
        if (categorySelect) categorySelect.onchange = filterHandler;

        const webForm = document.getElementById('web-search-form');
        if (webForm) {
            webForm.onsubmit = (e) => {
                e.preventDefault();
                const q = document.getElementById('web-search-query').value;
                const engine = document.querySelector('input[name="engine"]:checked').value;
                let url = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
                if (engine === 'bing') url = `https://www.bing.com/search?q=${encodeURIComponent(q)}`;
                if (engine === 'duckduckgo') url = `https://duckduckgo.com/?q=${encodeURIComponent(q)}`;
                window.open(url, '_blank');
            };
        }

        document.getElementById('btn-close-modal').onclick = () => this.closeModal();
    }

    // --- 👁️ MODAL CONTROLLER ---
    async openFilePreview(file) {
        const titleEl = document.getElementById('preview-title');
        const bodyEl = document.getElementById('preview-body');
        const dlBtn = document.getElementById('btn-download');
        const extBtn = document.getElementById('btn-external-link');

        titleEl.textContent = file.name;
        dlBtn.onclick = () => window.open(file.path, '_blank');
        extBtn.classList.add('hidden');
        bodyEl.innerHTML = 'Loading viewer...';
        document.getElementById('preview-modal').classList.remove('hidden');

        if (file.meta.category === 'image') {
            bodyEl.innerHTML = `<img src="${file.path}" style="max-width:100%; max-height:100%; object-fit:contain;">`;
        } else if (['audio', 'video'].includes(file.meta.category)) {
            const tag = file.meta.category;
            bodyEl.innerHTML = `<${tag} src="${file.path}" controls autoplay style="width:90%; max-height:80%;"></${tag}>`;
        } else if (['text', 'code'].includes(file.meta.category)) {
            try {
                const res = await fetch(file.path);
                const text = await res.text();
                bodyEl.innerHTML = `<pre class="text-viewer">${text.replace(/</g, "&lt;")}</pre>`;
            } catch (err) { bodyEl.innerHTML = 'Error reading file text.'; }
        } else {
            bodyEl.innerHTML = `<p style="color:var(--text-muted);">Binary file. Triggering raw download options.</p>`;
        }
    }

    openIframeModal(title, url) {
        document.getElementById('preview-title').textContent = title;
        const bodyEl = document.getElementById('preview-body');
        const extBtn = document.getElementById('btn-external-link');

        extBtn.classList.remove('hidden');
        extBtn.onclick = () => window.open(url, '_blank');

        bodyEl.innerHTML = `<iframe src="${url}" class="iframe-viewer"></iframe>`;
        document.getElementById('preview-modal').classList.remove('hidden');
    }

    launchApp(app) {
        document.getElementById('preview-title').textContent = app.name;
        const bodyEl = document.getElementById('preview-body');
        if (app.type === 'internal-notes') {
            bodyEl.innerHTML = `<textarea style="width:100%; height:100%; background:var(--bg-main); color:white; padding:1rem; border:none; outline:none; font-family:monospace;" placeholder="Write temporary notes here..."></textarea>`;
        } else if (app.type === 'internal-calc') {
            bodyEl.innerHTML = `<div style="text-align:center;"><h3>Simple Calc</h3><input type="text" id="calc-in" style="margin:1rem; padding:0.5rem;"><button class="btn btn-primary" onclick="alert(eval(document.getElementById('calc-in').value))">Calculate</button></div>`;
        }
        document.getElementById('preview-modal').classList.remove('hidden');
    }

    closeModal() {
        document.getElementById('preview-modal').classList.add('hidden');
        document.getElementById('preview-body').innerHTML = '';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new AppController();
});
