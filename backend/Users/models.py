from django.db import models
from django.contrib.auth.models import User

class Faculty(models.Model):
    id = models.BigAutoField(primary_key=True)
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.code} - {self.name}"
    
class Major(models.Model):
    faculty = models.ForeignKey(Faculty, on_delete=models.CASCADE, related_name='majors')
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name
    
class Role(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, blank=True, null=True, default=1)
    faculty = models.ForeignKey(Faculty, on_delete=models.SET_NULL, blank=True, null=True)
    major = models.ForeignKey(Major, on_delete=models.SET_NULL, blank=True, null=True)
    student_id = models.CharField(max_length=50, blank=True, null=True, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        sid = f" - {self.student_id}" if self.student_id else ""
        return f"{self.user.username} ({self.role}){sid}"
