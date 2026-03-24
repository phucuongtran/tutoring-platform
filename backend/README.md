# Backend

This directory contains the Django REST backend for the Peer Tutoring Platform.

## Responsibilities
- authentication and JWT token flow
- user profile management
- tutor and student domain models
- tutoring session APIs
- feedback APIs

## Run locally
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python load_fixtures.py
python manage.py runserver
```

## Main apps
- `Users`
- `Tutoring`
- `Feedback`

## Deployment
See `../docs/deployment.md`.
