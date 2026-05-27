from django.contrib import admin
from django.urls import include, path, re_path
from django.views.generic import TemplateView

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path("admin/", admin.site.urls),

    # JWT
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # APIs
    path("api/v1/", include("core.urls")),
    path("api/v1/", include("ingestion.urls")),
    path("api/v1/", include("activities.urls")),
]

urlpatterns += [
    re_path(
        r"^(?!api/|admin/|static/).*$",
        TemplateView.as_view(template_name="index.html"),
    ),
]