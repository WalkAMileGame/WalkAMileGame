# syntax=docker/dockerfile:1
FROM python:3.12.3

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    POETRY_HOME=/opt/poetry \
    POETRY_VERSION=1.8.3 \
    POETRY_VIRTUALENVS_IN_PROJECT=true \
    PORT=8000

ENV PATH="${POETRY_HOME}/bin:${PATH}"

# --- Base tools & Poetry ---
RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential curl ca-certificates findutils grep sed coreutils \
    && rm -rf /var/lib/apt/lists/* \
    && curl -sSL https://install.python-poetry.org | python - --version ${POETRY_VERSION}

# Where the Python project lives relative to repo root (empty means repo root)
ARG APP_SUBDIR=""

# --- Pre-COPY diagnostics: what's in the image root/app right now? (should be empty) ---
WORKDIR /app
RUN echo ">>> Pre-COPY diagnostics" \
 && echo "PWD: $(pwd)" \
 && echo "Listing / (top-level image filesystem):" && ls -la / | sed -n '1,200p' \
 && echo "Listing /app (should be empty before COPY):" && ls -la /app || true

# --- COPY entire repo into /app ---
COPY . /app

# --- Post-COPY diagnostics: show what came in from the build context ---
RUN echo ">>> Post-COPY diagnostics" \
 && echo "PWD: $(pwd)" \
 && echo "Top of /app:" && ls -la /app | sed -n '1,200p' \
 && echo "If present, show .dockerignore content (may explain missing files):" \
 && ( [ -f /app/.dockerignore ] && { echo "----- .dockerignore -----"; sed -n '1,200p' /app/.dockerignore; echo "-------------------------"; } || echo "(no .dockerignore)" ) \
 && echo "Search for pyproject.toml under /app (max depth 3):" \
 && find /app -maxdepth 3 -type f -name "pyproject.toml" -printf "Found: %p\n" || true \
 && echo "If found, print first 120 lines and grep for [tool.poetry]:" \
 && pyfile="$(find /app -maxdepth 3 -type f -name pyproject.toml | head -n1)" \
 && if [ -n "$pyfile" ]; then echo "----- BEGIN $pyfile -----"; sed -n '1,120p' "$pyfile"; echo "------ END $pyfile ------"; else echo "pyproject.toml not found in /app"; fi \
 && if [ -n "$pyfile" ]; then \
      echo "Grep for [tool.poetry]:"; \
      if grep -n "^\s*\[tool\.poetry\]" "$pyfile"; then echo "[tool.poetry] section PRESENT"; else echo "[tool.poetry] section NOT found"; fi; \
    fi

# --- If your app is in a subdir, cd there; otherwise stay in /app ---
WORKDIR /app/${APP_SUBDIR}

# Fail fast with a clear, noisy error if pyproject.toml is missing here
RUN echo ">>> Verifying pyproject.toml at $(pwd)" \
 && if [ ! -f pyproject.toml ]; then \
      echo "ERROR: pyproject.toml not found in $(pwd). If your project lives in a subfolder, build with:"; \
      echo "  docker build --build-arg APP_SUBDIR=backend -t my-webapp ."; \
      exit 1; \
    fi \
 && echo ">>> Show first 120 lines of ./pyproject.toml (current workdir)" \
 && sed -n '1,120p' pyproject.toml \
 && echo ">>> Confirm [tool.poetry] exists here" \
 && if ! grep -q "^\s*\[tool\.poetry\]" pyproject.toml; then \
      echo "ERROR: [tool.poetry] section not found in ./pyproject.toml (did you mean another tool like pdm or hatch?)"; \
      exit 1; \
    fi

RUN poetry lock

# --- Poetry install exactly like your local workflow ---
RUN poetry install --no-interaction --no-ansi --no-root

# OpenShift-friendly permissions (arbitrary UID)
RUN chgrp -R 0 /app && chmod -R g=u /app
USER 1001

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD /bin/sh -lc "exec 3<>/dev/tcp/127.0.0.1/${PORT} && echo -e 'GET / HTTP/1.0\r\n' >&3 || exit 1"

#CMD ["/bin/sh","-lc","${POETRY_HOME}/bin/poetry run invoke server --host=0.0.0.0 --port=${PORT:-8000}"]
CMD ["/bin/sh","-lc","${POETRY_HOME}/bin/poetry run uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
