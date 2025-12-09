import os, time, json, threading, requests
from urllib.parse import quote
from datetime import datetime
from flask import Flask, jsonify, request, make_response
from dotenv import load_dotenv

load_dotenv()

AIRTABLE_BASE = os.getenv("AIRTABLE_BASE")
AIRTABLE_TABLE=os.getenv("AIRTABLE_TABLE")
AIRTABLE_TOKEN =os.getenv("AIRTABLE_TOKEN")
AIRTABLE_VIEW = os.getenv("AIRTABLE_VIEW")
#AIRTABLE_FILTER = os.getenv("AIRTABLE_FILTER")
LAT_FIELD = os.getenv("LAT_FIELD")
LNG_FIELD = os.getenv("LNG_FIELD")

PUBLIC_FIELDS = [s.strip() for s in os.getenv("PUBLIC_FIELDS", "").split(",") if s.strip()]
CACHE_PATH = os.getenv("CACHE_PATH", "./airtablesync/places_cache.geojson")
REFRESH_TOKEN = os.getenv("REFRESH_TOKEN", "")
MIN_REFRESH_SEC = int(os.getenv("REFRESH_MIN_INVERVAL_SECONDS", "300"))

# ===Flask Application===
app = Flask(__name__)
LOCK = threading.Lock()

CACHE = {
    "geojson": None,
    "updated_at": None,
    "last_refresh_at":0.0
}

def ensure_dir(path:str):
    d=os.path.dirname(path) or "."
    os.makedirs(d, exist_ok=True)

def load_cache_from_disk():
    if os.path.exists(CACHE_PATH):
        with open(CACHE_PATH, "r", encoding="utf-8") as f:
            CACHE["geojson"] = json.load(f)
            CACHE["updated_at"] = os.path.getmtime(CACHE_PATH)

def save_cache_to_disk(geojson):
    ensure_dir(CACHE_PATH)
    with open (CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump(geojson, f, ensure_ascii=False)
    CACHE["updated_at"] = os.path.getmtime(CACHE_PATH)

def fetch_all_records_from_airtable():
    url_base = f"http://api.airtable.com/v0/{AIRTABLE_BASE}/{quote(AIRTABLE_TABLE)}"
    headers = {"Authorization": f"Bearer {AIRTABLE_TOKEN}"}
    params = {"pageSize": 100}

    if AIRTABLE_VIEW:
        params["view"] = AIRTABLE_VIEW
    #if AIRTABLE_FILTER:
        #params["filterByFormula"]= AIRTABLE_FILTER
        
    records, offset = [], None

    while True:
        if offset:
            params["offset"] = offset 
        r = requests.get(url_base, headers=headers, params=params, timeout=30)

        if r.status_code ==429:
            time.sleep(1.2)
            continue
        r.raise_for_status()

        data=r.json()
        records.extend(data.get("records",[]))
        offset = data.get("offset")
        if not offset:
            break
    return records

def whitelist_fields(fields:dict) -> dict:
    if not PUBLIC_FIELDS:
        return fields
    return {k: v for k, v in fields.items() if k in PUBLIC_FIELDS}

def to_geojson(records):
    features = []
    for r in records:
        f = r.get("fields", {})
        lat, lng= f.get(LAT_FIELD), f.get(LNG_FIELD)
        if lat is None or lng is None:
            continue
        props = whitelist_fields(f)

        props.update({
            "_air_id":r.get("id"),
            "_air_url": f"https://api.airtable.com/{AIRTABLE_BASE}/{quote(AIRTABLE_TABLE)}/{r.get('id')}"
        })
        name = f.get(NAME_FIELD)
        if NAME_FIELD not in props:
            props["name"] = name

        features.append({
            "type": "Feature",
            "properties": props,
            "geometry": {"type": "Point", "coordinates": [lng, lat]}
        })
    return {"type": "FeatureCollection", "features": features}

def http_time(ts: float) -> str:
    return time.strftime("%a, %d %b %Y %H:%M:%S GMT", time.gmtime(ts))

@app.route("/api/places.geojson", methods=["GET"])
def get_places():
    """只返回缓存；若无缓存则自动拉一次并落盘。"""
    with LOCK:
        if CACHE["geojson"] is None:
            try:
                records = fetch_all_records_from_airtable()
                gj = to_geojson(records)
                CACHE["geojson"] = gj
                save_cache_to_disk(gj)
                CACHE["last_refresh_at"] = time.time()
            except Exception as e:
                return make_response({"error": f"bootstrap failed: {e}"}, 503)

        resp = make_response(jsonify(CACHE["geojson"]))
        ts = CACHE["updated_at"] or time.time()
        resp.headers["Last-Modified"] = http_time(ts)
        resp.headers["Cache-Control"] = "no-cache"
        return resp

@app.route("/api/refresh", methods=["POST"])
def refresh():
    """手动刷新：需要携带 X-Refresh-Token；节流。"""
    if REFRESH_TOKEN:
        token = request.headers.get("X-Refresh-Token", "")
        if token != REFRESH_TOKEN:
            return make_response({"ok": False, "error": "unauthorized"}, 401)

    with LOCK:
        now = time.time()
        if now - CACHE["last_refresh_at"] < MIN_REFRESH_SEC:
            wait = int(MIN_REFRESH_SEC - (now - CACHE["last_refresh_at"]))
            return jsonify({"ok": True, "throttled": True, "retry_after_seconds": wait})

        try:
            records = fetch_all_records_from_airtable()
            gj = to_geojson(records)
            CACHE["geojson"] = gj
            save_cache_to_disk(gj)
            CACHE["last_refresh_at"] = now
            return jsonify({"ok": True, "records": len(gj["features"])})
        except Exception as e:
            return make_response({"ok": False, "error": str(e)}, 500)

@app.route("/api/health", methods=["GET"])
def health():
    with LOCK:
        return jsonify({
            "ok": True,
            "cached": CACHE["geojson"] is not None,
            "updated_at": CACHE["updated_at"],
            "last_refresh_at": CACHE["last_refresh_at"]
        })

if __name__ == "__main__":
    load_cache_from_disk()
    app.run(host="0.0.0.0", port=5001, debug=True)
