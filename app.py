import os
import sys
import subprocess

GTA_DIR = os.path.join(
    os.getcwd(),
    "ppt_useless",
    "games",
    "reVCDOS-GTA-vice-city"
)

INTERNAL_PORT = 8080

subprocess.Popen(
    [
        sys.executable,
        "server.py",
        "--unpacked",
        "revcdos.bin",
        "--port",
        str(INTERNAL_PORT)
    ],
    cwd=GTA_DIR
)
