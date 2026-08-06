// Universal Modal Lifecycle Controller
import { renderViewer } from './viewers.js';
import { triggerDownload } from './utils.js';

export class PreviewController {
    constructor(state) {
        this.state = state;
        this.modal = document.getElementById('preview-modal');
        this.filenameEl = document.getElementById('preview-filename');
        this.contentEl = document.getElementById('preview-content');
        this.btnClose = document.getElementById('btn-close-preview');
        this.btnDownload = document.getElementById('btn-download');

        this.bindEvents();
    }

    bindEvents() {
        this.btnClose.onclick = () => this.close();
        this.modal.onclick = (e) => { if (e.target === this.modal) this.close(); };

        document.addEventListener('keydown', (e) => {
            if (this.state.activeFile === null) return;
            if (e.key === 'Escape') this.close();
            if (e.key === 'ArrowRight') this.navigate(1);
            if (e.key === 'ArrowLeft') this.navigate(-1);
        });
    }

    async open(fileIndex) {
        const file = this.state.filteredFiles[fileIndex];
        if (!file) return;

        this.state.activeIndex = fileIndex;
        this.state.activeFile = file;

        this.filenameEl.textContent = file.name;
        this.btnDownload.onclick = () => triggerDownload(file.path, file.name);

        this.modal.classList.remove('hidden');
        this.contentEl.innerHTML = '<div class="loading-msg">Loading preview...</div>';
        await renderViewer(file, this.contentEl);
    }

    close() {
        this.modal.classList.add('hidden');
        this.contentEl.innerHTML = ''; // Destroy media context safely (stops audio/video)
        this.state.activeFile = null;
    }

    navigate(direction) {
        const newIndex = this.state.activeIndex + direction;
        if (newIndex >= 0 && newIndex < this.state.filteredFiles.length) {
            this.open(newIndex);
        }
    }
}
