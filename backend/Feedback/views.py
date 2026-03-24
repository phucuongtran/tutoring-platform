from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Feedback
from .serializers import FeedbackSerializer

from rest_framework.exceptions import PermissionDenied
from rest_framework import serializers

class FeedbackViewSet(viewsets.ModelViewSet):
    """CRUD for feedback left by users for sessions.

    - Anyone can list/retrieve feedback (read-only).
    - Creating requires authentication and will auto-fill `from_user` with request.user.
    - Only the author or staff can update/delete a feedback entry.
    """
    queryset = Feedback.objects.select_related('session', 'from_user').all().order_by('-created_at')
    serializer_class = FeedbackSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['session__id', 'from_user__id', 'rating']
    search_fields = ['comment', 'from_user__username']
    ordering_fields = ['created_at', 'rating']

    def _role_lower(self, user):
        if not user or not user.is_authenticated:
            return ""
        if user.is_superuser:
            return "admin"
        profile = getattr(user, "profile", None)
        role_name = getattr(getattr(profile, "role", None), "name", "")
        return (role_name or "").strip().lower()

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        role = self._role_lower(user)
        if role == "admin":
            qs = qs
        elif role == "student":
            qs = qs.filter(from_user=user)
        elif role == "tutor":
            qs = qs.filter(session__tutor__profile__user=user)
        else:
            qs = qs.none()

        session_param = self.request.query_params.get("session")
        if session_param:
            try:
                qs = qs.filter(session_id=int(session_param))
            except ValueError:
                qs = qs.none()
        return qs

    def perform_create(self, serializer):
        role = self._role_lower(self.request.user)
        if role not in ("student", "admin"):
            raise PermissionDenied("Chỉ sinh viên hoặc admin mới được chỉnh sửa đánh giá.")
        serializer.save(from_user=self.request.user)

    def perform_update(self, serializer):
        instance = self.get_object()
        role = self._role_lower(self.request.user)
        if role == "student" and instance.from_user_id != self.request.user.id:
            raise PermissionDenied("Không được chỉnh sửa đánh giá của người khác.")
        if role not in ("student", "admin"):
            raise PermissionDenied("Chỉ sinh viên hoặc admin mới được chỉnh sửa đánh giá.")
        serializer.save()

    def perform_destroy(self, instance):
        role = self._role_lower(self.request.user)
        if role == "student" and instance.from_user_id != self.request.user.id:
            raise PermissionDenied("Không được xoá đánh giá của người khác.")
        if role not in ("student", "admin"):
            raise PermissionDenied("Chỉ sinh viên hoặc admin mới được chỉnh sửa đánh giá.")
        instance.delete()

    @action(detail=False, methods=['get'], url_path='mine')
    def mine(self, request):
        """Return feedback authored by the requesting user."""
        if not request.user or not request.user.is_authenticated:
            return Response({'detail': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

        qs = self.queryset.filter(from_user=request.user)
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    def _is_admin_like(self, user):
        """
        Xem user cÃ³ tÃ­nh lÃ  admin hay khÃ´ng:
        - is_staff / is_superuser, hoáº·c
        - role trong Profile lÃ  'admin'.
        """
        if not user.is_authenticated:
            return False

        if user.is_staff or user.is_superuser:
            return True

        profile = getattr(user, "profile", None)
        if profile is None:
            return False

        role = getattr(profile, "role", None)
        if role is None or not getattr(role, "name", None):
            return False

        return role.name.strip().lower() == "admin"
