# pip install shapely
import json
with open ("assets/spilhaus.geojson", "r", encoding = "utf-8") as f:
    data = json.load(f)

for feature in data.get("features"):
    country = feature.get("properties").get("NAME")
    if country == "Mali":
        with open("assets/Mali.geojson", "w", encoding = "utf-8") as d:
            json.dump(feature, d,ensure_ascii=False)
            
