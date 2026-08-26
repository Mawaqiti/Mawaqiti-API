# Deployment

The app is a single stateless Node process plus two JSON files under `data/` — deploy it anywhere Node runs.

## Prerequisites

- Node.js >= 22.9 (the start scripts use `--env-file-if-exists`; on older Node, export env vars manually instead)
- 1 CPU / 256 MB RAM is plenty

## Run directly

```bash
npm ci --omit=dev
npm start
```

## PM2

```bash
npm install -g pm2
pm2 start npm --name mawaqiti-api -- start
pm2 save
```

`pm2 start npm -- start` runs the `start` script, so `.env` loading works unchanged.

## systemd (Linux)

```ini
# /etc/systemd/system/mawaqiti-api.service
[Unit]
Description=Mawaqiti API
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/mawaqiti-api
ExecStart=/usr/bin/node --env-file-if-exists=.env server.js
Restart=on-failure
User=www-data

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now mawaqiti-api
```

## Docker (optional)

No Dockerfile ships with the repo; a minimal one looks like:

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY server.js ./
COPY data ./data
EXPOSE 3000
CMD ["node", "server.js"]
```

Pass credentials via `-e MAWAQITI_CID=... -e MAWAQITI_CSEC=...` instead of baking `.env` into the image.

## Reverse proxy

Run Node on localhost and terminate TLS at a proxy.

### nginx

```nginx
server {
    listen 443 ssl http2;
    server_name api.example.com;

    ssl_certificate     /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

### Caddy

```
api.example.com {
    reverse_proxy 127.0.0.1:3000
}
```

### Trusting proxy headers (important)

Behind a proxy, all requests share the proxy's IP unless you tell Express to trust forwarded headers. Add this near the top of `server.js` when deploying behind nginx/Caddy/load balancer:

```js
app.set('trust proxy', 1);
```

Without it, rate limiting treats every visitor as one IP and can lock everyone out after 3 requests/min combined.

## Data persistence

- State lives entirely in `data/cities.json`.
- Back up the `data/` directory alongside the code (or bake it into your image).

## Production checklist

- [ ] Custom random `MAWAQITI_CSEC` set (not any sample value)
- [ ] HTTPS enforced at the proxy
- [ ] `app.set('trust proxy', ...)` configured if proxied
- [ ] `data/` directory backed up / mounted as volume
- [ ] Process manager restarting on failure
- [ ] `.env` and `Mawagets-API-Docs.md` absent from version control
