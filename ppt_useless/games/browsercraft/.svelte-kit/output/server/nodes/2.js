import * as universal from '../entries/pages/_page.ts.js';

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+page.ts";
export const imports = ["_app/immutable/nodes/2.BoL6o12M.js","_app/immutable/chunks/BBBJ55oA.js","_app/immutable/chunks/DtqzF-ji.js","_app/immutable/chunks/CUVfNjEQ.js","_app/immutable/chunks/DMaBcy5s.js","_app/immutable/chunks/CZuMPPrw.js","_app/immutable/chunks/Bhuhb2TW.js"];
export const stylesheets = ["_app/immutable/assets/2.CLhwsFwl.css"];
export const fonts = [];
