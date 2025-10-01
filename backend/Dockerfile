FROM python:3.11-slim

WORKDIR /app

# Installa dipendenze di sistema
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copia requirements
COPY requirements.txt .

# Installa dipendenze Python
RUN pip install --no-cache-dir -r requirements.txt

# Copia applicazione
COPY . .

# Esponi porta
EXPOSE 8000

# Comando di default
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
