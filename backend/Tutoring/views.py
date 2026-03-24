from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

from .models import Student, Tutor, Session, Registration
from .serializers import (
    StudentSerializer,
    TutorSerializer,
    SessionSerializer,
    RegistrationSerializer,
)
from Users.models import Profile

from rest_framework.views import APIView
from django.db.models import Count, Avg

from Feedback.models import Feedback

def is_admin_like(user):
    """
    Trả về True nếu user có quyền admin:
    - is_staff / is_superuser, hoặc
    - Profile.role.name = 'admin' (không phân biệt hoa thường).
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


class TutorViewSet(viewsets.ModelViewSet):
    queryset = Tutor.objects.select_related("profile__user")
    serializer_class = TutorSerializer

    # Ai cũng xem được danh sách tutor; sửa/xóa cần đăng nhập
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    # Nếu trong code cũ đã có filter_backends/search_fields/... thì giữ nguyên,
    # chỉ thêm các method bên dưới.

    def _check_is_tutor(self, user):
        """
        Helper: kiểm tra user đang login có Profile + role = tutor hay không.
        """
        if not user.is_authenticated:
            raise PermissionDenied("Bạn cần đăng nhập.")

        profile = getattr(user, "profile", None)
        if profile is None:
            raise PermissionDenied("Tài khoản chưa có profile.")

        role_name = getattr(getattr(profile, "role", None), "name", None)
        if not role_name or role_name.strip().lower() != "tutor":
            raise PermissionDenied("Chỉ tài khoản có vai trò tutor mới được thao tác.")

        return profile

    def perform_create(self, serializer):
        """
        Khi tạo mới Tutor:
        - Chỉ cho phép user có role = tutor.
        - Tự gán profile = profile của user đang đăng nhập.
        - Không cho tạo 2 Tutor cho cùng 1 profile.
        """
        user = self.request.user
        profile = self._check_is_tutor(user)

        if Tutor.objects.filter(profile=profile).exists():
            raise PermissionDenied("Tutor profile cho tài khoản này đã tồn tại.")

        serializer.save(profile=profile)

    def perform_update(self, serializer):
        """
        Chỉ cho phép sửa tutor của chính mình (hoặc admin).
        """
        user = self.request.user
        if not user.is_authenticated:
            raise PermissionDenied("Bạn cần đăng nhập.")

        tutor = self.get_object()
        if tutor.profile.user != user and not (user.is_staff or user.is_superuser):
            raise PermissionDenied("Bạn không có quyền sửa thông tin tutor này.")

        serializer.save()

    def perform_destroy(self, instance):
        """
        Chỉ cho phép xóa tutor của chính mình (hoặc admin).
        """
        user = self.request.user
        if not user.is_authenticated:
            raise PermissionDenied("Bạn cần đăng nhập.")

        if instance.profile.user != user and not (user.is_staff or user.is_superuser):
            raise PermissionDenied("Bạn không có quyền xóa tutor này.")

        instance.delete()

    @action(detail=False, methods=["get", "put", "patch"], url_path="me",
            permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """
        Endpoint tiện dụng cho FE: /api/tutoring/tutors/me/

        - GET  : trả về thông tin Tutor (bao gồm availability) của tutor đang đăng nhập.
        - PUT/PATCH: cập nhật thông tin (đặc biệt là availability, expertise, bio).

        Tự động tạo bản ghi Tutor rỗng nếu tutor chưa có.
        """
        user = request.user
        profile = self._check_is_tutor(user)

        tutor, created = Tutor.objects.get_or_create(profile=profile)

        if request.method.lower() == "get":
            serializer = self.get_serializer(tutor)
            return Response(serializer.data)

        # PUT/PATCH
        serializer = self.get_serializer(tutor, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

class StudentViewSet(viewsets.ModelViewSet):
    """CRUD for Student profiles."""
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["profile__id", "study_year"]
    search_fields = ["profile__user__username"]
    ordering_fields = ["id"]


class RegistrationViewSet(viewsets.ModelViewSet):
    """Students can register to tutors. Auto-assigns student when request user is a student."""
    queryset = Registration.objects.all().order_by("-created_at")
    serializer_class = RegistrationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["student__id", "tutor__id", "status"]
    search_fields = [
        "student__profile__user__username",
        "tutor__profile__user__username",
    ]
    ordering_fields = ["created_at"]

    def perform_create(self, serializer):
        # If the requester is a student, set the student automatically when possible.
        try:
            profile = Profile.objects.get(user=self.request.user)
        except Profile.DoesNotExist:
            profile = None

        if profile and profile.role == "student":
            try:
                student = Student.objects.get(profile=profile)
                serializer.save(student=student)
                return
            except Student.DoesNotExist:
                # Fall through and let serializer handle required fields / errors
                pass

        serializer.save()


class SessionViewSet(viewsets.ModelViewSet):
    """Manage tutoring sessions (scheduling, status updates)."""
    queryset = Session.objects.select_related(
        "tutor__profile__user",
        "student__profile__user",
    ).all()
    serializer_class = SessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["tutor__id", "student__id", "status", "mode"]
    search_fields = ["tutor__profile__user__username", "student__profile__user__username"]
    ordering_fields = ["start_time", "end_time"]

    def _get_role_name(self, user):
        """
        Lấy tên role từ Profile, dạng lowercase.
        """
        profile = getattr(user, "profile", None)
        if profile is None:
            return None
        role = getattr(profile, "role", None)
        if role is None or not getattr(role, "name", None):
            return None
        return role.name.strip().lower()

    def perform_create(self, serializer):
        """
        BOOK MEETING (tạo mới Session):

        - Chỉ cho phép user có role = 'student'.
        - Tự get_or_create Student gắn với profile của user.
        - FE chỉ cần gửi: tutor, start_time, end_time, location, mode.
        """
        user = self.request.user

        if not user.is_authenticated:
            raise PermissionDenied("Bạn cần đăng nhập để đặt lịch.")

        role_name = self._get_role_name(user)
        if role_name != "student":
            raise PermissionDenied("Chỉ tài khoản student mới được phép đặt lịch.")

        profile = getattr(user, "profile", None)
        if profile is None:
            raise PermissionDenied("Tài khoản chưa có profile, không thể đặt lịch.")

        # Tự động tạo Student nếu chưa có
        student, _ = Student.objects.get_or_create(profile=profile)

        # Gán student đúng cho session
        serializer.save(student=student, status="scheduled")

    def _is_admin_like(self, user):
        """
        Trả về True nếu user là admin hệ thống (is_staff/is_superuser)
        hoặc có role 'admin' trong Profile.
        """
        if not user.is_authenticated:
            return False

        if user.is_staff or user.is_superuser:
            return True

        role_name = self._get_role_name(user)
        return role_name == "admin"

    def _can_modify_session(self, user, session: Session) -> bool:
        """
        User được sửa/hủy session nếu:
        - Là admin (xem _is_admin_like), hoặc
        - Là student của session, hoặc
        - Là tutor của session.
        """
        if not user.is_authenticated:
            return False

        if self._is_admin_like(user):
            return True

        # Kiểm tra student
        if session.student and session.student.profile and session.student.profile.user_id == user.id:
            return True

        # Kiểm tra tutor
        if session.tutor and session.tutor.profile and session.tutor.profile.user_id == user.id:
            return True

        return False    

    def perform_update(self, serializer):
        """
        Dùng cho cả:
        - Reschedule: đổi start_time / end_time (và có thể location/mode)
        - Cancel: đổi status sang 'cancelled'

        Quyền:
        - Student trong buổi hoặc Tutor trong buổi, hoặc Admin.
        - Student/Tutor không được phép "đổi chủ" buổi học
          (không được sửa sang student/tutor khác).
        """
        user = self.request.user
        session = self.get_object()

        if not self._can_modify_session(user, session):
            raise PermissionDenied("Bạn không có quyền chỉnh sửa buổi học này.")

        # Nếu không phải admin → cố định tutor/student, chỉ cho đổi thời gian, status, location, mode...
        if self._is_admin_like(user):
            serializer.save()
        else:
            serializer.save(tutor=session.tutor, student=session.student)


    def perform_destroy(self, instance):
        """
        Hủy (delete) buổi học:
        - Chỉ student/tutor của buổi hoặc admin mới được delete.
        - Ở mức cơ bản, delete sẽ xóa hẳn record Session khỏi DB.
          Nếu team muốn chỉ dùng status='cancelled', FE nên gọi PATCH thay vì DELETE.
        """
        user = self.request.user

        if not self._can_modify_session(user, instance):
            raise PermissionDenied("Bạn không có quyền hủy buổi học này.")

        instance.delete()

    def _auto_update_status(self, qs):
        now = timezone.now()
        qs.filter(
            status="scheduled",
            start_time__lte=now,
            end_time__gt=now
        ).update(status="ongoing")
        qs.filter(
            status__in=["scheduled", "ongoing"],
            end_time__lte=now
        ).update(status="completed")

    def get_queryset(self):
        qs = super().get_queryset()
        user = getattr(self.request, "user", None)
        if not user or not user.is_authenticated:
            return qs.none()
        if user.is_superuser:
            self._auto_update_status(qs)
            return qs
        profile = getattr(user, "profile", None)
        role_name = getattr(getattr(profile, "role", None), "name", "") if profile else ""
        role_lower = role_name.lower()
        if role_lower == "admin":
            self._auto_update_status(qs)
            return qs
        if role_lower == "tutor":
            qs = qs.filter(tutor__profile__user=user)
            self._auto_update_status(qs)
            return qs
        if role_lower == "student":
            qs = qs.filter(student__profile__user=user)
            self._auto_update_status(qs)
            return qs
        return qs.none()

class AdminReportOverviewAPIView(APIView):
    """
    API tổng hợp số liệu cho Admin:
    - GET /api/tutoring/reports/overview/

    Không có body.
    Trả về JSON thống kê tổng quan.
    """

    def get(self, request, *args, **kwargs):
        user = request.user
        if not is_admin_like(user):
            raise PermissionDenied("Chỉ tài khoản admin mới được xem báo cáo.")

        # Lấy toàn bộ dữ liệu (có thể lọc theo thời gian sau nếu cần)
        total_students = Student.objects.count()
        total_tutors = Tutor.objects.count()

        sessions_qs = Session.objects.all()
        total_sessions = sessions_qs.count()

        # Đếm theo status (scheduled / completed / cancelled)
        sessions_by_status_raw = sessions_qs.values("status").annotate(count=Count("id"))
        sessions_by_status = {item["status"]: item["count"] for item in sessions_by_status_raw}

        # Đếm theo mode (online / offline)
        sessions_by_mode_raw = sessions_qs.values("mode").annotate(count=Count("id"))
        sessions_by_mode = {item["mode"]: item["count"] for item in sessions_by_mode_raw}

        # Feedback
        feedback_qs = Feedback.objects.all()
        total_feedback = feedback_qs.count()
        avg_rating = feedback_qs.aggregate(avg=Avg("rating"))["avg"]

        data = {
            "total_students": total_students,
            "total_tutors": total_tutors,
            "total_sessions": total_sessions,
            "sessions_by_status": sessions_by_status,
            "sessions_by_mode": sessions_by_mode,
            "total_feedback": total_feedback,
            "average_rating": avg_rating,
        }

        return Response(data)