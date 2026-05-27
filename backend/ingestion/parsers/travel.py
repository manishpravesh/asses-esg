import json
import math
from decimal import Decimal
from pathlib import Path

from activities.models import ActivityRecord
from ingestion.parsers.base import ParseError, ParsedRow, ParseResult
from ingestion.parsers.common import parse_date, parse_decimal, resolve_field

IATA_DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "iata_airports.json"


def _load_iata() -> dict[str, dict]:
    if not IATA_DATA_PATH.exists():
        return {}
    with open(IATA_DATA_PATH) as f:
        return json.load(f)


IATA_AIRPORTS = _load_iata()


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> Decimal:
    r = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return Decimal(str(round(2 * r * math.asin(math.sqrt(a)), 2)))


def resolve_distance_km(normalized_row: dict[str, str], mode: str) -> tuple[object | None, str]:
    raw = resolve_field(normalized_row, "distance_km")
    if raw:
        val = parse_decimal(raw)
        if val is not None:
            if normalized_row.get("miles") or "mile" in str(normalized_row.get("unit", "")).lower():
                return (val * Decimal("1.60934")).quantize(Decimal("0.01")), "vendor_miles"
            return val, "vendor_distance"

    origin = resolve_field(normalized_row, "origin_iata").upper()
    dest = resolve_field(normalized_row, "destination_iata").upper()
    if origin and dest and origin in IATA_AIRPORTS and dest in IATA_AIRPORTS:
        o = IATA_AIRPORTS[origin]
        d = IATA_AIRPORTS[dest]
        return haversine_km(o["lat"], o["lon"], d["lat"], d["lon"]), "iata_great_circle"
    return None, ""


def parse_travel_row(normalized_row: dict[str, str]) -> ParseResult:
    source_row_id = resolve_field(normalized_row, "source_row_id")
    if not source_row_id:
        trip = resolve_field(normalized_row, "trip_id")
        mode = resolve_field(normalized_row, "mode").lower()
        source_row_id = f"{trip}-{mode}-{normalized_row.get('segment_sequence', '1')}"

    mode = resolve_field(normalized_row, "mode").lower() or "air"
    start = parse_date(normalized_row.get("start_datetime_utc") or resolve_field(normalized_row, "posting_date"))
    status = resolve_field(normalized_row, "booking_status").lower()

    if not source_row_id:
        return ParseResult(error=ParseError("Missing travel segment identifier."))
    if start is None:
        return ParseResult(error=ParseError("Could not parse travel start date."))

    distance, distance_source = resolve_distance_km(normalized_row, mode)
    hotel_nights = parse_decimal(resolve_field(normalized_row, "hotel_nights"))
    flags = []

    if status in {"cancelled", "canceled"}:
        flags.append("Booking was cancelled — verify before including in emissions.")

    if mode in {"air", "rail", "ground", "car_rental", "mileage"} and distance is None:
        flags.append("Distance could not be determined from vendor data or airport codes.")

    source_system = ActivityRecord.SourceSystem.CONCUR
    if normalized_row.get("source_system", "").startswith("navan"):
        source_system = ActivityRecord.SourceSystem.NAVAN

    qty = distance if mode != "hotel" else hotel_nights
    unit = "km" if mode != "hotel" else "nights"
    if mode == "hotel" and hotel_nights is not None:
        qty = hotel_nights
        unit = "nights"

    return ParseResult(
        success=ParsedRow(
            source_row_id=source_row_id,
            scope=ActivityRecord.Scope.SCOPE_3,
            category=ActivityRecord.Category.BUSINESS_TRAVEL,
            source_system=source_system,
            activity_date=start.isoformat(),
            description=f"{mode.title()} — {resolve_field(normalized_row, 'origin_city')} to {resolve_field(normalized_row, 'destination_city')}".strip(" —"),
            quantity_raw=qty,
            unit_raw=unit,
            quantity_normalized=qty,
            unit_normalized=unit,
            amount=parse_decimal(resolve_field(normalized_row, "net_amount")),
            currency="USD",
            source_metadata={
                "mode": mode,
                "origin_iata": resolve_field(normalized_row, "origin_iata").upper(),
                "destination_iata": resolve_field(normalized_row, "destination_iata").upper(),
                "origin_city": resolve_field(normalized_row, "origin_city"),
                "destination_city": resolve_field(normalized_row, "destination_city"),
                "cabin_class": resolve_field(normalized_row, "cabin_class"),
                "traveler_email": resolve_field(normalized_row, "traveler_email"),
                "trip_id": resolve_field(normalized_row, "trip_id"),
                "distance_source": distance_source,
                "booking_status": status,
            },
            flag_reasons=flags,
        )
    )
