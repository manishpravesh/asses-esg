# Decisions

## SAP: ME2N + MB51 CSV exports (not OData or IDoc)

**Researched:** SAP ME2N (purchase order/spend), MB51 (goods movement), IDoc ORDERS05, OData MM services.

**Chose:** ALV spreadsheet exports saved as CSV — the format sustainability teams actually receive from IT.

**Ignored:** IDoc parsing (integration middleware), OData (requires IT app registration), IS-U utility billing.

**Subset:** Procurement spend lines + fuel goods issues (movement types 201/261). German and English column headers supported via alias map.

## Utility: Portal monthly CSV (not PDF OCR)

**Researched:** PG&E Download My Data, SCE Rule 24 CSV, Green Button ESPI, PDF bill layouts.

**Chose:** Monthly portal CSV with account number, billing period, total kWh, rate schedule — matches what facilities teams export.

**Ignored:** PDF OCR (layout varies per utility), 15-minute interval data, Green Button OAuth.

**Subset:** One row per billing period per account. Flags periods >45 days.

## Travel: Itinerary segments (not expense reports)

**Researched:** Concur Itinerary v4 (segment-level IATA, Miles, CarbonEmissionLbs), Navan bookings API, expense report free-text locations.

**Chose:** Segment CSV shaped like Concur/Navan exports. Expense reports lack structured airport codes.

**Ignored:** Live Concur OAuth, expense↔itinerary join, radiative forcing multipliers.

**Distance fallback:** Great-circle km from IATA lookup when vendor miles absent.

## Ingestion: File upload (not live API)

Sustainability analysts receive monthly exports, not API credentials. File upload proves normalization + review UX in 4 days. API integration documented as Phase 2.

## Processing: Synchronous (not Celery)

Batch sizes for prototype are small (<10k rows). Sync processing with per-row savepoints is simpler and easier to debug.

## Questions for the PM

1. Who owns the plant master data lookup (`WERKS` → site name/country)?
2. Should approval be row-level, batch-level, or both?
3. Fiscal period vs calendar month for SAP posting dates?
4. For Scope 3 spend proxy (ME2N), is spend-based acceptable or must we wait for activity data?
5. Which travel booking statuses should be excluded (cancelled, personal)?
