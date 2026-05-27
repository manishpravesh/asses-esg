# Sample Data

Realistic CSV fixtures for testing ingestion. Each file includes at least one intentionally messy row to demonstrate flagging.

| File | Source | Notes |
|------|--------|-------|
| `sap_procurement_me2n.csv` | SAP ME2N | EU date format, unknown plant 9999, zero-quantity row |
| `sap_fuel_mb51.csv` | SAP MB51 | Movement types 201/261, L and KG units |
| `utility_pge_monthly.csv` | PG&E-style portal | 50-day billing period triggers flag |
| `travel_concur_segments.csv` | Concur/Navan segments | Invalid IATA XXX/YYY triggers distance flag |

Upload via the app **Upload** page, selecting the matching source type.
