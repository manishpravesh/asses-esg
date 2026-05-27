#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
source .venv/bin/activate
pip install -q -r requirements.txt
cd frontend && npm ci && npm run build
cd ../backend
python manage.py collectstatic --noinput
python manage.py migrate
python manage.py seed_demo
