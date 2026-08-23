import os
import sys
import time
import socket
import subprocess
import asyncio

import httpx
import uvicorn

from fastapi import FastAPI, Request, Response
from starlette.responses import StreamingResponse
from starlette.background import BackgroundTask


app = FastAPI()

# ============================================================
# GTA SERVER CONFIG
# ============================================================

GTA_DIR = os.path.join(
    os.getcwd(),
    "ppt_useless",
    "games",
    "reVCDOS-GTA-vice-city"
)

GTA_PROCESS = None
GTA_PORT = None
GTA_LOCK = asyncio.Lock()


# ============================================================
# FIND FREE INTERNAL PORT
# ============================================================

def get_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


# ============================================================
# WAIT UNTIL server.py IS LISTENING
# ============================================================

def wait_for_port(port, timeout=60):
    deadline = time.time() + timeout

    while time.time() < deadline:
        try:
            with socket.create_connection(
                ("127.0.0.1", port),
                timeout=1
            ):
                return True
        except OSError:
            time.sleep(0.5)

    return False


# ============================================================
# START GTA SERVER ONLY WHEN NEEDED
# ============================================================

async def start_gta():

    global GTA_PROCESS
    global GTA_PORT

    async with GTA_LOCK:

        # Already running
        if GTA_PROCESS is not None and GTA_PROCESS.poll() is None:
            return GTA_PORT

        print("==========================================")
        print("[APP] GTA request received")
        print("[APP] Starting server.py")
        print(f"[APP] GTA directory: {GTA_DIR}")
        print("==========================================")

        if not os.path.isdir(GTA_DIR):
            print("[APP] ERROR: GTA directory does not exist")
            print(GTA_DIR)
            return None

        server_py = os.path.join(GTA_DIR, "server.py")
        revcdos_bin = os.path.join(GTA_DIR, "revcdos.bin")

        if not os.path.isfile(server_py):
            print("[APP] ERROR: server.py not found")
            return None

        if not os.path.isfile(revcdos_bin):
            print("[APP] ERROR: revcdos.bin not found")
            return None

        GTA_PORT = get_free_port()

        # EXACTLY the normal command:
        #
        # python server.py --unpacked revcdos.bin --port PORT
        #
        GTA_PROCESS = subprocess.Popen(
            [
                sys.executable,
                "server.py",
                "--unpacked",
                "revcdos.bin",
                "--port",
                str(GTA_PORT)
            ],
            cwd=GTA_DIR
        )

        print(
            f"[APP] server.py PID={GTA_PROCESS.pid}"
        )

        print(
            f"[APP] Waiting for GTA server on "
            f"127.0.0.1:{GTA_PORT}"
        )

        if not wait_for_port(GTA_PORT):
            print("[APP] ERROR: GTA server did not start")

            try:
                GTA_PROCESS.kill()
            except Exception:
                pass

            GTA_PROCESS = None
            GTA_PORT = None

            return None

        print(
            f"[APP] GTA SERVER READY → internal port {GTA_PORT}"
        )

        return GTA_PORT


# ============================================================
# PROXY /game/* → server.py
#
# IMPORTANT:
#
# Browser:
#   https://your-render-site.onrender.com/game/
#
# becomes:
#   http://127.0.0.1:XXXXX/
#
# Browser:
#   https://your-render-site.onrender.com/game/foo.js
#
# becomes:
#   http://127.0.0.1:XXXXX/foo.js
#
# ============================================================

@app.api_route(
    "/game",
    methods=[
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "HEAD",
        "OPTIONS"
    ]
)
@app.api_route(
    "/game/{path:path}",
    methods=[
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "HEAD",
        "OPTIONS"
    ]
)
async def gta_proxy(request: Request, path: str = ""):

    port = await start_gta()

    if port is None:
        return Response(
            content="GTA server failed to start",
            status_code=503
        )

    target = f"http://127.0.0.1:{port}/{path}"

    if request.url.query:
        target += "?" + request.url.query

    print(
        f"[APP] /game/{path} → {target}"
    )

    # Copy browser headers
    headers = dict(request.headers)

    # The Host must belong to the GTA server,
    # not Render.
    headers.pop("host", None)

    try:

        client = httpx.AsyncClient(
            timeout=None,
            follow_redirects=False
        )

        request_body = await request.body()

        upstream = await client.send(
            client.build_request(
                request.method,
                target,
                headers=headers,
                content=request_body
            ),
            stream=True
        )

        response_headers = dict(upstream.headers)

        # These are regenerated by our proxy.
        response_headers.pop("content-length", None)
        response_headers.pop("content-encoding", None)

        return StreamingResponse(
            upstream.aiter_raw(),
            status_code=upstream.status_code,
            headers=response_headers,
            background=BackgroundTask(
                close_upstream,
                upstream,
                client
            )
        )

    except Exception as e:

        print(
            f"[APP] Proxy error: {type(e).__name__}: {e}"
        )

        try:
            await client.aclose()
        except Exception:
            pass

        return Response(
            content="GTA proxy error",
            status_code=502
        )


async def close_upstream(response, client):

    try:
        await response.aclose()
    finally:
        await client.aclose()


# ============================================================
# NORMAL WEBSITE
#
# This serves your existing repo/site.
#
# /game/* is caught ABOVE this.
# ============================================================

from fastapi.staticfiles import StaticFiles

app.mount(
    "/",
    StaticFiles(
        directory=".",
        html=True
    ),
    name="site"
)


# ============================================================
# RENDER ENTRY POINT
# ============================================================

if __name__ == "__main__":

    port = int(
        os.environ.get("PORT", "8000")
    )

    print(
        f"[APP] Main Render service listening on 0.0.0.0:{port}"
    )

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port
    )
