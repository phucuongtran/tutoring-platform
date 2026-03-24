# Architecture Notes

## Overview
The project follows a classic split frontend-backend architecture.

- The **frontend** is a React application responsible for routing, forms, dashboard views, and API communication.
- The **backend** is a Django REST API responsible for authentication, profile management, tutor data, session workflows, and feedback handling.

## Backend modules
### Users
Handles:
- profile management
- roles
- faculties
- majors
- authentication integration

### Tutoring
Handles:
- tutor records
- student records
- registrations
- tutoring sessions
- tutor availability

### Feedback
Handles:
- feedback submission and retrieval after tutoring sessions

## Frontend structure
### components/
Reusable UI building blocks.

### pages/
Route-level screens and dashboard sections.

### services/
API communication and token handling.

### config/
Frontend environment-based API configuration.

## Authentication flow
1. User logs in from the React app.
2. Backend returns JWT access and refresh tokens.
3. Tokens are stored in local storage.
4. Axios interceptors attach the access token to protected requests.
5. When access expires, the refresh token is used automatically.

## Deployment approach
- Backend can be deployed to Railway.
- Frontend can be deployed to Vercel.
- API base URL is provided by environment variables.
