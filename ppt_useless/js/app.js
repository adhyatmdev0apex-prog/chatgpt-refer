// OpenExplorer v2.2 Master Controller (Updated Games Module)

const State = {
    files: [],
    filteredFiles: [],
    activeTab: 'files',
    
    // 🌐 EXTERNAL GAMES
    externalGames: [
        { id: 'eagler', name: 'Eaglercraft Hub', icon: '🟦', url: 'https://eaglercraft.com', allowIframe: true },
        { id: 'poki', name: 'Poki Games', icon: '🟩', url: 'https://poki.com', allowIframe: false },
        { id: 'crazygames', name: 'CrazyGames', icon: '🟥', url: 'https://www.crazygames.com', allowIframe: false },
        { id: 'itch', name: 'itch.io Web Games', icon: '🟪', url: 'https://itch.io/games/free/web', allowIframe: false }
    ],

// 💾 LOCAL GAMES
    localGames: [
        { 
            id: 'gfiles', 
            name: 'GFiles', 
            desc: 'HTML5 Game Collection', 
            icon: '🎮', 
            url: './games/gfiles/index.html', 
            allowIframe: true, 
            isLocal: true 
        },
        { 
            id: 'minecraft-web', 
            name: 'Minecraft Web Client', 
            desc: 'HTML5/WebGL Edition', 
            icon: '⛏️', 
            url: './games/minecraft-web-client/dist/index.html', 
            allowIframe: true, 
            isLocal: true 
        },
        { 
            id: 'gta-vc-web', 
            name: 'GTA: Vice City', 
            desc: 'reVCDOS Web Engine', 
            icon: '🌴', 
            url: './games/reVCDOS-GTA-vice-city/index.html', 
            allowIframe: true, 
            isLocal: true 
        }
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
            card.querySelector('.preview-btn').onclick = (e) => {
                e.stopPropagation();
                this.openFilePreview(file);
            };
            card.querySelector('.download-btn').onclick = (e) => {
                e.stopPropagation();
                window.open(file.path, '_blank');
            };
            card.onclick = () => this.openFilePreview(file);
            grid.appendChild(card);
        });
    }

    // --- 🎮 RENDER GAMES TAB (SEPARATED SECTIONS) ---
    renderGames() {
        const extGrid = document.getElementById('external-games-grid');
        const locGrid = document.getElementById('local-games-grid');

        if (extGrid) {
            extGrid.innerHTML = '';
            State.externalGames.forEach(game => {
                extGrid.appendChild(this.createGameCard(game, false));
            });
        }

        if (locGrid) {
            locGrid.innerHTML = '';
            State.localGames.forEach(game => {
                locGrid.appendChild(this.createGameCard(game, true));
            });
        }
    }

    createGameCard(game, isLocal = false) {
        const card = document.createElement('div');
        card.className = `card ${isLocal ? 'local-game-card' : ''}`;
        card.innerHTML = `
            <div class="card-icon">${game.icon}</div>
            <div class="card-title">${game.name}</div>
            <div class="card-sub">${game.desc || (game.allowIframe ? 'Embeddable' : 'External Host')}</div>
            <div class="card-btn-group">
                <button class="btn btn-primary play-btn">${isLocal ? '▶ PLAY / OPEN' : '▶ Launch Game'}</button>
            </div>
        `;
        card.querySelector('.play-btn').onclick = (e) => {
            e.stopPropagation();
            this.openGame(game);
        };
        card.onclick = () => this.openGame(game);
        return card;
    }

    // --- 🕹️ INTERNAL GAME LAUNCHER (MODAL / IFRAME) ---
    openGame(game) {
        const titleEl = document.getElementById('preview-title');
        const bodyEl = document.getElementById('preview-body');
        const extBtn = document.getElementById('btn-external-link');
        const dlBtn = document.getElementById('btn-download');

        titleEl.textContent = game.name;
        dlBtn.classList.add('hidden');

        // Show external link only for non-local games that allow fallback
        if (game.isLocal) {
            extBtn.classList.add('hidden');
        } else {
            extBtn.classList.remove('hidden');
            extBtn.onclick = () => window.open(game.url, '_blank');
        }

        if (game.allowIframe) {
            // Embedded iframe keeps execution strictly inside OpenExplorer modal
            bodyEl.innerHTML = `
                <iframe 
                    src="${game.url}" 
                    class="iframe-viewer" 
                    title="${game.name}" 
                    allow="fullscreen; autoplay; gamepad" 
                    allowfullscreen>
                </iframe>
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
                const btn = document.getElementById('notice-ext-btn');
                if (btn) btn.onclick = () => window.open(game.url, '_blank');
            }, 0);
        }

        document.getElementById('preview-modal').classList.remove('hidden');
    }

    renderMedia() {
        const imgGrid = document.getElementById('media-images-grid');
        const vidGrid = document.getElementById('media-videos-grid');
        const audGrid = document.getElementById('media-audio-grid');

        if (imgGrid) imgGrid.innerHTML = ''; 
        if (vidGrid) vidGrid.innerHTML = ''; 
        if (audGrid) audGrid.innerHTML = '';

        State.files.forEach(file => {
            if (['image', 'video', 'audio'].includes(file.meta.category)) {
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <div class="card-icon">${file.meta.icon}</div>
                    <div class="card-title">${file.name}</div>
                `;
                card.onclick = () => this.openFilePreview(file);

                if (file.meta.category === 'image' && imgGrid) imgGrid.appendChild(card);
                if (file.meta.category === 'video' && vidGrid) vidGrid.appendChild(card);
                if (file.meta.category === 'audio' && audGrid) audGrid.appendChild(card);
            }
        });
    }

    renderApps() {
        const grid = document.getElementById('apps-grid');
        if (!grid) return;
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
            card.querySelector('.launch-btn').onclick = (e) => {
                e.stopPropagation();
                this.launchApp(app);
            };
            card.onclick = () => this.launchApp(app);
            grid.appendChild(card);
        });
    }

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
        const resultsWrapper = document.getElementById('search-results-container');
        const queryDisplay = document.getElementById('search-query-display');
        const cardsGrid = document.getElementById('search-cards-grid');

        if (webForm) {
            webForm.onsubmit = (e) => {
                e.preventDefault();
                const queryInput = document.getElementById('web-search-query');
                const query = queryInput ? queryInput.value.trim() : '';
                const selectedRadio = document.querySelector('input[name="engine"]:checked');
                const selectedEngine = selectedRadio ? selectedRadio.value : 'google';

                if (!query) return;

                if (queryDisplay) queryDisplay.textContent = query;

                const engines = [
                    { id: 'google', name: 'Google', icon: '🌐', url: `https://www.google.com/search?q=${encodeURIComponent(query)}` },
                    { id: 'bing', name: 'Bing', icon: '🔵', url: `https://www.bing.com/search?q=${encodeURIComponent(query)}` },
                    { id: 'duckduckgo', name: 'DuckDuckGo', icon: '🦆', url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}` }
                ];

                // If radio buttons exist, filter by selection. If not, show all 3.
                const activeEngines = selectedRadio ? engines.filter(eng => eng.id === selectedEngine) : engines;

                if (cardsGrid) {
                    cardsGrid.innerHTML = '';
                    activeEngines.forEach(engine => {
                        const card = document.createElement('div');
                        card.className = 'search-card';
                        // Inline styles added to ensure the button looks right even if CSS is missing
                        card.innerHTML = `
                            <div class="search-card-header" style="font-weight: bold; font-size: 1.1rem; margin-bottom: 0.5rem;">
                                <span>${engine.icon}</span> <span>${engine.name}</span>
                            </div>
                            <div class="search-card-desc" style="color: var(--text-muted); margin-bottom: 1rem;">
                                Search ${engine.name} for "${query}"
                            </div>
                            <button class="btn btn-primary search-card-btn" style="width: 100%;">
                                Open ${engine.name} Results ↗
                            </button>
                        `;

                        card.querySelector('.search-card-btn').onclick = () => {
                            window.open(engine.url, '_blank');
                        };

                        cardsGrid.appendChild(card);
                    });
                }

                if (resultsWrapper) resultsWrapper.classList.remove('hidden');
                
                // Safety catch: hide the old iframe container if it's still in the HTML
                const oldFrameContainer = document.getElementById('search-frame-container');
                if (oldFrameContainer) oldFrameContainer.classList.add('hidden');
            };
        }

        const closeBtn = document.getElementById('btn-close-modal');
        if (closeBtn) closeBtn.onclick = () => this.closeModal();
    }

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
