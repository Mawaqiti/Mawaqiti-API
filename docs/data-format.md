# Data Format

State is stored as a single JSON file under `data/`. It is **re-read on every request**, so you can edit it while the server runs — no restart needed. Keep it valid UTF-8 JSON; there is no schema validation, and a malformed file will cause errors on the cities endpoint.

---

## cities.json

Served verbatim by `POST /api/ref-data/cites`.

### Schema

```json
[
  { "_id": "1", "cityname": "القدس", "seq_no": 1, "min_diff": -2 }
]
```

| Field | Type | Description |
|---|---|---|
| `_id` | string | Unique city identifier |
| `cityname` | string | City name in Arabic |
| `seq_no` | number | Sort/order number used by clients |
| `min_diff` | number | Prayer-time offset in minutes relative to the base schedule |

### min_diff semantics

Clients compute final prayer times locally:

```
Final prayer time = Base prayer time + min_diff + summer adjustment (+60 min in summer)
```

Worked example — Jerusalem (`min_diff: -2`) in summer, base Fajr 05:30:

```
05:30 + 1:00 = 06:30   ->   06:30 - 0:02 = 06:28
```

Editing tips:

- Keep `_id` values unique strings. If you add/remove cities and want clean sequential ids again, run this from the project root — it re-numbers `_id`/`seq_no` to `1..N` without touching anything else:

  ```bash
  node -e "const fs=require('fs');const f='data/cities.json';const j=JSON.parse(fs.readFileSync(f,'utf8'));j.forEach((c,i)=>{c._id=String(i+1);c.seq_no=i+1;});fs.writeFileSync(f,'[\n'+j.map(o=>'  '+JSON.stringify(o)).join(',\n')+'\n]\n','utf8');console.log('rewritten:',j.length,'cities');"
  ```

- Keep `seq_no` ordering consistent if clients sort by it.
- Add or rename cities freely — the endpoint just returns whatever is in the array.
- To see the current offset distribution:

  ```bash
  node -e "const j=require('./data/cities.json');const g={};j.forEach(c=>g[c.min_diff]=(g[c.min_diff]||0)+1);console.log(Object.entries(g).sort((a,b)=>a[0]-b[0]));"
  ```
