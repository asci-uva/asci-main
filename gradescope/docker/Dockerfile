# Gradescope API service - serves the vendored gradescopeapi FastAPI app under
# uvicorn. The submodule at gradescope/gradescope-api/ is the service; this file
# only builds it.
#
# Build context is ./gradescope/, so paths below are relative to that directory:
# ./gradescope-api/ is the submodule and ./docker/ is where this Dockerfile lives.
FROM ghcr.io/astral-sh/uv:python3.14-trixie-slim

WORKDIR /app

# On a fresh clone gradescope/gradescope-api/ is empty until the submodule is
# initialized, so copy first and guard before doing any work - otherwise the build
# silently succeeds and produces an image with no application in it.
COPY ./gradescope-api/ /app/

RUN test -f /app/pyproject.toml || { \
      echo "ERROR: gradescope/gradescope-api/ is empty - the gradescope-api submodule is not initialized."; \
      echo "Run this from the repository root, then rebuild:"; \
      echo "    git submodule update --init --recursive"; \
      exit 1; \
    }

# Install the locked dependency set plus the project itself. The root install is
# editable, so bind-mounting ./gradescope-api/src/ over /app/src/ at runtime takes
# effect.
# --locked fails the build if uv.lock has drifted from pyproject.toml rather than
# silently re-resolving. --no-dev leaves the submodule's dev tooling (ruff, mypy,
# pre-commit, rust-just) out of a runtime image.
ENV UV_LINK_MODE=copy
RUN uv sync --locked --no-dev

# uvicorn is NOT a dependency of gradescopeapi, so supply an ASGI server
# ourselves. This has to come after uv sync, which prunes anything absent from
# uv.lock. [standard] brings watchfiles, so --reload watches the filesystem
# instead of stat-polling - polling is slow over a Docker Desktop/WSL bind mount.
ENV VIRTUAL_ENV=/app/.venv
ENV PATH="/app/.venv/bin:$PATH"
RUN uv pip install "uvicorn[standard]==0.51.0"

# Log destination. Compose bind-mounts over this, but create it so the container
# still starts without the mount.
RUN mkdir -p /opt/log

# --log-config REPLACES uvicorn's own logging config outright - nothing is
# merged - so log-config.json restates the console handlers alongside the file
# handler. Dropping them would silence `docker compose logs gradescope`.
COPY ./docker/log-config.json /opt/log-config.json

EXPOSE 80

CMD ["uvicorn", "gradescopeapi.api.api:app", \
  "--host", "0.0.0.0", "--port", "80", \
  "--reload", "--reload-dir", "/app/src", \
  "--log-config", "/opt/log-config.json"]
