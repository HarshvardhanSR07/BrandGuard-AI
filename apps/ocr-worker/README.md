# BrandGuard AI — OCR & Document Extraction Worker

Optional Python microservice for optical character recognition, layout-aware PDF extraction, and document normalization.

## Requirements
- Python 3.10+
- Tesseract OCR & Poppler utils

## Running locally
```bash
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
