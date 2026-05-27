from dataclasses import dataclass, field
from decimal import Decimal

from activities.models import ActivityRecord


@dataclass
class ParsedRow:
    source_row_id: str
    scope: str
    category: str
    source_system: str
    activity_date: str | None = None
    period_start: str | None = None
    period_end: str | None = None
    description: str = ""
    quantity_raw: Decimal | None = None
    unit_raw: str = ""
    quantity_normalized: Decimal | None = None
    unit_normalized: str = ""
    amount: Decimal | None = None
    currency: str = ""
    plant_code: str = ""
    source_metadata: dict = field(default_factory=dict)
    flag_reasons: list[str] = field(default_factory=list)


@dataclass
class ParseError:
    message: str


@dataclass
class ParseResult:
    success: ParsedRow | None = None
    error: ParseError | None = None
