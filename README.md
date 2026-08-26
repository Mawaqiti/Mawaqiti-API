# Mawaqiti API

A lightweight, self-hosted REST API for prayer-time companion apps. It serves **city reference data** (a configurable city list with per-city time offsets) — with the exact same request/response contract as the service it replaces, so existing clients keep working without changes.

> Prayer times themselves are intentionally *not* served by this API — clients calculate them locally from hardcoded arrays and use `min_diff` from this API as a per-city adjustment.

## Features

- Drop-in compatible cities endpoint (`/api/ref-data/cites`)
- HTTP Basic Auth (timing-safe comparison)
- Rate limiting: **3 requests / minute / IP**
- JSON-file storage — zero database, zero setup
- Uniform JSON response envelope for success *and* errors
- UTF-8 Arabic city names out of the box

## Requirements

| Tool | Version |
|------|---------|
| Node.js | >= 22.9 (for `--env-file-if-exists` support) |
| npm | >= 10 |

## Quick start

```bash
git clone https://github.com/Mawaqiti/Mawaqiti-API.git mawaqiti-api
cd mawaqiti-api
npm install
cp .env.example .env      # Windows: copy .env.example .env
# edit .env -> set MAWAQITI_CID / MAWAQITI_CSEC
npm start
```

Server listens on `http://localhost:3000` by default.

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/ref-data/cites` | All cities + time offsets |

All routes require Basic Auth and accept JSON bodies only.

```bash
AUTH="Basic $(printf '%s' 'my-cid:my-csec' | base64)"
curl -s -X POST http://localhost:3000/api/ref-data/cites \
  -H "Authorization: $AUTH" -H "Content-Type: application/json" -d '{}'
```

Full request/response details: [docs/api-reference.md](docs/api-reference.md)

## Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MAWAQITI_CID` | yes | — | Client ID used for Basic Auth |
| `MAWAQITI_CSEC` | yes | — | Client secret used for Basic Auth |
| `PORT` | no | `3000` | HTTP listen port |

The server refuses to start if credentials are missing. Details: [docs/configuration.md](docs/configuration.md)

## Response envelope

Every response uses the same shape:

```json
{
  "header": { "version": "0.1", "lang": "EN", "androidVersion": 1, "iosVersion": "1.0" },
  "result": { "status": true, "message": "Transaction completed successfully" },
  "responseData": [],
  "errors": null
}
```

On failure: `result.status` is `false` and `errors` carries `{ code, message }`.

## Data

City data lives in a plain JSON file you can edit freely:

```
data/
└── cities.json   # city list: _id, cityname, seq_no, min_diff
```

Files are re-read on every request, so edits apply immediately — no restart needed. Schema docs: [docs/data-format.md](docs/data-format.md)

## Project structure

```
mawaqiti-api/
├── server.js            # Express app: auth, rate limit, routes
├── package.json
├── .env                 # your secrets (never committed)
├── .env.example         # template
├── data/
│   └── cities.json
└── docs/
    ├── api-reference.md
    ├── configuration.md
    ├── deployment.md
    └── data-format.md
```

## Deployment

Runs anywhere Node runs. See [docs/deployment.md](docs/deployment.md) for PM2, systemd, reverse-proxy (nginx/Caddy) setups and a production checklist.

## Disclaimer

This is an independent, self-hosted implementation built for personal use. It is not affiliated with or endorsed by mawagets.net.
