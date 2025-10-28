# Obraz bazowy
FROM python:3.12-slim

# Ustawienie katalogu roboczego
WORKDIR /app

# Skopiowanie zależności
COPY requirements.txt .

# Instalacja zależności
RUN pip install --no-cache-dir -r requirements.txt

# Skopiowanie kodu aplikacji
COPY . .

# Komenda startowa (uruchamia FastAPI)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
