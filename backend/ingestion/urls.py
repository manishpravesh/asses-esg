from django.urls import path

from . import views

urlpatterns = [
    path("batches/upload/", views.BatchUploadView.as_view(), name="batch-upload"),
    path("batches/", views.BatchListView.as_view(), name="batch-list"),
    path("batches/<uuid:batch_id>/", views.BatchDetailView.as_view(), name="batch-detail"),
]
