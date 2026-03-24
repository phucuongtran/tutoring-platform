# Peer Tutoring Platform

A full-stack web application that connects students with peer tutors, supports tutor availability management, and streamlines tutoring session booking and feedback.

## Why this project matters
This project demonstrates how a practical campus service can be built as a complete end-to-end product using a React frontend and a Django REST API backend. It focuses on role-based access, scheduling workflows, authentication, and deployment-ready project structure.

## Project highlights
- Full-stack architecture with separated frontend and backend codebases
- JWT-based authentication and protected API flows
- Role-aware user experience for students, tutors, and admins
- Tutor availability management and tutoring session scheduling
- Session feedback and reporting foundation
- Deployment-oriented structure for Railway and Vercel
- GitHub-ready documentation, CI, and contribution templates

## Tech stack
**Frontend**
- React
- React Router
- Axios
- CSS

**Backend**
- Django
- Django REST Framework
- Simple JWT
- django-filter
- CORS headers

**Data & deployment**
- SQLite for local development
- PostgreSQL-ready configuration for deployment
- Railway for backend deployment
- Vercel for frontend deployment

## Core features
- User registration and login
- Role-based profiles
- Faculty and major lookup
- Tutor profile management
- Availability management
- Session booking and cancellation
- Feedback submission after tutoring sessions
- Basic admin reporting flow

## Architecture overview
```text
[ React Client ]
      |
      | HTTP / JSON
      v
[ Django REST API ]
      |
      +-- Users app
      +-- Tutoring app
      +-- Feedback app
      |
      v
[ SQLite / PostgreSQL ]
```

More details:
- [Architecture notes](docs/architecture.md)
- [API overview](docs/api-overview.md)
- [Deployment guide](docs/deployment.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Roadmap](docs/roadmap.md)

## Repository structure
```text
.
├── .github/                    # CI workflow, issue templates, PR template
├── backend/                    # Django API server
│   ├── Backend/                # Django project settings and root URLs
│   ├── Users/                  # User, role, faculty, major, profile modules
│   ├── Tutoring/               # Tutor, student, registration, session modules
│   ├── Feedback/               # Feedback module
│   ├── Fixture/                # Seed data
│   ├── .env.example
│   ├── README.md
│   ├── manage.py
│   └── requirements.txt
├── frontend/                   # React client application
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── config/
│   │   ├── pages/
│   │   └── services/
│   ├── .env.example
│   ├── README.md
│   └── package.json
├── docs/                       # Supporting technical documentation
├── .editorconfig
├── .gitignore
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

## Getting started
### 1) Clone the repository
```bash
git clone <your-repository-url>
cd peer-tutoring-platform
```

### 2) Start the backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python load_fixtures.py
python manage.py runserver
```

The backend runs by default at `http://127.0.0.1:8000/`.

### 3) Start the frontend
Open a second terminal:
```bash
cd frontend
npm install
cp .env.example .env
npm start
```

The frontend runs by default at `http://localhost:3000/`.

## Environment variables
### Backend
Create `backend/.env` from `backend/.env.example`.

Required or commonly used variables:
- `SECRET_KEY`
- `DEBUG`
- `ALLOWED_HOSTS`
- `FRONTEND_URL`
- `DATABASE_URL` for PostgreSQL deployment
- `DB_ENGINE`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` if using manual database settings

### Frontend
Create `frontend/.env` from `frontend/.env.example`.

- `REACT_APP_API_URL=http://localhost:8000/api/`

## Suggested screenshots for GitHub
For a stronger portfolio presentation, add these images under `docs/screenshots/` and reference them here later:
- Login page
- Student dashboard
- Tutor availability page
- Session booking page
- Feedback page

## Good commit message examples
- `feat: add tutor availability management`
- `fix: normalize frontend API base URL handling`
- `docs: improve setup and deployment instructions`
- `chore: add github workflow and repo templates`

## How to present this project on a CV
You can summarize it like this:

> Built a full-stack peer tutoring management platform using React, Django REST Framework, and JWT authentication; implemented role-based workflows for students and tutors, scheduling flows, and deployment-ready project structure.

## Status
This repository is a strong academic and portfolio project base. The current version is suitable for GitHub showcase, further polishing, and deployment iteration.

## License
This project is released under the MIT License. See [LICENSE](LICENSE).
