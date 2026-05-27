# Tradeoffs — Three Things We Deliberately Did Not Build

## 1. Live API integrations (Concur OAuth, Green Button, SAP OData)

**Why cut:** Each integration requires credential provisioning, OAuth flows, pagination, and error handling — 1–2 days per source. The assignment's core challenge is normalization and analyst review, not integration plumbing.

**What we did instead:** CSV upload with realistic column maps based on Concur Itinerary v4, PG&E portal exports, and SAP ME2N/MB51 field names.

**Phase 2 path:** Concur Itinerary v4 as primary pull; utility aggregator API (UtilityAPI-style normalized schema); SAP OData for automated delta sync.

## 2. PDF / OCR utility bill ingestion

**Why cut:** PDF layouts vary wildly by utility and region. OCR adds non-deterministic parsing, heavy dependencies, and hard-to-defend extraction accuracy in a 4-day window.

**What we did instead:** Portal monthly CSV — the format facilities teams already export when they don't want to re-key bill data.

**Phase 2 path:** Template-based PDF extraction for top 5 utilities in client portfolio, with human confirmation queue.

## 3. Full emission factor calculation engine

**Why cut:** The assignment states "the hard part isn't computing carbon — it's ingestion and normalization." Building a DEFRA/GHG Protocol factor library, regional grid factors, and RFI multipliers would distract from data model and review UX quality.

**What we did instead:** Scope/category assignment, unit normalization, distance enrichment, and vendor-provided carbon fields stored in metadata for validation.

**Phase 2 path:** Factor table by category + region + year; activity × factor at approval time; locked factors snapshotted on audit lock.
