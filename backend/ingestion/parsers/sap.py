from decimal import Decimal

from activities.models import ActivityRecord
from ingestion.parsers.base import ParseError, ParsedRow, ParseResult
from ingestion.parsers.common import parse_date, parse_decimal, resolve_field


def parse_sap_procurement_row(normalized_row: dict[str, str]) -> ParseResult:
    source_row_id = resolve_field(normalized_row, "source_row_id")
    if not source_row_id:
        ebeln = normalized_row.get("ebeln", "")
        ebelp = normalized_row.get("ebelp", "")
        if ebeln:
            source_row_id = f"{ebeln}-{ebelp or '00010'}"

    posting_date = parse_date(resolve_field(normalized_row, "posting_date"))
    quantity = parse_decimal(resolve_field(normalized_row, "quantity"))
    unit = resolve_field(normalized_row, "unit").upper()
    amount = parse_decimal(resolve_field(normalized_row, "net_amount"))
    plant = resolve_field(normalized_row, "plant_code")

    if not source_row_id:
        return ParseResult(error=ParseError("Missing source row identifier (EBELN/EBELP or source_row_id)."))
    if posting_date is None:
        return ParseResult(error=ParseError("Could not parse posting/order date."))

    flags = []
    if quantity is not None and quantity == 0 and (amount is None or amount == 0):
        flags.append("Both quantity and spend are zero — row may be empty.")

    return ParseResult(
        success=ParsedRow(
            source_row_id=source_row_id,
            scope=ActivityRecord.Scope.SCOPE_3,
            category=ActivityRecord.Category.PURCHASED_GOODS,
            source_system=ActivityRecord.SourceSystem.SAP_ME2N,
            activity_date=posting_date.isoformat(),
            description=resolve_field(normalized_row, "description"),
            quantity_raw=quantity,
            unit_raw=unit,
            quantity_normalized=quantity,
            unit_normalized=unit,
            amount=amount,
            currency=resolve_field(normalized_row, "currency").upper(),
            plant_code=plant,
            source_metadata={
                "company_code": resolve_field(normalized_row, "company_code"),
                "material_id": resolve_field(normalized_row, "material_id"),
                "material_group": resolve_field(normalized_row, "material_group"),
                "vendor_id": resolve_field(normalized_row, "vendor_id"),
                "cost_center": resolve_field(normalized_row, "cost_center"),
                "spend_based_proxy": True,
            },
            flag_reasons=flags,
        )
    )


def parse_sap_fuel_row(normalized_row: dict[str, str]) -> ParseResult:
    source_row_id = resolve_field(normalized_row, "source_row_id")
    if not source_row_id:
        mblnr = normalized_row.get("mblnr", "")
        mjahr = normalized_row.get("mjahr", "")
        zeile = normalized_row.get("zeile", "")
        if mblnr:
            source_row_id = f"{mblnr}-{mjahr}-{zeile or '0001'}"

    posting_date = parse_date(resolve_field(normalized_row, "posting_date"))
    quantity = parse_decimal(resolve_field(normalized_row, "quantity"))
    unit = resolve_field(normalized_row, "unit").upper()
    plant = resolve_field(normalized_row, "plant_code")

    if not source_row_id:
        return ParseResult(error=ParseError("Missing goods movement identifier."))
    if posting_date is None:
        return ParseResult(error=ParseError("Could not parse posting date (BUDAT)."))
    if quantity is None:
        return ParseResult(error=ParseError("Missing fuel quantity (MENGE)."))

    return ParseResult(
        success=ParsedRow(
            source_row_id=source_row_id,
            scope=ActivityRecord.Scope.SCOPE_1,
            category=ActivityRecord.Category.FUEL_COMBUSTION,
            source_system=ActivityRecord.SourceSystem.SAP_MB51,
            activity_date=posting_date.isoformat(),
            description=resolve_field(normalized_row, "description") or resolve_field(normalized_row, "material_id"),
            quantity_raw=quantity,
            unit_raw=unit,
            quantity_normalized=quantity,
            unit_normalized=unit,
            plant_code=plant,
            source_metadata={
                "company_code": resolve_field(normalized_row, "company_code"),
                "material_id": resolve_field(normalized_row, "material_id"),
                "material_group": resolve_field(normalized_row, "material_group"),
                "movement_type": resolve_field(normalized_row, "movement_type"),
                "cost_center": resolve_field(normalized_row, "cost_center"),
            },
        )
    )
