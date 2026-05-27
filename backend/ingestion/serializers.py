from rest_framework import serializers

from core.models import DataSource
from ingestion.models import IngestionBatch, RawRecord


class DataSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = DataSource
        fields = ["id", "name", "source_type", "format_profile", "is_active"]


class RawRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = RawRecord
        fields = ["id", "row_number", "raw_payload", "parse_status", "error_message"]


class IngestionBatchSerializer(serializers.ModelSerializer):
    data_source = DataSourceSerializer(read_only=True)

    class Meta:
        model = IngestionBatch
        fields = [
            "id",
            "filename",
            "status",
            "total_rows",
            "success_count",
            "error_count",
            "flagged_count",
            "error_summary",
            "data_source",
            "created_at",
            "completed_at",
        ]


class IngestionBatchDetailSerializer(IngestionBatchSerializer):
    raw_errors = serializers.SerializerMethodField()

    class Meta(IngestionBatchSerializer.Meta):
        fields = IngestionBatchSerializer.Meta.fields + ["raw_errors"]

    def get_raw_errors(self, obj):
        qs = obj.raw_records.filter(parse_status=RawRecord.ParseStatus.ERROR)[:20]
        return RawRecordSerializer(qs, many=True).data
