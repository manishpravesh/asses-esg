import uuid

from django.db import models

from core.models import Organization, Site
from ingestion.models import IngestionBatch, RawRecord


class ActivityRecord(models.Model):
    class Scope(models.TextChoices):
        SCOPE_1 = "scope_1", "Scope 1"
        SCOPE_2 = "scope_2", "Scope 2"
        SCOPE_3 = "scope_3", "Scope 3"

    class Category(models.TextChoices):
        FUEL_COMBUSTION = "fuel_combustion", "Fuel Combustion"
        PURCHASED_ELECTRICITY = "purchased_electricity", "Purchased Electricity"
        PURCHASED_GOODS = "purchased_goods", "Purchased Goods (Spend)"
        BUSINESS_TRAVEL = "business_travel", "Business Travel"

    class ReviewStatus(models.TextChoices):
        PENDING = "pending", "Pending Review"
        FLAGGED = "flagged", "Flagged"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        LOCKED = "locked", "Locked for Audit"

    class SourceSystem(models.TextChoices):
        SAP_ME2N = "sap_me2n", "SAP ME2N"
        SAP_MB51 = "sap_mb51", "SAP MB51"
        UTILITY_PORTAL = "utility_portal", "Utility Portal"
        CONCUR = "concur", "Concur Itinerary"
        NAVAN = "navan", "Navan Bookings"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="activities",
    )
    batch = models.ForeignKey(
        IngestionBatch,
        on_delete=models.CASCADE,
        related_name="activities",
    )
    raw_record = models.OneToOneField(
        RawRecord,
        on_delete=models.CASCADE,
        related_name="activity",
        null=True,
        blank=True,
    )
    site = models.ForeignKey(
        Site,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="activities",
    )
    source_system = models.CharField(max_length=32, choices=SourceSystem.choices)
    source_row_id = models.CharField(max_length=255, db_index=True)
    scope = models.CharField(max_length=16, choices=Scope.choices)
    category = models.CharField(max_length=32, choices=Category.choices)
    review_status = models.CharField(
        max_length=16,
        choices=ReviewStatus.choices,
        default=ReviewStatus.PENDING,
    )
    flag_reasons = models.JSONField(default=list, blank=True)
    activity_date = models.DateField(null=True, blank=True)
    period_start = models.DateField(null=True, blank=True)
    period_end = models.DateField(null=True, blank=True)
    description = models.CharField(max_length=512, blank=True, default="")
    quantity_raw = models.DecimalField(max_digits=18, decimal_places=6, null=True, blank=True)
    unit_raw = models.CharField(max_length=32, blank=True, default="")
    quantity_normalized = models.DecimalField(max_digits=18, decimal_places=6, null=True, blank=True)
    unit_normalized = models.CharField(max_length=32, blank=True, default="")
    amount = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=8, blank=True, default="")
    source_metadata = models.JSONField(default=dict, blank=True)
    is_locked = models.BooleanField(default=False)
    ingested_at = models.DateTimeField(auto_now_add=True)
    normalized_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        "core.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_activities",
    )

    class Meta:
        ordering = ["-activity_date", "-ingested_at"]
        indexes = [
            models.Index(fields=["organization", "review_status"]),
            models.Index(fields=["organization", "scope"]),
            models.Index(fields=["batch", "source_row_id"]),
        ]

    def __str__(self):
        return f"{self.source_row_id} — {self.get_scope_display()}"


class AuditEvent(models.Model):
    class Action(models.TextChoices):
        CREATED = "created", "Created"
        UPDATED = "updated", "Updated"
        FLAGGED = "flagged", "Flagged"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        LOCKED = "locked", "Locked"
        UNLOCKED = "unlocked", "Unlocked"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="audit_events",
    )
    activity = models.ForeignKey(
        ActivityRecord,
        on_delete=models.CASCADE,
        related_name="audit_events",
        null=True,
        blank=True,
    )
    actor = models.ForeignKey(
        "core.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_events",
    )
    action = models.CharField(max_length=16, choices=Action.choices)
    note = models.TextField(blank=True, default="")
    before_state = models.JSONField(default=dict, blank=True)
    after_state = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.action} @ {self.created_at}"
