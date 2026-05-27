from core.models import Site
from ingestion.normalizers.units import normalize_quantity, normalize_unit, unit_is_whitelisted
from ingestion.parsers.base import ParsedRow


def pad_plant_code(code: str) -> str:
    code = (code or "").strip()
    if code.isdigit() and len(code) < 4:
        return code.zfill(4)
    return code


def apply_heuristics(parsed: ParsedRow, site: Site | None, seen_source_ids: set[str]) -> list[str]:
    flags = list(parsed.flag_reasons)

    if parsed.source_row_id in seen_source_ids:
        flags.append("Duplicate source row ID within this upload batch.")
    seen_source_ids.add(parsed.source_row_id)

    if parsed.plant_code and site is None:
        flags.append("Plant/site code not found in organization lookup table.")

    if parsed.unit_raw and not unit_is_whitelisted(parsed.unit_raw):
        flags.append(f"Unit '{parsed.unit_raw}' is not in the approved unit whitelist.")

    if parsed.quantity_raw is not None and parsed.quantity_raw == 0 and parsed.amount and parsed.amount > 0:
        flags.append("Spend is recorded but activity quantity is zero.")

    if (parsed.quantity_raw is None or parsed.quantity_raw == 0) and (parsed.amount is None or parsed.amount == 0):
        flags.append("Both quantity and spend are zero — row may be empty.")

    return flags


def enrich_parsed_row(parsed: ParsedRow) -> ParsedRow:
    _, unit_norm = normalize_unit(parsed.unit_raw)
    qty_norm, unit_final = normalize_quantity(parsed.quantity_raw, parsed.unit_raw, unit_norm)
    parsed.unit_normalized = unit_final
    parsed.quantity_normalized = qty_norm
    parsed.plant_code = pad_plant_code(parsed.plant_code)
    return parsed
