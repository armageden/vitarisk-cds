# ==============================================================================
# Production Dockerfile for VitaRisk CDS
# Supports: Hugging Face Spaces (Docker SDK), Render, Railway, Fly.io, Cloud Run
# ==============================================================================
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

WORKDIR /app

# Install minimal OS dependencies for healthchecks & compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements with no cache
COPY requirements.txt /app/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application artifacts and code
COPY backend/ /app/backend/
COPY ml/ /app/ml/
COPY data/ /app/data/
COPY presentation/ /app/presentation/
COPY frontend/dist/ /app/frontend/dist/
COPY process/ /app/process/
COPY docs/ /app/docs/

# Create non-root user (Standard for Hugging Face Spaces & container security)
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Dynamically bind to $PORT (Hugging Face Spaces defaults to 8000 when app_port: 8000; Render/Railway pass dynamic $PORT)
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
