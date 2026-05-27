from decimal import Decimal
from pathlib import Path

from django.contrib.auth import get_user_model
from django.test import TestCase

from core.models import DataSource, Organization, Site
from ingestion.models import IngestionBatch
from ingestion.parsers.common import map_row, normalize_header, parse_date
from ingestion.parsers.sap import parse_sap_fuel_row, parse_sap_procurement_row
from ingestion.parsers.travel import parse_travel_row
from ingestion.parsers.utility import parse_utility_row
from ingestion.services import process_batch

User = get_user_model()
SAMPLE = Path(__file__).resolve().parents[2] / "sample_data"


class ParserTests(TestCase):
    def test_parse_sap_date_yyyymmdd(self):
        self.assertEqual(parse_date("20250315").isoformat(), "2025-03-15")

    def test_parse_sap_date_european(self):
        self.assertEqual(parse_date("31.03.2025").isoformat(), "2025-03-31")

    def test_sap_procurement_parser(self):
        row = {
            "ebeln": "4500123456",
            "ebelp": "00010",
            "bukrs": "1000",
            "werks": "DE01",
            "bedat": "20250315",
            "menge": "12500",
            "meins": "L",
            "netwr": "18750.00",
            "waers": "EUR",
        }
        result = parse_sap_procurement_row(row)
        self.assertIsNotNone(result.success)
        self.assertEqual(result.success.scope, "scope_3")

    def test_sap_fuel_parser(self):
        row = {
            "mblnr": "4900123456",
            "mjahr": "2025",
            "zeile": "0001",
            "werks": "DE01",
            "budat": "20250331",
            "menge": "8500",
            "meins": "L",
            "bwart": "201",
        }
        result = parse_sap_fuel_row(row)
        self.assertIsNotNone(result.success)
        self.assertEqual(result.success.scope, "scope_1")

    def test_utility_parser_flags_long_period(self):
        row = {
            "account_number": "3456333333-0",
            "bill_period_start": "2024-11-01",
            "bill_period_end": "2024-12-20",
            "kwh_used": "1420",
        }
        result = parse_utility_row(row)
        self.assertTrue(any("Billing period" in f for f in result.success.flag_reasons))

    def test_travel_missing_iata_flags(self):
        row = {
            "source_record_id": "uuid-c3b1",
            "trip_id": "T-44902",
            "mode": "ground",
            "start_datetime_utc": "2025-04-01T08:15:00Z",
            "origin_iata": "XXX",
            "destination_iata": "YYY",
            "booking_status": "confirmed",
        }
        result = parse_travel_row(row)
        self.assertTrue(any("Distance" in f for f in result.success.flag_reasons))


class UploadFlowTests(TestCase):
    def setUp(self):
        self.org = Organization.objects.create(name="Test Org", slug="test-org")
        self.user = User.objects.create_user(username="tester", password="pass", organization=self.org)
        Site.objects.create(organization=self.org, external_code="DE01", name="Plant", country_iso="DE")
        self.source = DataSource.objects.create(
            organization=self.org,
            name="SAP Fuel",
            source_type=DataSource.SourceType.SAP_FUEL,
            format_profile=DataSource.FormatProfile.MB51,
        )

    def test_upload_and_approve(self):
        batch = IngestionBatch.objects.create(
            organization=self.org,
            data_source=self.source,
            filename="sap_fuel_mb51.csv",
        )
        content = (SAMPLE / "sap_fuel_mb51.csv").read_bytes()
        process_batch(batch, content, self.user)
        batch.refresh_from_db()
        self.assertGreater(batch.success_count, 0)

        from activities.models import ActivityRecord

        activity = ActivityRecord.objects.filter(batch=batch).first()
        self.assertIsNotNone(activity)
        self.client.force_login(self.user)
        resp = self.client.patch(
            f"/api/v1/activities/{activity.id}/review/",
            {"action": "approve"},
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 200)
        activity.refresh_from_db()
        self.assertTrue(activity.is_locked)
