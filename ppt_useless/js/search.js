// Real-time Search & Filter Engine

export function filterFiles(files, query, category) {
    const q = query.toLowerCase().trim();

    return files.filter(file => {
        const matchesQuery = !q || file.name.toLowerCase().includes(q) || file.meta.extension.includes(q);
        const matchesCategory = category === 'all' || file.meta.category === category;
        return matchesQuery && matchesCategory;
    });
}

export function sortFiles(files, criteria) {
    return [...files].sort((a, b) => {
        if (criteria === 'name') return a.name.localeCompare(b.name);
        if (criteria === 'type') return a.meta.category.localeCompare(b.meta.category);
        if (criteria === 'ext') return a.meta.extension.localeCompare(b.meta.extension);
        return 0;
    });
}
