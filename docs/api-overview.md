# API Overview

## Base URL
Local default:
```text
http://localhost:8000/api/
```

## Authentication endpoints
- `POST /api/token/`
- `POST /api/token/refresh/`

## User-related endpoints
- `GET /api/users/faculties/`
- `GET /api/users/majors/`
- `GET /api/users/roles/`
- `POST /api/users/register/student/`
- `GET /api/users/profiles/me/`
- `PATCH /api/users/profiles/me/`

## Tutoring-related endpoints
Common routes used by the frontend include:
- `GET /api/tutoring/tutors/`
- `GET /api/tutoring/tutors/me/`
- `PATCH /api/tutoring/tutors/me/`
- `GET /api/tutoring/sessions/`
- `POST /api/tutoring/sessions/`

## Feedback-related endpoints
- Feedback routes are served under `/api/feedback/`

## Health check
- `GET /`
- `GET /api/`

## Notes
For production use, document each serializer-backed response shape in more detail and add request or response examples.
