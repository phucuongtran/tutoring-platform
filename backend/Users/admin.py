from django.contrib import admin
from .models import Role, Profile, Faculty, Major


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "role", "faculty", "major", "student_id", "created_at")
    search_fields = ("user__username", "user__email", "student_id")
    list_filter = ("role", "faculty", "major")


@admin.register(Faculty)
class FacultyAdmin(admin.ModelAdmin):
    list_display = ("id", "code", "name", "created_at")
    search_fields = ("code", "name")


@admin.register(Major)
class MajorAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "faculty")
    search_fields = ("name",)
    list_filter = ("faculty",)