import os
import sys
import time
import socket
import subprocess

import httpx
import uvicorn
from fastapi import FastAPI, Request, Response
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from starlette.background import BackgroundTask

app = FastAPI()

GTA_PROCESS = None
GTA_PORT = None


def get_free_port():
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    port = s.getsockname()[1]
    s.close()
    return port


def wait_for_port(port, timeout=30):
    deadline = time.time() + timeout

    while time.time() < deadline:
        try:
            with socket.create_connection(("127.0.0.1", port), timeout=1):
                return True
        except OSError:
            time.sleep(0.25)

    return False


def start_gta():
    global GTA_PROCESS, GTA_PORT

    if GTA_PROCESS is not None and GTA_PROCESS.poll() is None:
        return True

    gta_dir = os.path.join(
        os.getcwd(),
        "ppt_useless",
        "games",
        "reVCDOS-GTA-vice-city"
    )

    GTA_PORT = get_free_port()

    print(f"[app.py] Starting GTA server on internal port {GTA_PORT}")

    GTA_PROCESS = subprocess.Popen(
        [
            sys.executable,
            "server.py",
            "--unpacked",
            "revcdos.bin",
            "--port",
            str(GTA_PORT),
        ],
        cwd=gta_dir,
    )

    if not wait_for_port(GTA_PORT):
        print("[app.py] GTA server failed to start")

        try:
            GTA_PROCESS.kill()
        except Exception:
            pass

        GTA_PROCESS = None
        GTA_PORT = None

        return False

    print("[app.py] GTA server is READY")
    return True


@app.api_route(
    "/game",
    methods=["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]
)
@app.api_route(
    "/game/{path:path}",
    methods=["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]
)
async def game(request: Request, path: str = ""):

    # THIS is the trigger.
    # Opening /game starts server.py.
    if not start_gta():
        return Response(
            content="GTA server failed to start",
            status_code=500
        )

    target = f"http://127.0.0.1:{GTA_PORT}/{path}"

    if request.url.query:
        target += "?" + request.url.query

    headers = dict(request.headers)
    headers.pop("host", None)

    client = httpx.AsyncClient(timeout=None)

    try:
        request_to_gta = client.build_request(
            request.method,
            target,
            headers=headers,
            content=request.stream(),
        )

        response = await client.send(
            request_to_gta,
            stream=True,
        )

        response_headers = dict(response.headers)

        response_headers.pop("content-length", None)
        response_headers.pop("content-encoding", None)

        return StreamingResponse(
            response.aiter_raw(),
            status_code=response.status_code,
            headers=response_headers,
            background=BackgroundTask(
                close_proxy,
                client,
                response,
            ),
        )

    except Exception as e:
        await client.aclose()

        print("[app.py] GTA proxy error:", e)

        return Response(
            content="GTA proxy error",
            status_code=502,
        )


async def close_proxy(client, response):
    await response.aclose()
    await client.aclose()


# MAIN WEBSITE
# This is mounted AFTER /game routes.
app.mount(
    "/",
    StaticFiles(
        directory="ppt_useless",
        html=True,
    ),
    name="website",
)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))

    print(f"[app.py] Main website listening on port {port}")

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
    )
