FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy project
COPY . .

# Collect static files (this is OK at build time)
RUN python manage.py collectstatic --noinput

# Expose port
EXPOSE 8000

# Run migrations and start server at RUNTIME (not build time)
CMD python manage.py migrate && python load_fixtures.py && gunicorn Backend.wsgi:application --bind 0.0.0.0:$PORT
