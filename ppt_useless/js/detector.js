// File Capability & Format Intelligence Engine

const FILE_TYPES = {
    image: { extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp', 'ico', 'avif'], icon: '🖼️', name: 'Image' },
    video: { extensions: ['mp4', 'webm', 'ogv', 'mov', 'm4v', 'mkv'], icon: '🎬', name: 'Video' },
    audio: { extensions: ['mp3', 'wav', 'aac', 'ogg', 'm4a', 'flac', 'opus', 'weba'], icon: '🎵', name: 'Audio' },
    pdf:   { extensions: ['pdf'], icon: '📕', name: 'PDF Document' },
    text:  { extensions: ['txt', 'md', 'log', 'ini', 'cfg', 'env'], icon: '📄', name: 'Text File' },
    code:  { extensions: ['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'py', 'java', 'cpp', 'c', 'h', 'json', 'xml', 'yaml', 'yml', 'sh', 'sql', 'kt', 'rs', 'go'], icon: '💻', name: 'Code File' },
    csv:   { extensions: ['csv'], icon: '📊', name: 'CSV Data' },
    office:{ extensions: ['docx', 'xlsx', 'pptx'], icon: '📘', name: 'Office Document' },
    archive:{ extensions: ['zip'], icon: '📦', name: 'Archive' }
};

export function detectFileType(filename) {
    const ext = filename.includes('.') ? filename.split('.').pop().toLowerCase() : '';

    for (const [type, config] of Object.entries(FILE_TYPES)) {
        if (config.extensions.includes(ext)) {
            return {
                extension: ext,
                category: type,
                icon: config.icon,
                typeName: config.name,
                previewable: true
            };
        }
    }

    // Binary / Unknown Fallback -> rendered via hex viewer
    return {
        extension: ext || 'bin',
        category: 'binary',
        icon: '⚙️',
        typeName: 'Binary File',
        previewable: true
    };
}
