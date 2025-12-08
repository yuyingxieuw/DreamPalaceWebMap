import os, json, copy
from urllib.parse import quote
from datetime import datetime
from dotenv import load_dotenv
from pyairtable import Api

load_dotenv()
AIRTABLE_BASE = os.getenv("AIRTABLE_BASE")
AIRTABLE_TABLE=os.getenv("AIRTABLE_TABLE")
AIRTABLE_TOKEN =os.getenv("AIRTABLE_TOKEN")
AIRTABLE_VIEW = os.getenv("AIRTABLE_VIEW")
CACHE_PATH = os.getenv("CACHE_PATH", "./airtablesync/places_cache_withmore_test.geojson")
LAT_FIELD = os.getenv("LAT_FIELD")
LNG_FIELD = os.getenv("LNG_FIELD")

def fetch_all_records():
    api = Api(AIRTABLE_TOKEN)
    table = api.table(AIRTABLE_BASE,AIRTABLE_TABLE)
    fields = ["Name", "City", "Country", "Address", "State / Province", "ZIP Code", "Latitude", "Longitude", "Condition", "Typology", "Creation", "Closure", "Replaced By", "Website description", "Additional resources", "Images"]
    records = table.all(fields=fields) # didn't set the airtable view - assume we only use grid view
    return records

def to_geojson(data):
    features = []
    for rec in data or []:
        field = rec.get("fields") 
        try:
            lat = field.get(LAT_FIELD)
            lng = field.get(LNG_FIELD)
        except(TypeError, ValueError):
            continue

        props = copy.deepcopy(field)
        props.pop(LAT_FIELD,None)
        props.pop(LNG_FIELD,None)
        props["airtable_id"] = rec.get("id")
        props["createdTime"] = rec.get("createdTime")
    
        each_rec = {
            "type":"Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [lng,lat]
            },
            "properties":
                props
        }
        features.append(each_rec)

    return {
        "type": "FeatureCollection",
        "name": "AirtableData",
        "features": features
    }

def write_geojson(geo,path=CACHE_PATH):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path,"w",encoding="utf-8") as f:
        json.dump(geo,f,ensure_ascii=False, indent=2, default=str)

if __name__=="__main__":
    data = fetch_all_records()
    geo=to_geojson(data)
    write_geojson(geo)
    print(f"Wrote {len(geo['features'])} features → {CACHE_PATH}")

 
