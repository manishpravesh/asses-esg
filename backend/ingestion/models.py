import uuid

from django.db import models

from core.models import DataSource, Organization


class IngestionBatch(models.Model):
    class Status(models.TextChoices):
        PROCESSING = "processing", "Processing"
        READY_FOR_REVIEW = "ready_for_review", "Ready for Review"
        FAILED = "failed", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="ingestion_batches",
    )
    data_source = models.ForeignKey(
        DataSource,
        on_delete=models.PROTECT,
        related_name="batches",
    )
    filename = models.CharField(max_length=512)
    status = models.CharField(
        max_length=32,
        choices=Status.choices,
        default=Status.PROCESSING,
    )
    total_rows = models.PositiveIntegerField(default=0)
    success_count = models.PositiveIntegerField(default=0)
    error_count = models.PositiveIntegerField(default=0)
    flagged_count = models.PositiveIntegerField(default=0)
    error_summary = models.JSONField(default=list, blank=True)
    uploaded_by = models.ForeignKey(
        "core.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="uploaded_batches",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.filename} ({self.status})"


class RawRecord(models.Model):
    class ParseStatus(models.TextChoices):
        PARSED = "parsed", "Parsed"
        ERROR = "error", "Error"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch = models.ForeignKey(
        IngestionBatch,
        on_delete=models.CASCADE,
        related_name="raw_records",
    )
    row_number = models.PositiveIntegerField()
    raw_payload = models.JSONField(default=dict)
    parse_status = models.CharField(
        max_length=16,
        choices=ParseStatus.choices,
        default=ParseStatus.PARSED,
    )
    error_message = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["row_number"]
        unique_together = [("batch", "row_number")]

    def __str__(self):
        return f"Row {self.row_number} ({self.parse_status})"
