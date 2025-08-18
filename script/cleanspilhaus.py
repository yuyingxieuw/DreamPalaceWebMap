# pip install shapely
import json
with open ("assets/spilhaus.geojson", "r", encoding = "utf-8") as f:
    data = json.load(f)

for feature in data.get("features"):
    country = feature.get("properties").get("NAME")
    if country == "United States of America":
        with open("assets/us.geojson", "w", encoding = "utf-8") as d:
            json.dump(feature, d,ensure_ascii=False)
            
