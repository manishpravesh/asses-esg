from datetime import datetime
from decimal import Decimal, InvalidOperation

from dateutil import parser as date_parser


def parse_date(value: str | None):
    if not value or not str(value).strip():
        return None
    raw = str(value).strip()
    if raw.isdigit() and len(raw) == 8:
        return datetime.strptime(raw, "%Y%m%d").date()
    try:
        return date_parser.parse(raw, dayfirst=True).date()
    except (ValueError, TypeError, OverflowError):
        return None


def parse_decimal(value) -> Decimal | None:
    if value is None or value == "":
        return None
    try:
        cleaned = str(value).replace(",", "").strip()
        return Decimal(cleaned)
    except (InvalidOperation, ValueError):
        return None


def normalize_header(header: str) -> str:
    return header.strip().lower().replace(" ", "_").replace("-", "_")


def map_row(headers: list[str], row: list[str]) -> dict[str, str]:
    return {normalize_header(h): (row[i].strip() if i < len(row) else "") for i, h in enumerate(headers)}


HEADER_ALIASES = {
    "company_code": {"bukrs", "company_code", "company"},
    "plant_code": {"werks", "plant_code", "plant", "werk"},
    "material_id": {"matnr", "material_id", "material"},
    "material_group": {"matkl", "material_group"},
    "description": {"txz01", "maktx", "description", "material_description"},
    "vendor_id": {"lifnr", "vendor_id", "vendor"},
    "quantity": {"menge", "quantity", "qty", "kwh_used", "kwh", "usage_kwh", "total_kwh"},
    "unit": {"meins", "unit", "uom", "units"},
    "net_amount": {"netwr", "net_amount", "amount", "total_charges", "amount_usd"},
    "currency": {"waers", "currency"},
    "cost_center": {"kostl", "cost_center"},
    "posting_date": {"budat", "posting_date", "bedat", "order_date"},
    "movement_type": {"bwart", "movement_type"},
    "source_row_id": {"source_row_id", "ebeln_ebelp", "document_line"},
    "account_number": {"account_number", "account", "serv_acct_id", "billing_account"},
    "bill_period_start": {"bill_period_start", "billper_strt_dt", "period_start", "start_date"},
    "bill_period_end": {"bill_period_end", "billper_end_dt", "period_end", "end_date"},
    "rate_schedule": {"rate_schedule", "service_tariff", "tariff"},
    "meter_id": {"meter_id", "mtr_id_num", "meter_number"},
    "mode": {"mode", "segment_type", "booking_type"},
    "origin_iata": {"origin_iata", "startcitycode", "origin_airport_code"},
    "destination_iata": {"destination_iata", "endcitycode", "destination_airport_code"},
    "origin_city": {"origin_city", "startcity"},
    "destination_city": {"destination_city", "endcity"},
    "distance_km": {"distance_km", "miles", "flight_miles", "distance"},
    "cabin_class": {"cabin_class", "cabin", "class_of_service"},
    "hotel_nights": {"hotel_nights", "nights"},
    "traveler_email": {"traveler_email", "email"},
    "trip_id": {"trip_id", "itinerary_locator"},
    "booking_status": {"booking_status", "status"},
    "passenger_count": {"passenger_count", "num_persons", "number_of_passengers"},
}


def resolve_field(normalized_row: dict[str, str], canonical: str) -> str:
    aliases = HEADER_ALIASES.get(canonical, {canonical})
    for key, value in normalized_row.items():
        if key in aliases and value:
            return value
    return ""
