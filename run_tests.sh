#!/bin/sh
# Runs the full VitaRisk test suite (pre-submission gates + audit remediation tests).
# Prefers the project .venv; falls back to ~/.venvs/vitarisk (used when the host
# blocks venv prefix resolution — e.g. AppImage sandbox intercepting executables).
set -e
cd "$(dirname "$0")"

PY=""
if [ -x ".venv/bin/python" ] && .venv/bin/python -c "" 2>/dev/null; then
    PY=".venv/bin/python"
elif [ -x "$HOME/.venvs/vitarisk/bin/python" ]; then
    # venv prefix resolution broken on this host; site-packages via PYTHONPATH
    PY="$HOME/.venvs/vitarisk/bin/python"
    export PYTHONPATH="$HOME/.venvs/vitarisk/lib/python3.12/site-packages${PYTHONPATH:+:$PYTHONPATH}"
else
    echo "No working Python environment found. Create one with:" >&2
    echo "  uv venv ~/.venvs/vitarisk --python 3.12 && uv pip install -r requirements-dev.txt --python ~/.venvs/vitarisk/bin/python" >&2
    exit 1
fi

exec "$PY" backend/test_backend.py "$@"
