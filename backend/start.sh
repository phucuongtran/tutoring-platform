#!/bin/bash
set -e

echo "=== Starting Django Backend ==="

echo ">>> Running migrations..."
python manage.py migrate

echo ">>> Running load_fixtures.py..."
python load_fixtures.py

echo ">>> Starting gunicorn server..."
exec gunicorn Backend.wsgi:application --bind 0.0.0.0:$PORT --timeout 120
