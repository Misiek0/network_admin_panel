# Obraz bazowy
FROM python:3.12-slim

# Zapobiegamy tworzeniu plików .pyc i buforowaniu logów
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Ustawienie katalogu roboczego
WORKDIR /app

# Instalujemy zależności systemowe (potrzebne dla bibliotek)
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libpq-dev iputils-ping\
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Skopiowanie zależności
COPY requirements.txt .

# Instalacja zależności
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Skopiowanie kodu aplikacji
COPY . .

# Komenda startowa (uruchamia FastAPI)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000","--reload"]
