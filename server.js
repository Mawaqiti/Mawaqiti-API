const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

const PORT = process.env.PORT || 3000;
const CID = process.env.MAWAQITI_CID;
const CSEC = process.env.MAWAQITI_CSEC;

if (!CID || !CSEC) {
  console.error('Set MAWAQITI_CID and MAWAQITI_CSEC environment variables (or provide a .env file)');
  process.exit(1);
}

const DATA_DIR = path.join(__dirname, 'data');
const CITIES_FILE = path.join(DATA_DIR, 'cities.json');

const app = express();
app.use(express.json());

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

function envelope(data, extraHeader = {}) {
  return {
    header: { version: '0.1', lang: 'EN', ...extraHeader },
    result: { status: true, message: 'Transaction completed successfully' },
    responseData: data,
    errors: null
  };
}

function errorEnvelope(status, message) {
  return {
    header: { version: '0.1', lang: 'EN' },
    result: { status: false, message },
    responseData: null,
    errors: { code: status, message }
  };
}

app.use('/api', rateLimit({
  windowMs: 60 * 1000,
  limit: 3,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json(errorEnvelope(429, 'Too many requests, retry in a minute'))
}));

app.use('/api', (req, res, next) => {
  const expected = 'Basic ' + Buffer.from(CID + ':' + CSEC).toString('base64');
  const provided = req.headers.authorization || '';
  const valid =
    provided.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
  if (!valid) {
    return res.status(401).json(errorEnvelope(401, 'Unauthorized'));
  }
  next();
});

app.post('/api/ref-data/cites', (req, res) => {
  res.json(envelope(readJson(CITIES_FILE), { androidVersion: 1, iosVersion: '1.0' }));
});

app.use((req, res) => {
  res.status(404).json(errorEnvelope(404, 'Not found'));
});

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return res.status(400).json(errorEnvelope(400, 'Invalid JSON body'));
  }
  next(err);
});

app.listen(PORT, () => {
  console.log(`Mawaqiti API running on http://localhost:${PORT}`);
});
