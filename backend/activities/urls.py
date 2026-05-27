from django.urls import path

from . import views

urlpatterns = [
    path("activities/", views.ActivityListView.as_view(), name="activity-list"),
    path("activities/bulk-approve/", views.BulkApproveView.as_view(), name="activity-bulk-approve"),
    path("activities/<uuid:activity_id>/", views.ActivityDetailView.as_view(), name="activity-detail"),
    path("activities/<uuid:activity_id>/review/", views.ActivityReviewView.as_view(), name="activity-review"),
    path("dashboard/summary/", views.DashboardSummaryView.as_view(), name="dashboard-summary"),
]
