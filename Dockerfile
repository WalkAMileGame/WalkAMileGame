# syntax=docker/dockerfile:1
FROM python:3.12.3

ENV PYTHONDONTWRITEBYTECODE=1 \
  PYTHONUNBUFFERED=1 \
  PIP_NO_CACHE_DIR=1 \
  POETRY_HOME=/opt/poetry \
  POETRY_VERSION=1.8.3 \
  # Install deps into the image site-packages (simpler for containers)
  POETRY_VIRTUALENVS_CREATE=false \
  PORT=8000

ENV PATH="${POETRY_HOME}/bin:${PATH}"

# --- Base tools & Poetry ---
RUN apt-get update && apt-get install -y --no-install-recommends \
  build-essential curl ca-certificates findutils grep sed coreutils \
  && rm -rf /var/lib/apt/lists/* \
  && curl -sSL https://install.python-poetry.org | python - --version ${POETRY_VERSION}

# Where the Python project lives relative to repo root (empty means repo root)
ARG APP_SUBDIR=""

WORKDIR /app

# --- Copy only pyproject + poetry.lock to use Docker cache for dependency install ---
# If you don't commit poetry.lock, this will still work but you lose deterministic cache correctness.
COPY pyproject.toml poetry.lock* /app/

# Verify pyproject exists (fail fast)
RUN if [ ! -f pyproject.toml ]; then \
  echo "ERROR: pyproject.toml not found in /app (build context). If your project is in a subdir, build with --build-arg APP_SUBDIR=..."; \
  exit 1; \
  fi

RUN poetry lock --no-update || true \
  && poetry install --no-interaction --no-ansi --no-root
# --- Copy the rest of the application after deps are installed (cache-friendly) ---
COPY . /app

# OpenShift-friendly permissions (arbitrary UID)
RUN chgrp -R 0 /app && chmod -R g=u /app

# Switch to non-root user for runtime
USER 1001

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD /bin/sh -lc "exec 3<>/dev/tcp/127.0.0.1/${PORT} && echo -e 'GET / HTTP/1.0\r\n' >&3 || exit 1"

CMD ["python","-m","invoke","server","--backend"]
