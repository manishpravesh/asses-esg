from datetime import date

from activities.models import ActivityRecord
from ingestion.parsers.base import ParseError, ParsedRow, ParseResult
from ingestion.parsers.common import parse_date, parse_decimal, resolve_field


def parse_utility_row(normalized_row: dict[str, str]) -> ParseResult:
    account = resolve_field(normalized_row, "account_number")
    period_start = parse_date(resolve_field(normalized_row, "bill_period_start"))
    period_end = parse_date(resolve_field(normalized_row, "bill_period_end"))
    kwh = parse_decimal(resolve_field(normalized_row, "quantity"))
    meter_id = resolve_field(normalized_row, "meter_id")

    if not account:
        return ParseResult(error=ParseError("Missing utility account number."))
    if period_start is None or period_end is None:
        return ParseResult(error=ParseError("Could not parse billing period start/end dates."))
    if kwh is None:
        return ParseResult(error=ParseError("Missing kWh consumption value."))

    source_row_id = f"{account}-{period_start.isoformat()}-{period_end.isoformat()}"
    flags = []

    days = (period_end - period_start).days
    if days > 45:
        flags.append(f"Billing period spans {days} days — longer than a typical monthly cycle.")

    return ParseResult(
        success=ParsedRow(
            source_row_id=source_row_id,
            scope=ActivityRecord.Scope.SCOPE_2,
            category=ActivityRecord.Category.PURCHASED_ELECTRICITY,
            source_system=ActivityRecord.SourceSystem.UTILITY_PORTAL,
            activity_date=period_end.isoformat(),
            period_start=period_start.isoformat(),
            period_end=period_end.isoformat(),
            description=f"Electricity — account {account}",
            quantity_raw=kwh,
            unit_raw="KWH",
            quantity_normalized=kwh,
            unit_normalized="kWh",
            amount=parse_decimal(resolve_field(normalized_row, "net_amount")),
            currency="USD",
            plant_code=account,
            source_metadata={
                "account_number": account,
                "meter_id": meter_id,
                "rate_schedule": resolve_field(normalized_row, "rate_schedule"),
                "billing_days": days,
            },
            flag_reasons=flags,
        )
    )
