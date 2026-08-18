

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/layout.svelte.js')).default;
export const imports = ["_app/immutable/nodes/0.DqRCcraC.js","_app/immutable/chunks/BBBJ55oA.js","_app/immutable/chunks/DtqzF-ji.js"];
export const stylesheets = [];
export const fonts = [];
