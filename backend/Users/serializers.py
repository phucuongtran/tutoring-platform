from rest_framework import serializers
from .models import Profile, Faculty, Major, Role

class FacultySerializer(serializers.ModelSerializer):
    class Meta:
        model = Faculty
        fields = ["id", "code", "name", "created_at"]

class MajorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Major
        fields = ['id', 'name', 'faculty']

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name']

class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)

    class Meta:
        model = Profile
        fields = [
            'id', 'username', 'first_name', 'last_name', 'student_id', 'role', 'faculty', 'major', 'created_at'
        ]
        read_only_fields = ['created_at', 'username']


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True)
    first_name = serializers.CharField(max_length=150, allow_blank=True, required=False)
    last_name = serializers.CharField(max_length=150, allow_blank=True, required=False)
    student_id = serializers.CharField(max_length=50, allow_blank=True, required=False)
    role = serializers.PrimaryKeyRelatedField(queryset=Role.objects.all(), required=False, allow_null=True)
    faculty = serializers.PrimaryKeyRelatedField(queryset=Faculty.objects.all(), required=False, allow_null=True)
    major = serializers.PrimaryKeyRelatedField(queryset=Major.objects.all(), required=False, allow_null=True)
    email = serializers.EmailField(allow_blank=False, required=True)

    def validate_username(self, value):
        from django.contrib.auth.models import User
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with that username already exists.")
        return value
    
    def validate_email(self, value):
        from django.contrib.auth.models import User
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with that email already exists.")
        return value
    
    def validate_student_id(self, value):
        if value:
            from .models import Profile
            if Profile.objects.filter(student_id=value).exists():
                raise serializers.ValidationError("A profile with that student ID already exists.")
        return value

    def validate(self, attrs):
        sid = attrs.get('student_id')
        role = attrs.get('role')

        has_sid = bool(sid)

        role_id = getattr(role, 'id', None) if role is not None else None

        desired_role_id = 1 if has_sid else 5
        if role_id != desired_role_id:
            try:
                default_role = Role.objects.get(pk=desired_role_id)
            except Role.DoesNotExist:
                raise serializers.ValidationError({
                    'role': f'Default role id={desired_role_id} not found.'
                })
            attrs['role'] = default_role

        return attrs

    def create(self, validated_data):
        from django.contrib.auth.models import User
        password = validated_data.pop('password')
        username = validated_data.pop('username')
        email = validated_data.pop('email')

        user = User(username=username, email=email)
        user.set_password(password)
        user.first_name = validated_data.get('first_name', '')
        user.last_name = validated_data.get('last_name', '')
        user.save()

        profile_data = {
            'user': user,
            'student_id': validated_data.get('student_id', None),
            'role': validated_data.get('role'),
            'faculty': validated_data.get('faculty', None),
            'major': validated_data.get('major', None),
        }

        from django.db import IntegrityError
        try:
            profile = Profile.objects.create(**{k: v for k, v in profile_data.items() if v is not None})
        except IntegrityError:
            raise serializers.ValidationError({'student_id': 'A profile with that student_id already exists.'})
        return profile
    

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Trả về thêm thông tin cơ bản của user sau khi login:
    - username, first_name, last_name
    - profile_id
    - role (tên role trong bảng Role)
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Thêm claim cơ bản
        token["username"] = user.username

        # Thêm thông tin từ Profile nếu có
        profile = getattr(user, "profile", None)
        if profile is not None:
            token["profile_id"] = profile.id
            if profile.role:
                token["role"] = profile.role.name

        return token

    def validate(self, attrs):
        """
        Dữ liệu trả về cho FE khi gọi POST /api/token/
        """
        data = super().validate(attrs)
        user = self.user

        data["username"] = user.username
        data["first_name"] = user.first_name
        data["last_name"] = user.last_name

        profile = getattr(user, "profile", None)
        if profile is not None:
            data["profile_id"] = profile.id
            if profile.role:
                data["role"] = profile.role.name

        return data