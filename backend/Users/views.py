from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from django_filters.rest_framework import DjangoFilterBackend

from .models import Profile, Faculty, Major, Role
from .serializers import ProfileSerializer, RegisterSerializer, FacultySerializer, MajorSerializer, RoleSerializer
from rest_framework import viewsets as rf_viewsets


class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.select_related('user').all()
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['role', 'faculty', 'major']
    search_fields = ['user__username', 'user__first_name', 'user__last_name']
    ordering_fields = ['created_at', 'id']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['get', 'put', 'patch'], url_path='me')
    def me(self, request):
        """Get or update the Profile for the current authenticated user."""
        if not request.user or not request.user.is_authenticated:
            return Response({'detail': 'Authentication credentials were not provided.'}, status=status.HTTP_401_UNAUTHORIZED)

        profile = getattr(request.user, "profile", None)
        if profile is None:
            default_role = Role.objects.filter(name__iexact="admin").first()
            profile, _ = Profile.objects.get_or_create(
                user=request.user,
                defaults={"role": default_role}
            )

        if request.method == 'GET':
            serializer = self.get_serializer(profile)
            return Response(serializer.data)

        serializer = self.get_serializer(profile, data=request.data, partial=(request.method == 'PATCH'))
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class RegisterStudentAPIView(APIView):
    """Public endpoint to register a student user and create a Profile."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()
        output = ProfileSerializer(profile, context={'request': request})
        return Response(output.data, status=status.HTTP_201_CREATED)


class FacultyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Faculty.objects.all().order_by("name")
    serializer_class = FacultySerializer
    permission_classes = [permissions.AllowAny]


class MajorViewSet(rf_viewsets.ReadOnlyModelViewSet):
    """Read-only endpoints for listing majors. Supports optional ?faculty=<id> filter."""
    queryset = Major.objects.select_related('faculty').all().order_by('name')
    serializer_class = MajorSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        faculty_id = self.request.query_params.get('faculty')
        if faculty_id:
            try:
                fid = int(faculty_id)
                qs = qs.filter(faculty_id=fid)
            except ValueError:
                pass
        return qs
    
class RoleViewSet(rf_viewsets.ReadOnlyModelViewSet):
    """Read-only endpoints for listing/retrieving roles."""
    queryset = Role.objects.all().order_by('name')
    serializer_class = RoleSerializer
    permission_classes = [permissions.AllowAny]



from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Dùng serializer custom để trả thêm thông tin user sau khi login.
    """
    serializer_class = CustomTokenObtainPairSerializer