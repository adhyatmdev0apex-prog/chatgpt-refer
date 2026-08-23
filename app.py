import os
import time
import sys
import socket
import asyncio
import subprocess
import httpx
from fastapi import FastAPI, Request, Response
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from starlette.background import BackgroundTask
import uvicorn

app = FastAPI()

# ---------------------------------------------------------
# 1. GLOBAL SECURITY HEADERS (REQUIRED FOR GTA IN IFRAME)
# ---------------------------------------------------------
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    # Required for SharedArrayBuffer (WASM multithreading)
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
    response.headers["Cross-Origin-Embedder-Policy"] = "require-corp"
    return response

# ---------------------------------------------------------
# 2. CHILD PROCESS MANAGEMENT
# ---------------------------------------------------------
GTA_PROCESS = None
GTA_PORT = None
GTA_LOCK = asyncio.Lock()

def get_free_internal_port():
    """Finds an available local port for the GTA child server."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        return s.getsockname()[1]

def wait_for_port(port, timeout=30.0):
    """Blocks until the child process binds to the port."""
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            with socket.create_connection(('127.0.0.1', port), timeout=1.0):
                return True
        except OSError:
            time.sleep(0.5)
    return False

async def ensure_gta_server_running():
    """Ensures server.py is running. Starts it if it isn't."""
    global GTA_PROCESS, GTA_PORT
    
    async with GTA_LOCK:
        # Check if process is already running and healthy
        if GTA_PROCESS is not None and GTA_PROCESS.poll() is None:
            return True

        print("[app.py] Starting GTA server.py child process...")
        GTA_PORT = get_free_internal_port()
        
        # The working directory MUST be the game folder where server.py lives
        cwd = os.path.join(os.getcwd(), "ppt_useless", "games", "reVCDOS-GTA-vice-city")
        
        # Launch existing server.py transparently
        # stdout/stderr are NOT piped so they naturally flow into Render's logs
        GTA_PROCESS = subprocess.Popen(
            [sys.executable, "server.py", "--unpacked", "./revcdos.bin", "--port", str(GTA_PORT)],
            cwd=cwd
        )
        
        print(f"[app.py] Waiting for GTA server to initialize on internal port {GTA_PORT}...")
        if wait_for_port(GTA_PORT, timeout=60.0):
            print("[app.py] GTA server is ready and accepting connections!")
            return True
        else:
            print("[app.py] ERROR: GTA server failed to bind to port in time.")
            GTA_PROCESS.kill()
            return False

# ---------------------------------------------------------
# 3. HTTP PROXY FOR GAME
# ---------------------------------------------------------
@app.api_route("/game/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"])
async def proxy_gta(request: Request, path: str):
    """
    Proxies all requests from /game/* to the internal GTA server at /*
    Transparently forwards headers, query strings, and streaming bodies.
    """
    is_running = await ensure_gta_server_running()
    if not is_running:
        return Response(content="GTA Game Server failed to start.", status_code=500)

    # Reconstruct target URL (strip /game prefix)
    target_url = f"http://127.0.0.1:{GTA_PORT}/{path}"
    if request.url.query:
        target_url += f"?{request.url.query}"

    # Forward headers (excluding Host so httpx handles it)
    req_headers = dict(request.headers)
    req_headers.pop("host", None)

    client = httpx.AsyncClient(timeout=httpx.Timeout(60.0))
    target_req = client.build_request(
        request.method,
        target_url,
        headers=req_headers,
        content=request.stream()
    )

    target_resp = await client.send(target_req, stream=True)

    # Strip hop-by-hop headers that shouldn't be proxied back
    resp_headers = dict(target_resp.headers)
    resp_headers.pop("content-encoding", None)
    resp_headers.pop("content-length", None)

    return StreamingResponse(
        target_resp.aiter_raw(),
        status_code=target_resp.status_code,
        headers=resp_headers,
        background=BackgroundTask(target_resp.aclose)
    )

# ---------------------------------------------------------
# 4. MAIN WEBSITE FALLBACK
# ---------------------------------------------------------
# Mount your existing static website to the root so it continues working as normal
# Replace "public" with whatever folder your main site's index.html is located in.
# If your main site's index.html is in the root, mount directory="."
app.mount("/", StaticFiles(directory=".", html=True), name="main_site")

if __name__ == "__main__":
    # Bind to Render's dynamic public port
    PORT = int(os.environ.get("PORT", 8000))
    print(f"[app.py] Main Web Service listening on 0.0.0.0:{PORT}")
    uvicorn.run(app, host="0.0.0.0", port=PORT)
  
