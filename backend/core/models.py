import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models


class Organization(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="users",
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.email or self.username


class Site(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="sites",
    )
    external_code = models.CharField(max_length=64)
    name = models.CharField(max_length=255)
    country_iso = models.CharField(max_length=2, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("organization", "external_code")]
        ordering = ["external_code"]

    def __str__(self):
        return f"{self.external_code} — {self.name}"


class DataSource(models.Model):
    class SourceType(models.TextChoices):
        SAP_PROCUREMENT = "sap_procurement", "SAP Procurement (ME2N)"
        SAP_FUEL = "sap_fuel", "SAP Fuel (MB51)"
        UTILITY = "utility", "Utility Electricity"
        TRAVEL = "travel", "Corporate Travel"

    class FormatProfile(models.TextChoices):
        ME2N = "me2n", "SAP ME2N"
        MB51 = "mb51", "SAP MB51"
        UTILITY_PORTAL = "utility_portal", "Utility Portal CSV"
        CONCUR = "concur", "Concur Itinerary"
        NAVAN = "navan", "Navan Bookings"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="data_sources",
    )
    name = models.CharField(max_length=255)
    source_type = models.CharField(max_length=32, choices=SourceType.choices)
    format_profile = models.CharField(max_length=32, choices=FormatProfile.choices)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name
