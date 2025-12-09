from pyproj import CRS, Transformer
import json 

# this is the script transfrom all palace point data to spilhaus
def transform(in_path, out_path):
    crs_54099 = CRS.from_proj4("+proj=spilhaus +lat_0=-49.56371678 +lon_0=66.94970198 +azi=40.17823482 +k_0=1.4142135623731 +rot=45 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs +type=crs")
    crs_4326 = CRS.from_epsg(4326)
    tform = Transformer.from_crs(crs_4326, crs_54099, always_xy = True)

    def tx_point(coord):
        x,y = tform.transform(coord[0],coord[1])
        return [x,y]
    
    with open(in_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    new_features= []
    
    for feature in data.get("features"):
        coords = feature.get("geometry").get("coordinates") 
        x,y = coords[0],coords[1]
        if x is None or y is None:
            continue
        else:
            feature["geometry"]["coordinates"] = tx_point(coords) 
             #simplify geojson to make the data smaller
            feature.pop("properties", None)
            new_features.append(feature)
    
    new_geojson = {
         "type": "FeatureCollection",
        "name": "PointsLayer",
        "features": new_features
    }

    with open (out_path, "w", encoding = "utf-8") as f:
        json.dump(new_geojson,f,ensure_ascii=False)

transform("airtablesync/places_cache_withmore.geojson","assets/pointsspil.geojson")