from rest_framework import serializers
from django.utils import timezone

from .models import Student, Tutor, Session, Registration

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ['id', 'profile', 'study_year', 'support_need']

class TutorSerializer(serializers.ModelSerializer):
    # Không cho client tự set profile, sẽ tự gán từ user đang đăng nhập
    profile = serializers.PrimaryKeyRelatedField(read_only=True)
    class Meta:
        model = Tutor
        fields = ['id', 'profile', 'expertise', 'availability', 'bio']

class SessionSerializer(serializers.ModelSerializer):
    reason = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    student_name = serializers.SerializerMethodField()
    student_username = serializers.SerializerMethodField()

    class Meta:
        model = Session
        fields = ["id", "tutor", "student", "student_name", "student_username", "start_time", "end_time", "location", "mode", "status", "reason"]
        # id, student, status không cho client set trực tiếp
        read_only_fields = ["id", "student"]
        
    def validate(self, attrs):
        """
        Kiểm tra cơ bản: end_time phải sau start_time.
        """
        start = attrs.get("start_time") or getattr(self.instance, "start_time", None)
        end = attrs.get("end_time") or getattr(self.instance, "end_time", None)
        reason = attrs.get("reason")

        if start and end and end <= start:
            raise serializers.ValidationError("end_time phải lớn hơn start_time.")

        # Không cho đặt lịch cho thời điểm đã qua (so với hiện tại)
        if start and start < timezone.now() and (self.instance is None or "start_time" in attrs):
            raise serializers.ValidationError("Không thể đặt lịch cho thời điểm đã qua.")

        request = self.context.get("request")
        user = getattr(request, "user", None) if request else None
        is_admin = False
        if user and user.is_authenticated:
            if user.is_superuser:
                is_admin = True
            else:
                profile = getattr(user, "profile", None)
                role_name = getattr(getattr(profile, "role", None), "name", "")
                if role_name and role_name.lower() == "admin":
                    is_admin = True

        tutor = attrs.get("tutor") or getattr(self.instance, "tutor", None)
        if tutor and start and end:
            qs = Session.objects.filter(tutor=tutor, status__in=["scheduled", "ongoing"])
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            qs = qs.filter(start_time__lt=end, end_time__gt=start)
            if qs.exists():
                raise serializers.ValidationError("Khung giờ đã được đặt, hãy chọn slot khác.")

        if attrs.get("status") == "cancelled" and not is_admin:
            if not reason or not str(reason).strip():
                raise serializers.ValidationError({"reason": "Cần cung cấp lý do hủy lịch."})

        return attrs

    def create(self, validated_data):
        validated_data.pop("reason", None)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data.pop("reason", None)
        return super().update(instance, validated_data)
        
    def get_student_name(self, obj):
        user = getattr(getattr(obj.student, "profile", None), "user", None)
        if not user:
            return None
        full_name = user.get_full_name().strip()
        return full_name or user.username

    def get_student_username(self, obj):
        user = getattr(getattr(obj.student, "profile", None), "user", None)
        return getattr(user, "username", None)

class RegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Registration
        fields = ['id', 'student', 'tutor', 'status', 'created_at']