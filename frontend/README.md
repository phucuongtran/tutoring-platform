# Frontend

This directory contains the React frontend for the Peer Tutoring Platform.

## Responsibilities
- page routing
- login and registration flows
- dashboard UI
- API integration with the Django backend
- token-aware client requests via Axios interceptors

## Run locally
```bash
npm install
cp .env.example .env
npm start
```

## Environment variable
```env
REACT_APP_API_URL=http://localhost:8000/api/
```

## Build
```bash
npm run build
```
