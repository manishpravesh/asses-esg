# ESG Activity Ingestion Prototype

Django REST + React application for ingesting SAP, utility, and corporate travel data; normalizing to a canonical activity model; and providing an analyst review dashboard before audit lock.

## Live demo

- Backend URL: <your-backend-url>
- Frontend URL: <your-frontend-url>

**Demo credentials (after `seed_demo`):**
- Analyst: `analyst@demo.client.com` / `demo1234`

## Local development

### Prerequisites
- Python 3.12+
- Node.js 20+

### Backend
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd backend
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

### Frontend (separate dev server)
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — API proxied to :8000.

### Production-style local build
```bash
chmod +x build.sh
./build.sh
cd backend && gunicorn config.wsgi:application
```

## Sample data

Upload CSVs from `sample_data/`:
- `sap_procurement_me2n.csv`
- `sap_fuel_mb51.csv`
- `utility_pge_monthly.csv`
- `travel_concur_segments.csv`

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/auth/csrf/` | CSRF cookie |
| POST | `/api/v1/auth/login/` | Session login |
| POST | `/api/v1/batches/upload/` | Upload CSV |
| GET | `/api/v1/activities/` | Review queue |
| PATCH | `/api/v1/activities/{id}/review/` | Approve/flag/reject |
| GET | `/api/v1/dashboard/summary/` | Dashboard KPIs |

## Documentation

- [PLAN.md](docs/PLAN.md) — Full build plan
- [MODEL.md](docs/MODEL.md) — Data model
- [DECISIONS.md](docs/DECISIONS.md) — Design decisions
- [TRADEOFFS.md](docs/TRADEOFFS.md) — What we did not build
- [SOURCES.md](docs/SOURCES.md) — Source research

## Tests

```bash
cd backend && python manage.py test ingestion
```

## Architecture

```
CSV Upload → Parser → Validator → Normalizer → ActivityRecord
                    ↓                              ↓
               RawRecord                    Review Dashboard
                                                  ↓
                                            AuditEvent (lock)
```
