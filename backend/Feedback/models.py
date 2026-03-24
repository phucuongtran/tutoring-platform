from django.db import models
from django.contrib.auth.models import User
from Tutoring.models import Session

class Feedback(models.Model):
    session = models.ForeignKey(Session, on_delete=models.CASCADE)
    from_user = models.ForeignKey(User, on_delete=models.CASCADE)
    rating = models.PositiveIntegerField(blank=True, null=True)
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Feedback for session {self.session.id} by {self.from_user.username}"
