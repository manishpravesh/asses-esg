from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from activities.models import ActivityRecord, AuditEvent
from activities.serializers import ActivityDetailSerializer, ActivityRecordSerializer
from ingestion.models import IngestionBatch, RawRecord


def _activity_state(activity: ActivityRecord) -> dict:
    return {
        "review_status": activity.review_status,
        "is_locked": activity.is_locked,
        "flag_reasons": activity.flag_reasons,
    }


class ActivityListView(APIView):
    def get(self, request):
        org = request.organization
        qs = ActivityRecord.objects.filter(organization=org).select_related("site", "batch")

        review_status = request.query_params.get("review_status")
        scope = request.query_params.get("scope")
        source_system = request.query_params.get("source_system")
        batch_id = request.query_params.get("batch_id")

        if review_status:
            qs = qs.filter(review_status=review_status)
        if scope:
            qs = qs.filter(scope=scope)
        if source_system:
            qs = qs.filter(source_system=source_system)
        if batch_id:
            qs = qs.filter(batch_id=batch_id)

        page = int(request.query_params.get("page", 1))
        page_size = 50
        start = (page - 1) * page_size
        end = start + page_size
        total = qs.count()
        data = ActivityRecordSerializer(qs[start:end], many=True).data
        return Response({"count": total, "results": data})


class ActivityDetailView(APIView):
    def get(self, request, activity_id):
        org = request.organization
        activity = (
            ActivityRecord.objects.filter(organization=org, id=activity_id)
            .select_related("site", "batch", "raw_record")
            .prefetch_related("audit_events__actor")
            .first()
        )
        if not activity:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(ActivityDetailSerializer(activity).data)


class ActivityReviewView(APIView):
    def patch(self, request, activity_id):
        org = request.organization
        activity = ActivityRecord.objects.filter(organization=org, id=activity_id).first()
        if not activity:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        if activity.is_locked:
            return Response({"detail": "Record is locked for audit."}, status=status.HTTP_400_BAD_REQUEST)

        action = request.data.get("action")
        note = request.data.get("note", "")
        before = _activity_state(activity)

        if action == "approve":
            activity.review_status = ActivityRecord.ReviewStatus.APPROVED
            activity.is_locked = True
            activity.reviewed_at = timezone.now()
            activity.reviewed_by = request.user
            audit_action = AuditEvent.Action.APPROVED
        elif action == "flag":
            activity.review_status = ActivityRecord.ReviewStatus.FLAGGED
            reasons = request.data.get("flag_reasons", activity.flag_reasons)
            if isinstance(reasons, str):
                reasons = [reasons]
            activity.flag_reasons = list(set(activity.flag_reasons + reasons))
            audit_action = AuditEvent.Action.FLAGGED
        elif action == "reject":
            activity.review_status = ActivityRecord.ReviewStatus.REJECTED
            audit_action = AuditEvent.Action.REJECTED
        elif action == "unlock":
            activity.is_locked = False
            activity.review_status = ActivityRecord.ReviewStatus.PENDING
            audit_action = AuditEvent.Action.UNLOCKED
        else:
            return Response({"detail": "Invalid action."}, status=status.HTTP_400_BAD_REQUEST)

        activity.save()
        AuditEvent.objects.create(
            organization=org,
            activity=activity,
            actor=request.user,
            action=audit_action,
            note=note,
            before_state=before,
            after_state=_activity_state(activity),
        )
        if action == "approve":
            AuditEvent.objects.create(
                organization=org,
                activity=activity,
                actor=request.user,
                action=AuditEvent.Action.LOCKED,
                note="Approved and locked for audit.",
                before_state=before,
                after_state=_activity_state(activity),
            )
            activity.review_status = ActivityRecord.ReviewStatus.LOCKED
            activity.save(update_fields=["review_status"])

        return Response(ActivityDetailSerializer(activity).data)


class BulkApproveView(APIView):
    def post(self, request):
        org = request.organization
        ids = request.data.get("activity_ids", [])
        if not ids:
            return Response({"detail": "activity_ids required."}, status=status.HTTP_400_BAD_REQUEST)

        approved = 0
        for activity in ActivityRecord.objects.filter(organization=org, id__in=ids, is_locked=False):
            before = _activity_state(activity)
            activity.review_status = ActivityRecord.ReviewStatus.LOCKED
            activity.is_locked = True
            activity.reviewed_at = timezone.now()
            activity.reviewed_by = request.user
            activity.save()
            AuditEvent.objects.create(
                organization=org,
                activity=activity,
                actor=request.user,
                action=AuditEvent.Action.APPROVED,
                before_state=before,
                after_state=_activity_state(activity),
            )
            AuditEvent.objects.create(
                organization=org,
                activity=activity,
                actor=request.user,
                action=AuditEvent.Action.LOCKED,
                before_state=before,
                after_state=_activity_state(activity),
            )
            approved += 1
        return Response({"approved": approved})


class DashboardSummaryView(APIView):
    def get(self, request):
        org = request.organization
        activities = ActivityRecord.objects.filter(organization=org)
        batches = IngestionBatch.objects.filter(organization=org)
        raw_errors = RawRecord.objects.filter(batch__organization=org, parse_status=RawRecord.ParseStatus.ERROR)

        return Response(
            {
                "total_activities": activities.count(),
                "pending_review": activities.filter(review_status=ActivityRecord.ReviewStatus.PENDING).count(),
                "flagged": activities.filter(review_status=ActivityRecord.ReviewStatus.FLAGGED).count(),
                "approved": activities.filter(review_status=ActivityRecord.ReviewStatus.APPROVED).count(),
                "locked": activities.filter(review_status=ActivityRecord.ReviewStatus.LOCKED).count(),
                "failed_parse": raw_errors.count(),
                "total_batches": batches.count(),
                "recent_batches": [
                    {
                        "id": str(b.id),
                        "filename": b.filename,
                        "status": b.status,
                        "source_type": b.data_source.source_type,
                        "success_count": b.success_count,
                        "error_count": b.error_count,
                        "flagged_count": b.flagged_count,
                        "created_at": b.created_at.isoformat(),
                    }
                    for b in batches.select_related("data_source")[:10]
                ],
                "by_scope": list(
                    activities.values("scope").annotate(count=Count("id")).order_by("scope")
                ),
            }
        )
