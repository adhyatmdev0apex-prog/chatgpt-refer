// OpenExplorer Application Master Coordinator
import { detectFileType } from './detector.js';
import { PreviewController } from './preview.js';
import { filterFiles, sortFiles } from './search.js';

const State = {
    files: [],
    filteredFiles: [],
    activeFile: null,
    activeIndex: -1
};

class OpenExplorer {
    constructor() {
        this.preview = new PreviewController(State);
        this.grid = document.getElementById('explorer-grid');
        this.statsEl = document.getElementById('app-stats');
        this.searchInput = document.getElementById('search-input');
        this.sortSelect = document.getElementById('sort-select');
        this.categorySelect = document.getElementById('category-select');

        this.init();
    }

    async init() {
        console.log('🚀 Booting OpenExplorer Session...');
        await this.loadManifest();
        this.bindEvents();
        this.render();
    }

    async loadManifest() {
        try {
            const res = await fetch('files.json');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            // Backward compatible manifest normalization:
            // supports simple string array ["song.aac"]
            // or object array [{name: "song.aac", path: "files/song.aac"}]
            State.files = data.map(item => {
                const name = typeof item === 'string' ? item : item.name;
                const path = typeof item === 'string' ? `files/${item}` : (item.path || `files/${item.name}`);
                return {
                    name,
                    path,
                    meta: detectFileType(name)
                };
            });

            State.filteredFiles = [...State.files];
            console.log('📂 Manifest Loaded:', State.files);
        } catch (err) {
            console.error('❌ Manifest Missing or Invalid (OE001/OE002)', err);
            this.grid.innerHTML = `<div class="empty-state">Could not load files.json — make sure it exists at the site root.</div>`;
        }
    }

    bindEvents() {
        const updateList = () => {
            const query = this.searchInput.value;
            const category = this.categorySelect ? this.categorySelect.value : 'all';
            const sortBy = this.sortSelect ? this.sortSelect.value : 'name';

            State.filteredFiles = filterFiles(State.files, query, category);
            State.filteredFiles = sortFiles(State.filteredFiles, sortBy);
            this.render();
        };

        this.searchInput.oninput = updateList;
        if (this.sortSelect) this.sortSelect.onchange = updateList;
        if (this.categorySelect) this.categorySelect.onchange = updateList;
    }

    render() {
        this.grid.innerHTML = '';
        this.statsEl.innerText = `${State.filteredFiles.length} / ${State.files.length} Files`;

        if (State.filteredFiles.length === 0) {
            this.grid.innerHTML = `<div class="empty-state">No files match your search.</div>`;
            return;
        }

        State.filteredFiles.forEach((file, index) => {
            const card = document.createElement('div');
            card.className = 'file-card';
            card.innerHTML = `
                <div class="icon">${file.meta.icon}</div>
                <div class="name" title="${file.name}">${file.name}</div>
                <div class="type">${file.meta.typeName}</div>
                <div class="card-actions">
                    <button class="btn btn-primary preview-btn">Preview</button>
                    <button class="btn btn-secondary download-btn">Download</button>
                </div>
            `;

            card.querySelector('.preview-btn').onclick = (e) => {
                e.stopPropagation();
                this.preview.open(index);
            };

            card.querySelector('.download-btn').onclick = (e) => {
                e.stopPropagation();
                window.open(file.path, '_blank');
            };

            card.onclick = () => this.preview.open(index);

            this.grid.appendChild(card);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new OpenExplorer();
});
