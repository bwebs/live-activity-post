FROM python:3.13-slim

WORKDIR /app

COPY pyproject.toml .
COPY README.md .
# Install build backend and then the project dependencies
RUN pip install --no-cache-dir hatchling && pip install --no-cache-dir .

COPY . .

ARG APP_VERSION
ENV APP_VERSION=${APP_VERSION}

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
