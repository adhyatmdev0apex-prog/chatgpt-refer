export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.ico","fonts/minecrafter/License.png","fonts/minecrafter/License.txt","fonts/minecrafter/Minecrafter.Reg.woff2","fonts/minecrafter/Read Me.txt","lwjgl/libraries/gl4es.wasm","lwjgl/libraries/liblwjgl.so","lwjgl/libraries/lwjgl.js","lwjgl/lwjgl-2.9.3.jar","lwjgl/lwjgl_util-2.9.3.jar"]),
	mimeTypes: {".png":"image/png",".txt":"text/plain",".woff2":"font/woff2",".wasm":"application/wasm",".so":"application/octet-stream",".js":"text/javascript",".jar":"application/java-archive"},
	_: {
		client: {start:"_app/immutable/entry/start.WDIwArZ3.js",app:"_app/immutable/entry/app.BJWca2jR.js",imports:["_app/immutable/entry/start.WDIwArZ3.js","_app/immutable/chunks/CSGGMmsc.js","_app/immutable/chunks/DtqzF-ji.js","_app/immutable/chunks/DMaBcy5s.js","_app/immutable/entry/app.BJWca2jR.js","_app/immutable/chunks/DtqzF-ji.js","_app/immutable/chunks/CZuMPPrw.js","_app/immutable/chunks/BBBJ55oA.js","_app/immutable/chunks/DMaBcy5s.js","_app/immutable/chunks/Bhuhb2TW.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js'))
		],
		routes: [
			
		],
		prerendered_routes: new Set(["/"]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
