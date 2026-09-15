
# LODE

LODE is a web-based HTTP security analyzer. It checks response headers, cookie attributes, CORS configuration, browser policies, and server disclosure indicators, then returns findings with severity, remediation, documentation links, and a score.

LODE is open source and open for pull requests.

## Features

- Analyze a live URL (`POST /analyze` with `url`)
- Analyze pasted raw headers (`POST /analyze` with `raw_headers`)
- SSRF protection for URL fetching
- Checks for HSTS, CSP, framing, referrer, permissions, cookies, CORS, content-type, cache, cross-origin, and information disclosure
- Severity-based scoring and summary counts
- React UI with URL and raw-header modes, loading states, error handling, severity filters, expandable remediation, documentation links, responsive layout, and light/dark theme

## Structure

```text
backend/
    main.py                 FastAPI application and API routes
    app/
        analyzer.py         Header parsing and security checks
        fetcher.py          URL validation and header fetching
        models.py           Pydantic request and response models
        scoring.py          Severity summary and score calculation
    requirements.txt

frontend/
    src/
        App.tsx             Main page and request state
        components/site/    Header, analyzer input, results, hero, footer
        components/ui/      Shared Button, Card, and Input primitives
        lib/api.ts          Centralized API client
        lib/types.ts        API TypeScript types
    .env                    Local API configuration
    .env.example            Deployment configuration template
```

## Requirements

- Python 3.10+
- Node.js and npm

## Local development

Backend:

```powershell
cd backend
.venv\Scripts\Activate.ps1
fastapi dev main.py
```

Runs at `http://127.0.0.1:8000`. Docs at `/docs`.

Frontend, in a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:5173`.

`.env`:

```env
VITE_API_URL=http://localhost:8000
```

## API

### Health check

```http
GET /health
```

```json
{ "status": "ok" }
```

### Analyze

`POST /analyze` with either:

```json
{ "url": "https://example.com" }
```

or:

```json
{ "raw_headers": "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nStrict-Transport-Security: max-age=31536000\r\n" }
```

Exactly one of `url` or `raw_headers` is required. URL mode validates the target, rejects private/local network addresses, fetches headers, and analyzes them.

### Response

```json
{
    "url": "https://example.com",
    "score": 72.5,
    "summary": {
        "total_findings": 4,
        "severity_summary": {
            "critical": 0,
            "high": 1,
            "medium": 2,
            "low": 1
        },
        "score": 72.5
    },
    "findings": [
        {
            "id": "csp_missing",
            "control": "csp",
            "title": "Content Security Policy (CSP) Header Missing",
            "severity": "high",
            "status": "fail",
            "detail": "...",
            "remediation": "...",
            "url": "https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP",
            "raw_headers": null
        }
    ]
}
```

## Validation

```powershell
cd frontend
npm run build
```

```powershell
cd backend
.venv\Scripts\python.exe -m compileall app main.py
```

## Contributing

Pull requests are welcome. Fork the repo, create a feature branch, and open a PR against `main`.
