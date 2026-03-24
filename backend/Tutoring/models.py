from django.db import models
from django.contrib.auth.models import User
from Users.models import Profile

class Tutor(models.Model):
    profile = models.OneToOneField(Profile, on_delete=models.CASCADE)
    expertise = models.TextField(blank=True, null=True)
    availability = models.JSONField(blank=True, null=True)  # {"mon": ["8-10", "13-15"]}
    bio = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Tutor: {self.profile.user.get_full_name()}"

class Student(models.Model):
    profile = models.OneToOneField(Profile, on_delete=models.CASCADE)
    study_year = models.PositiveIntegerField(blank=True, null=True)
    support_need = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Student: {self.profile.user.get_full_name()}"

class Registration(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    tutor = models.ForeignKey(Tutor, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.profile.user.username} → {self.tutor.profile.user.username}"

class Session(models.Model):
    MODE_CHOICES = [
        ('online', 'Online'),
        ('offline', 'Offline'),
    ]
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('ongoing', 'Ongoing'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    tutor = models.ForeignKey(Tutor, on_delete=models.CASCADE)
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    location = models.CharField(max_length=200, blank=True, null=True)
    mode = models.CharField(max_length=20, choices=MODE_CHOICES, default='offline')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')

    def __str__(self):
        return f"Session: {self.tutor.profile.user.username} - {self.student.profile.user.username}"
