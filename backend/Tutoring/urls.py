"""
URL configuration for Tutoring project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from rest_framework.routers import DefaultRouter

from .views import TutorViewSet, StudentViewSet, RegistrationViewSet, SessionViewSet
from .views import AdminReportOverviewAPIView

router = DefaultRouter()
router.register(r'tutors', TutorViewSet)
router.register(r'students', StudentViewSet)
router.register(r'registrations', RegistrationViewSet)
router.register(r'sessions', SessionViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("reports/overview/", AdminReportOverviewAPIView.as_view(), name="tutoring_report_overview"),
]
