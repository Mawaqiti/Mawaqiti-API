# Configuration

All configuration is environment-based. There are **no credentials in the source code** — the server exits with an error at startup if required variables are missing.

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MAWAQITI_CID` | yes | — | Client ID checked by Basic Auth |
| `MAWAQITI_CSEC` | yes | — | Client secret checked by Basic Auth |
| `PORT` | no | `3000` | HTTP listen port |

## Using a .env file

The npm scripts load `.env` from the project root automatically (Node's built-in `--env-file-if-exists`):

```bash
npm start   # node --env-file-if-exists=.env server.js
npm run dev # same + --watch for auto-reload on changes
```

Setup:

```bash
cp .env.example .env
# then edit values
```

`.env` is gitignored — never commit real credentials.

## Setting variables manually

If you prefer not to use `.env`:

```bash
# bash
export MAWAQITI_CID=my-cid
export MAWAQITI_CSEC=my-secret
export PORT=3000
node server.js
```

```powershell
# PowerShell
$env:MAWAQITI_CID = 'my-cid'
$env:MAWAQITI_CSEC = 'my-secret'
node server.js
```

## Startup behavior

If `MAWAQITI_CID` or `MAWAQITI_CSEC` is unset, the process logs

```
Set MAWAQITI_CID and MAWAQITI_CSEC environment variables (or provide a .env file)
```

and exits with code `1`. Process managers should be configured to restart only after the environment is fixed (see [deployment.md](deployment.md)).

## Rotating credentials

1. Update `MAWAQITI_CID` / `MAWAQITI_CSEC` in your host's environment or `.env`.
2. Restart the process (`npm start`, `pm2 restart mawaqiti-api`, `systemctl restart mawaqiti-api`).
3. Update clients to send `Basic base64(newCID:newCSEC)`.

There is exactly one active credential pair; rotation is atomic per restart.

## Production notes

- Generate long random secrets (e.g. `openssl rand -hex 24`). Do not reuse sample values.
- Serve TLS in front of the API so Basic Auth headers are never sent in cleartext ([deployment.md](deployment.md)).
- If you run multiple instances behind a load balancer, remember rate limiting uses an in-memory store per process — each instance gets its own 3 req/min budget per client.
