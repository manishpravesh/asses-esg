# ESG Activity Ingestion Platform

Django REST + React prototype that ingests activity/emissions-related data from multiple enterprise sources (SAP exports, utility portal CSVs, corporate travel), normalizes it into a canonical activity model, and surfaces an analyst review workflow with an audit trail.

## Live Demo

- URL: [<your-deployed-url>](https://breatheesg-r44w.onrender.com/)

## Demo credentials

After running `python manage.py seed_demo`:

- Analyst: `analyst@demo.client.com` / `demo1234`
- Admin: `admin@demo.client.com` / `admin1234`

## What this does

| Source              | Example format            | Scope   | Method      |
| ------------------- | ------------------------- | ------- | ----------- |
| SAP procurement     | ME2N CSV export           | Scope 3 | File upload |
| SAP fuel            | MB51 CSV export           | Scope 1 | File upload |
| Utility electricity | Monthly portal CSV        | Scope 2 | File upload |
| Corporate travel    | Concur/Navan segments CSV | Scope 3 | File upload |

After upload, each row is parsed, normalized (units + dates), optionally enriched (e.g., IATA distance), flagged when suspicious, and queued for analyst review. Analysts can approve/flag/reject rows and lock approved rows for audit.

## Quick start (local)

### Prerequisites

- Python 3.12+
- Node.js 20+

### Backend

```bash
python -m venv .venv
# Windows: .\.venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt

cd backend
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

### Frontend

The frontend expects `VITE_API_URL` to point at the Django server (no trailing slash).

```bash
cd frontend
npm install

# Windows (PowerShell)
$env:VITE_API_URL = "http://localhost:8000"
npm run dev
```

Open http://localhost:5173 and log in with the demo credentials above.

### CORS/CSRF (when deploying split frontend/backend)

Set these on the backend (comma-separated lists):

- `ALLOWED_HOSTS`
- `CORS_ALLOWED_ORIGINS`
- `CSRF_TRUSTED_ORIGINS`

## Sample data

Upload these CSVs from `sample_data/`:

| File                         | Source          | Notes                                            |
| ---------------------------- | --------------- | ------------------------------------------------ |
| `sap_procurement_me2n.csv`   | SAP ME2N        | EU date format, unknown plant, zero-quantity row |
| `sap_fuel_mb51.csv`          | SAP MB51        | Movement types 201/261, L and KG units           |
| `utility_pge_monthly.csv`    | Utility portal  | Long billing period triggers flag                |
| `travel_concur_segments.csv` | Travel segments | Invalid IATA triggers distance flag              |

## Architecture

```
backend/
├── config/       Django settings + URL routing
├── core/         Users, organizations, tenancy middleware
├── ingestion/    Parsers, normalization, batch processing
├── activities/   ActivityRecord model, review workflow, audit events
└── manage.py

frontend/
└── src/
    ├── api/         Axios API client
    ├── components/  Layout, StatusBadge, FileDropzone
    └── pages/       Login, Dashboard, Upload, Review
```

## Documentation

- [docs/MODEL.md](docs/MODEL.md) — data model + field glossary
- [docs/DECISIONS.md](docs/DECISIONS.md) — key design decisions
- [docs/TRADEOFFS.md](docs/TRADEOFFS.md) — deliberate non-builds
- [docs/SOURCES.md](docs/SOURCES.md) — source research + assumptions
- [docs/PLAN.md](docs/PLAN.md) — original build plan

## Deployment (Render)

Render can deploy this repo using `render.yaml` (web service + PostgreSQL). Ensure production env vars are set (at minimum `SECRET_KEY`, plus the host/origin vars above).
