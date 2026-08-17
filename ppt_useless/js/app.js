// OpenExplorer v2.1 Refactored Master Controller

const State = {
    files: [],
    filteredFiles: [],
    activeTab: 'files',
    games: [
        { id: 'eagler', name: 'Eaglercraft Hub', icon: '🟦', url: 'https://eaglercraft.com', allowIframe: true },
        { id: 'poki', name: 'Poki Games', icon: '🟩', url: 'https://poki.com', allowIframe: false },
        { id: 'crazygames', name: 'CrazyGames', icon: '🟥', url: 'https://www.crazygames.com', allowIframe: false },
        { id: 'itch', name: 'itch.io Web Games', icon: '🟪', url: 'https://itch.io/games/free/web', allowIframe: false }
    ],
    apps: [
        { id: 'notes', name: 'Quick Notepad', icon: '📝', type: 'internal-notes' },
        { id: 'calc', name: 'Calculator', icon: '🧮', type: 'internal-calc' }
    ]
};

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

    // Router Listener
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

    // Manifest Loader
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

    // FIXED: Embedded Game Launcher with fallback
    renderGames() {
        const grid = document.getElementById('games-grid');
        grid.innerHTML = '';
        State.games.forEach(game => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-icon">${game.icon}</div>
                <div class="card-title">${game.name}</div>
                <div class="card-sub">${game.allowIframe ? 'Embeddable' : 'External Host'}</div>
                <div class="card-btn-group">
                    <button class="btn btn-primary play-btn">▶ Launch Game</button>
                </div>
            `;
            card.querySelector('.play-btn').onclick = () => this.openGame(game);
            grid.appendChild(card);
        });
    }

    openGame(game) {
        const titleEl = document.getElementById('preview-title');
        const bodyEl = document.getElementById('preview-body');
        const extBtn = document.getElementById('btn-external-link');
        const dlBtn = document.getElementById('btn-download');

        titleEl.textContent = game.name;
        dlBtn.classList.add('hidden');
        extBtn.classList.remove('hidden');
        extBtn.onclick = () => window.open(game.url, '_blank');

        if (game.allowIframe) {
            bodyEl.innerHTML = `
                <iframe src="${game.url}" class="iframe-viewer" allow="fullscreen; autoplay; gamepad" allowfullscreen></iframe>
            `;
        } else {
            bodyEl.innerHTML = `
                <div class="blocked-embed-notice">
                    <h3>⚠️ External Embedding Restricted</h3>
                    <p>${game.name} blocks direct iframe integration via security policies (CSP / X-Frame-Options).</p>
                    <button id="notice-ext-btn" class="btn btn-primary">↗ Open Official Site (${game.name})</button>
                </div>
            `;
            setTimeout(() => {
                document.getElementById('notice-ext-btn').onclick = () => window.open(game.url, '_blank');
            }, 0);
        }

        document.getElementById('preview-modal').classList.remove('hidden');
    }

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

    renderApps() {
        const grid = document.getElementById('apps-grid');
        grid.innerHTML = '';
        State.apps.forEach(app => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-icon">${app.icon}</div>
                <div class="card-title">${app.name}</div>
                <div class="card-sub">Local Workspace Tool</div>
                <div class="card-btn-group">
                    <button class="btn btn-primary launch-btn">Launch App</button>
                </div>
            `;
            card.querySelector('.launch-btn').onclick = () => this.launchApp(app);
            grid.appendChild(card);
        });
    }

    // FIXED: Embedded Web Search Engine (No window.open())
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
        const searchContainer = document.getElementById('search-frame-container');
        const searchFrame = document.getElementById('search-frame');
        const searchExtBtn = document.getElementById('btn-open-search-ext');

        if (webForm) {
            webForm.onsubmit = (e) => {
                e.preventDefault();
                const q = document.getElementById('web-search-query').value;
                
                // Using DuckDuckGo HTML mode (iframe friendly)
                const embedUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
                
                searchFrame.src = embedUrl;
                searchContainer.classList.remove('hidden');

                searchExtBtn.onclick = () => {
                    window.open(`https://duckduckgo.com/?q=${encodeURIComponent(q)}`, '_blank');
                };
            };
        }

        document.getElementById('btn-close-modal').onclick = () => this.closeModal();
    }

    // FIXED: Full Modal Preview Engine
    async openFilePreview(file) {
        const titleEl = document.getElementById('preview-title');
        const bodyEl = document.getElementById('preview-body');
        const dlBtn = document.getElementById('btn-download');
        const extBtn = document.getElementById('btn-external-link');

        titleEl.textContent = file.name;
        extBtn.classList.add('hidden');
        dlBtn.classList.remove('hidden');
        dlBtn.onclick = () => window.open(file.path, '_blank');

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
            bodyEl.innerHTML = `<p style="color:var(--text-muted);">Binary resource. Download enabled.</p>`;
        }
    }

    // FIXED: Clean Calculator App UI (Replaces alert())
    launchApp(app) {
        const titleEl = document.getElementById('preview-title');
        const bodyEl = document.getElementById('preview-body');
        const dlBtn = document.getElementById('btn-download');
        const extBtn = document.getElementById('btn-external-link');

        titleEl.textContent = app.name;
        dlBtn.classList.add('hidden');
        extBtn.classList.add('hidden');

        if (app.type === 'internal-notes') {
            bodyEl.innerHTML = `
                <textarea style="width:100%; height:100%; background:var(--bg-main); color:white; padding:1rem; border:none; outline:none; font-family:monospace;" placeholder="Write temporary workspace notes here..."></textarea>
            `;
        } else if (app.type === 'internal-calc') {
            bodyEl.innerHTML = `
                <div class="calc-container">
                    <div id="calc-display" class="calc-display">0</div>
                    <div class="calc-grid">
                        <button class="calc-btn" onclick="document.getElementById('calc-display').innerText = ''">C</button>
                        <button class="calc-btn" onclick="document.getElementById('calc-display').innerText += '/'">/</button>
                        <button class="calc-btn" onclick="document.getElementById('calc-display').innerText += '*'">*</button>
                        <button class="calc-btn" onclick="document.getElementById('calc-display').innerText += '-'">-</button>
                        <button class="calc-btn" onclick="document.getElementById('calc-display').innerText += '7'">7</button>
                        <button class="calc-btn" onclick="document.getElementById('calc-display').innerText += '8'">8</button>
                        <button class="calc-btn" onclick="document.getElementById('calc-display').innerText += '9'">9</button>
                        <button class="calc-btn" onclick="document.getElementById('calc-display').innerText += '+'">+</button>
                        <button class="calc-btn" onclick="document.getElementById('calc-display').innerText += '4'">4</button>
                        <button class="calc-btn" onclick="document.getElementById('calc-display').innerText += '5'">5</button>
                        <button class="calc-btn" onclick="document.getElementById('calc-display').innerText += '6'">6</button>
                        <button class="calc-btn" onclick="
                            try { document.getElementById('calc-display').innerText = eval(document.getElementById('calc-display').innerText); } 
                            catch(e) { document.getElementById('calc-display').innerText = 'Error'; }
                        ">=</button>
                        <button class="calc-btn" onclick="document.getElementById('calc-display').innerText += '1'">1</button>
                        <button class="calc-btn" onclick="document.getElementById('calc-display').innerText += '2'">2</button>
                        <button class="calc-btn" onclick="document.getElementById('calc-display').innerText += '3'">3</button>
                        <button class="calc-btn" onclick="document.getElementById('calc-display').innerText += '0'">0</button>
                    </div>
                </div>
            `;
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
