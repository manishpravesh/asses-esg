import csv
import io
from datetime import date

from django.db import transaction
from django.utils import timezone

from activities.models import ActivityRecord, AuditEvent
from core.models import DataSource, Site
from ingestion.models import IngestionBatch, RawRecord
from ingestion.normalizers.enrich import apply_heuristics, enrich_parsed_row
from ingestion.parsers.common import map_row, normalize_header
from ingestion.parsers.sap import parse_sap_fuel_row, parse_sap_procurement_row
from ingestion.parsers.travel import parse_travel_row
from ingestion.parsers.utility import parse_utility_row

PARSERS = {
    DataSource.SourceType.SAP_PROCUREMENT: parse_sap_procurement_row,
    DataSource.SourceType.SAP_FUEL: parse_sap_fuel_row,
    DataSource.SourceType.UTILITY: parse_utility_row,
    DataSource.SourceType.TRAVEL: parse_travel_row,
}


def _to_date(value: str | None) -> date | None:
    if not value:
        return None
    return date.fromisoformat(value)


def _resolve_site(org, plant_code: str) -> Site | None:
    if not plant_code:
        return None
    return Site.objects.filter(organization=org, external_code=plant_code).first()


def process_batch(batch: IngestionBatch, file_content: bytes, user) -> IngestionBatch:
    parser = PARSERS.get(batch.data_source.source_type)
    if not parser:
        batch.status = IngestionBatch.Status.FAILED
        batch.error_summary = [{"message": "Unsupported source type."}]
        batch.completed_at = timezone.now()
        batch.save()
        return batch

    text = file_content.decode("utf-8-sig")
    reader = csv.reader(io.StringIO(text))
    rows = list(reader)
    if not rows:
        batch.status = IngestionBatch.Status.FAILED
        batch.error_summary = [{"message": "Empty CSV file."}]
        batch.completed_at = timezone.now()
        batch.save()
        return batch

    headers = rows[0]
    data_rows = rows[1:]
    batch.total_rows = len(data_rows)
    batch.save()

    org = batch.organization
    seen_ids: set[str] = set()
    error_summary = []

    with transaction.atomic():
        for idx, row in enumerate(data_rows, start=2):
            if not any(cell.strip() for cell in row):
                continue

            normalized = {normalize_header(k): v for k, v in map_row(headers, row).items()}
            raw_record = RawRecord.objects.create(
                batch=batch,
                row_number=idx,
                raw_payload=normalized,
            )

            sid = transaction.savepoint()
            try:
                result = parser(normalized)
                if result.error:
                    transaction.savepoint_rollback(sid)
                    raw_record.parse_status = RawRecord.ParseStatus.ERROR
                    raw_record.error_message = result.error.message
                    raw_record.save()
                    batch.error_count += 1
                    error_summary.append({"row": idx, "message": result.error.message})
                    continue

                parsed = enrich_parsed_row(result.success)
                site = _resolve_site(org, parsed.plant_code)
                flags = apply_heuristics(parsed, site, seen_ids)
                review_status = ActivityRecord.ReviewStatus.FLAGGED if flags else ActivityRecord.ReviewStatus.PENDING

                activity = ActivityRecord.objects.create(
                    organization=org,
                    batch=batch,
                    raw_record=raw_record,
                    site=site,
                    source_system=parsed.source_system,
                    source_row_id=parsed.source_row_id,
                    scope=parsed.scope,
                    category=parsed.category,
                    review_status=review_status,
                    flag_reasons=flags,
                    activity_date=_to_date(parsed.activity_date),
                    period_start=_to_date(parsed.period_start),
                    period_end=_to_date(parsed.period_end),
                    description=parsed.description,
                    quantity_raw=parsed.quantity_raw,
                    unit_raw=parsed.unit_raw,
                    quantity_normalized=parsed.quantity_normalized,
                    unit_normalized=parsed.unit_normalized,
                    amount=parsed.amount,
                    currency=parsed.currency,
                    source_metadata=parsed.source_metadata,
                )
                AuditEvent.objects.create(
                    organization=org,
                    activity=activity,
                    actor=user,
                    action=AuditEvent.Action.CREATED,
                    after_state={"review_status": activity.review_status},
                )
                batch.success_count += 1
                if flags:
                    batch.flagged_count += 1
                transaction.savepoint_commit(sid)
            except Exception as exc:
                transaction.savepoint_rollback(sid)
                raw_record.parse_status = RawRecord.ParseStatus.ERROR
                raw_record.error_message = str(exc)
                raw_record.save()
                batch.error_count += 1
                error_summary.append({"row": idx, "message": str(exc)})

        batch.status = IngestionBatch.Status.READY_FOR_REVIEW
        batch.error_summary = error_summary[:50]
        batch.completed_at = timezone.now()
        batch.save()

    return batch
