FROM node:22-alpine AS frontend

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build


FROM python:3.12-slim AS backend

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_VERSION=2.1.1 \
    POETRY_VIRTUALENVS_CREATE=false \
    POETRY_NO_INTERACTION=1

WORKDIR /app/backend

RUN pip install --no-cache-dir "poetry==${POETRY_VERSION}"

COPY backend/pyproject.toml backend/poetry.lock ./
COPY backend/README.md ./
RUN poetry install --no-ansi --no-root

COPY backend/ ./
COPY --from=frontend /app/dist /app/dist

EXPOSE 3001

CMD ["sh","-c","mkdir -p /app/data && python -m app.scripts.migrate && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-3001}"]
