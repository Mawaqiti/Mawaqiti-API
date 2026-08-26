# API Reference

Base URL: `http://localhost:3000` (or your deployed origin)

- Content type: `application/json`
- All endpoints use **POST**. Any other method on an API path returns a 404 envelope.
- Every response body is wrapped in a common envelope (see below).

---

## Authentication

All `/api` routes require HTTP Basic Auth:

```
Authorization: Basic base64(CID:CSEC)
```

Generate the header:

| Environment | Snippet |
|---|---|
| JavaScript | `'Basic ' + btoa(CID + ':' + CSEC)` |
| Bash | `"Basic $(printf '%s' "$CID:$CSEC" \| base64)"` |
| PowerShell | `'Basic ' + [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("$CID:$CSEC"))` |

Credentials are compared timing-safely. Missing or wrong credentials return `401`.

### Envelope

```json
{
  "header":   { "version": "0.1", "lang": "EN", "androidVersion": 1, "iosVersion": "1.0" },
  "result":   { "status": true, "message": "Transaction completed successfully" },
  "responseData": null,
  "errors":   null
}
```

| Field | Description |
|---|---|
| `header.version` | API version string |
| `header.lang` | Response language tag |
| `result.status` | `true` on success, `false` on failure |
| `responseData` | Payload; `null` when absent |
| `errors` | `null` on success, `{ code, message }` on failure |

---

## Get Cities List

`POST /api/ref-data/cites`

### Request

Body must be valid JSON — an empty object is conventional:

```json
{}
```

```bash
curl -s -X POST http://localhost:3000/api/ref-data/cites \
  -H "Authorization: $AUTH" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Response

```json
{
  "header": {
    "version": "0.1",
    "lang": "EN",
    "androidVersion": 1,
    "iosVersion": "1.0"
  },
  "result": {
    "status": true,
    "message": "Transaction completed successfully"
  },
  "responseData": [
    { "_id": "1",  "cityname": "القدس",        "seq_no": 1,  "min_diff": -2 },
    { "_id": "2",  "cityname": "مكة المكرمة",  "seq_no": 2,  "min_diff": 0 },
    { "_id": "3",  "cityname": "المدينة المنورة","seq_no": 3, "min_diff": 0 }
  ],
  "errors": null
}
```

Returns every city in `data/cities.json`. Field meanings: [data-format.md](data-format.md#citiesjson).

---

## Errors

| Status | When | Example body |
|---|---|---|
| 400 | Malformed JSON body | `{"header":{"version":"0.1","lang":"EN"},"result":{"status":false,"message":"Invalid JSON body"},"responseData":null,"errors":{"code":400,"message":"Invalid JSON body"}}` |
| 401 | Missing/wrong Basic Auth | same envelope, `message: "Unauthorized"` |
| 404 | Unknown path or non-POST method | same envelope, `message: "Not found"` |
| 429 | More than 3 requests/min/IP | see below |

### 429 Too Many Requests

Applies to all `/api` routes combined, per client IP, fixed 60-second window.

Headers sent back:

| Header | Meaning |
|---|---|
| `RateLimit-Policy: 3;w=60` | The active policy |
| `RateLimit-Limit: 3` | Max requests per window |
| `RateLimit-Remaining` | Requests left in current window |
| `RateLimit-Reset` | Seconds until the window resets |
| `Retry-After: 60` | Seconds to wait before retrying |

Body:

```json
{
  "header": { "version": "0.1", "lang": "EN" },
  "result": { "status": false, "message": "Too many requests, retry in a minute" },
  "responseData": null,
  "errors": { "code": 429, "message": "Too many requests, retry in a minute" }
}
```

> Behind a reverse proxy? Make sure the app trusts `X-Forwarded-For` so limiting keys on real client IPs — see [deployment.md](deployment.md#reverse-proxy).

---

## Quick smoke test

```bash
AUTH="Basic $(printf '%s' "$CID:$CSEC" | base64)"
BASE=http://localhost:3000

curl -s -X POST $BASE/api/ref-data/cites -H "Authorization: $AUTH" -H "Content-Type: application/json" -d '{}' | head -c 300; echo
curl -s -o /dev/null -w "%{http_code}\n" -X POST $BASE/api/ref-data/cites -H "Content-Type: application/json" -d '{}'   # expect 401
```
