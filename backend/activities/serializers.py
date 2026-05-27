from django.utils import timezone
from rest_framework import serializers

from activities.models import ActivityRecord, AuditEvent
from core.serializers import UserSerializer
from ingestion.serializers import IngestionBatchSerializer, RawRecordSerializer


class AuditEventSerializer(serializers.ModelSerializer):
    actor = UserSerializer(read_only=True)

    class Meta:
        model = AuditEvent
        fields = ["id", "action", "note", "before_state", "after_state", "actor", "created_at"]


class ActivityRecordSerializer(serializers.ModelSerializer):
    site_code = serializers.CharField(source="site.external_code", read_only=True, default=None)
    site_name = serializers.CharField(source="site.name", read_only=True, default=None)
    batch_filename = serializers.CharField(source="batch.filename", read_only=True)
    scope_label = serializers.CharField(source="get_scope_display", read_only=True)
    category_label = serializers.CharField(source="get_category_display", read_only=True)
    review_status_label = serializers.CharField(source="get_review_status_display", read_only=True)
    source_system_label = serializers.CharField(source="get_source_system_display", read_only=True)

    class Meta:
        model = ActivityRecord
        fields = [
            "id",
            "source_row_id",
            "source_system",
            "source_system_label",
            "scope",
            "scope_label",
            "category",
            "category_label",
            "review_status",
            "review_status_label",
            "flag_reasons",
            "activity_date",
            "period_start",
            "period_end",
            "description",
            "quantity_raw",
            "unit_raw",
            "quantity_normalized",
            "unit_normalized",
            "amount",
            "currency",
            "source_metadata",
            "is_locked",
            "site_code",
            "site_name",
            "batch_filename",
            "ingested_at",
            "reviewed_at",
        ]


class ActivityDetailSerializer(ActivityRecordSerializer):
    raw_record = RawRecordSerializer(read_only=True)
    batch = IngestionBatchSerializer(read_only=True)
    audit_events = AuditEventSerializer(many=True, read_only=True)

    class Meta(ActivityRecordSerializer.Meta):
        fields = ActivityRecordSerializer.Meta.fields + ["raw_record", "batch", "audit_events"]
