from decimal import Decimal

UNIT_ALIASES = {
    "L": "L",
    "LTR": "L",
    "LITRE": "L",
    "LITER": "L",
    "LITERS": "L",
    "KG": "kg",
    "KGS": "kg",
    "TO": "t",
    "TON": "t",
    "TONNE": "t",
    "KWH": "kWh",
    "MWH": "MWh",
    "KM": "km",
    "MI": "mi",
    "MILES": "mi",
    "NIGHTS": "nights",
}

CONVERSIONS = {
    ("L", "L"): Decimal("1"),
    ("kg", "kg"): Decimal("1"),
    ("t", "kg"): Decimal("1000"),
    ("kWh", "kWh"): Decimal("1"),
    ("MWh", "kWh"): Decimal("1000"),
    ("km", "km"): Decimal("1"),
    ("mi", "km"): Decimal("1.60934"),
    ("nights", "nights"): Decimal("1"),
}

WHITELIST = set(UNIT_ALIASES.values()) | {"kg", "t", "mi", "MWh"}


def normalize_unit(unit: str) -> tuple[str, str]:
    raw = (unit or "").strip().upper()
    canonical = UNIT_ALIASES.get(raw, raw)
    return raw, canonical


def normalize_quantity(quantity: Decimal | None, unit_raw: str, unit_normalized: str) -> tuple[Decimal | None, str]:
    if quantity is None:
        return None, unit_normalized
    key = (unit_normalized, unit_normalized)
    factor = CONVERSIONS.get(key, Decimal("1"))
    return (quantity * factor).quantize(Decimal("0.000001")), unit_normalized


def unit_is_whitelisted(unit: str) -> bool:
    _, canonical = normalize_unit(unit)
    return canonical in WHITELIST or canonical.lower() in {u.lower() for u in WHITELIST}
