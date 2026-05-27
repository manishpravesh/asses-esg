# Data Sources — Research and Sample Data Rationale

## 1. SAP — Fuel and Procurement

### Real-world format researched
- **ME2N** — SAP transaction for purchase orders by material/plant; columns `EBELN`, `EBELP`, `WERKS`, `MENGE`, `MEINS`, `NETWR`, `WAERS`
- **MB51** — Material document list; fuel as goods issue (`BWART` 201/261) with `BUDAT`, `MATNR`, `MENGE`

### What we learned
- Sustainability teams get Excel/CSV exports from MM colleagues, not raw IDocs
- Plant codes (`WERKS`) need lookup tables; leading zeros stripped by Excel
- Dates appear as `YYYYMMDD`, `DD.MM.YYYY`, or US formats in the same portfolio
- German headers (`Werk`, `Bestellmenge`) appear in EU deployments

### Sample files
- `sample_data/sap_procurement_me2n.csv` — includes EU date format row and unknown plant `9999`
- `sample_data/sap_fuel_mb51.csv` — liters + kg units, movement types 201/261

### What breaks at scale
- Excel scientific notation on material numbers
- Duplicate grain (PO vs GR vs invoice)
- Custom Z-fields for emission category not in standard export layout

---

## 2. Utility — Electricity

### Real-world format researched
- PG&E "Download My Data" monthly summary CSV
- SCE Rule 24 pipe-delimited enterprise format
- Green Button ESPI billing period summaries

### What we learned
- Portal CSVs are usage-heavy, billing-light (kWh yes, full charge breakdown often no)
- Billing periods rarely align to calendar months (e.g. Dec 7 – Jan 6)
- Account number ≠ service agreement ID at some utilities

### Sample file
- `sample_data/utility_pge_monthly.csv` — PG&E-style columns, rate schedule E-19, one 50-day period flagged

### What breaks at scale
- Multi-meter premises aggregated on one bill
- Estimated vs actual reads not always flagged in CSV
- CCA/supplier sections split across PDF sections not in portal export

---

## 3. Corporate Travel

### Real-world format researched
- SAP Concur Itinerary v4 air/hotel/car/ride segment schemas
- Navan `/bookings` with `flight_miles`, `carbon_emissions`, segment `Location.airport_code`
- GHG Protocol Scope 3 Category 6 distance-based requirements

### What we learned
- Trip/itinerary data has IATA codes and vendor miles; expense reports do not
- Hotel segments use nights, not distance
- Cancelled bookings must be filtered or flagged
- Distance often missing for ground transport — IATA great-circle fallback needed

### Sample file
- `sample_data/travel_concur_segments.csv` — LHR↔JFK round trip, hotel stay, mileage claim, ground segment with invalid IATA (XXX/YYY) to trigger distance flag

### What breaks at scale
- Multi-leg connections counted as separate segments
- Personal vs business travel not always tagged
- Vendor carbon (`CarbonEmissionLbs`) uses undisclosed model — needs validation not blind trust
