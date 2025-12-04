import requests
import os
import json 

# read image url in airtable json 
with open ("airtablesync/places_cache_withmore.geojson", "r", encoding="utf-8") as f:
    data = json.load(f)

records = data.get("features", [])

os.makedirs("image_row", exist_ok=True)

for record in records:
    prop = record.get("properties")
    if prop.get("Images"):
        images = prop.get("Images")
        print(len(images))
        for image in images:
            url = image.get("url")
            att_id = image.get("id")

            if not url or not att_id:
                continue

            filename = f"{att_id}.jpg"
            path = os.path.join("image_row", filename)

            print("Downloading", filename)

            try:
                r = requests.get(url)
                r.raise_for_status()
                with open (path, "wb") as f:
                    f.write(r.content)
            except Exception as e:
                print("failed download", filename, e)
    else: 
        continue

print("downloaded all stuff")