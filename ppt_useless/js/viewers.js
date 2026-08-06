// Multi-Format Viewer Dispatcher Engine

export async function renderViewer(file, container) {
    container.innerHTML = '';

    switch (file.meta.category) {
        case 'image':
            renderImage(file, container);
            break;
        case 'audio':
            renderAudio(file, container);
            break;
        case 'video':
            renderVideo(file, container);
            break;
        case 'text':
        case 'csv':
            await renderText(file, container);
            break;
        case 'code':
            await renderCode(file, container);
            break;
        case 'pdf':
            renderPDF(file, container);
            break;
        case 'office':
            await renderOffice(file, container);
            break;
        case 'archive':
            await renderArchive(file, container);
            break;
        case 'binary':
        default:
            await renderHexViewer(file, container);
            break;
    }
}

function renderImage(file, container) {
    const img = document.createElement('img');
    img.src = file.path;
    img.className = 'viewer-image';
    img.alt = file.name;
    container.appendChild(img);
}

function renderAudio(file, container) {
    const audio = document.createElement('audio');
    audio.src = file.path;
    audio.controls = true;
    audio.autoplay = true;
    audio.className = 'viewer-media';
    container.appendChild(audio);
}

function renderVideo(file, container) {
    const video = document.createElement('video');
    video.src = file.path;
    video.controls = true;
    video.autoplay = true;
    video.className = 'viewer-media';
    container.appendChild(video);
}

async function renderText(file, container) {
    container.innerHTML = '<div class="loading-msg">Reading text data...</div>';
    try {
        const res = await fetch(file.path);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        const pre = document.createElement('pre');
        pre.className = 'viewer-text';
        pre.textContent = text;
        container.innerHTML = '';
        container.appendChild(pre);
    } catch (err) {
        container.innerHTML = `<p class="error-msg">Error loading text resource: ${err.message}</p>`;
    }
}

async function renderCode(file, container) {
    container.innerHTML = '<div class="loading-msg">Reading source...</div>';
    try {
        const res = await fetch(file.path);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();

        const pre = document.createElement('pre');
        pre.className = 'viewer-text';
        pre.style.margin = '0';

        const code = document.createElement('code');
        code.className = `language-${file.meta.extension}`;
        code.textContent = text;

        pre.appendChild(code);
        container.innerHTML = '';
        container.appendChild(pre);

        if (window.Prism) {
            Prism.highlightElement(code);
        }
    } catch (err) {
        container.innerHTML = `<p class="error-msg">Failed to read source file: ${err.message}</p>`;
    }
}

function renderPDF(file, container) {
    const iframe = document.createElement('iframe');
    iframe.src = file.path;
    iframe.className = 'viewer-frame';
    container.appendChild(iframe);
}

async function renderOffice(file, container) {
    container.innerHTML = '<div class="loading-msg">Loading document engine...</div>';

    try {
        if (file.meta.extension === 'docx') {
            const res = await fetch(file.path);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const arrayBuffer = await res.arrayBuffer();
            const result = await mammoth.convertToHtml({ arrayBuffer });

            const docContainer = document.createElement('div');
            docContainer.className = 'viewer-doc';
            docContainer.innerHTML = result.value;

            container.innerHTML = '';
            container.appendChild(docContainer);

        } else if (file.meta.extension === 'xlsx') {
            const res = await fetch(file.path);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const arrayBuffer = await res.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });

            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const html = XLSX.utils.sheet_to_html(worksheet);

            const sheetContainer = document.createElement('div');
            sheetContainer.className = 'viewer-doc';
            sheetContainer.innerHTML = html;

            container.innerHTML = '';
            container.appendChild(sheetContainer);
        } else {
            container.innerHTML = '<p class="error-msg">Preview not supported for this office format yet — use Download.</p>';
        }
    } catch (err) {
        console.error('Office render failed', err);
        container.innerHTML = `<p class="error-msg">Failed to render office document: ${err.message}</p>`;
    }
}

async function renderArchive(file, container) {
    container.innerHTML = '<div class="loading-msg">Inspecting archive...</div>';
    try {
        const res = await fetch(file.path);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();

        const zip = new JSZip();
        const contents = await zip.loadAsync(blob);

        const wrapper = document.createElement('div');
        wrapper.className = 'viewer-archive';

        const heading = document.createElement('h3');
        heading.textContent = `📦 ${file.name} Contents`;
        wrapper.appendChild(heading);

        const list = document.createElement('ul');
        Object.keys(contents.files).forEach((filename) => {
            const zipEntry = contents.files[filename];
            const li = document.createElement('li');
            li.textContent = `${zipEntry.dir ? '📁' : '📄'} ${filename}`;
            list.appendChild(li);
        });
        wrapper.appendChild(list);

        container.innerHTML = '';
        container.appendChild(wrapper);
    } catch (err) {
        console.error('Archive render failed', err);
        container.innerHTML = `<p class="error-msg">Failed to open archive: ${err.message}</p>`;
    }
}

async function renderHexViewer(file, container) {
    container.innerHTML = '<div class="loading-msg">Reading binary data...</div>';
    try {
        const res = await fetch(file.path);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buffer = await res.arrayBuffer();
        const bytes = new Uint8Array(buffer.slice(0, 512)); // First 512 bytes

        let html = '<table class="hex-table">';
        for (let i = 0; i < bytes.length; i += 16) {
            const chunk = bytes.slice(i, i + 16);
            const offset = i.toString(16).padStart(8, '0');

            const hex = Array.from(chunk).map(b => b.toString(16).padStart(2, '0')).join(' ');
            const ascii = Array.from(chunk).map(b => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.')).join('');

            html += `<tr>
                <td class="hex-offset">${offset}</td>
                <td class="hex-bytes">${hex.padEnd(47, ' ')}</td>
                <td class="hex-ascii">${ascii}</td>
            </tr>`;
        }
        html += '</table>';

        if (bytes.length === 0) {
            html = '<p class="loading-msg">File is empty.</p>';
        }

        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = `<p class="error-msg">Failed to render binary preview: ${err.message}</p>`;
    }
}
