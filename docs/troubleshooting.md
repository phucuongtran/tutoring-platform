# Troubleshooting

## Backend setup issues
### Migrations not applied
Run:
```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

### Create an admin account
```bash
cd backend
python manage.py createsuperuser
```

### Reset a forgotten admin password
```bash
cd backend
python manage.py shell
```
Then run:
```python
from django.contrib.auth.models import User
u = User.objects.get(username="admin")
u.set_password("NewStrongPass123")
u.save()
```

## Tutor record missing for a tutor user
Open Django shell and create the related tutor record after ensuring the profile role is `tutor`.

## Frontend cannot reach backend
Check:
- backend is running
- `frontend/.env` contains the correct `REACT_APP_API_URL`
- the API URL ends with `/api/`

## CORS issues in deployment
Confirm `FRONTEND_URL`, `VERCEL_URL`, and `ALLOWED_HOSTS` are configured correctly in backend environment variables.
