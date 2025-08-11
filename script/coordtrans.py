
from pyproj import CRS, Transformer
import json 

# print(pyproj.__version__)
# print(pyproj.proj_version_str)

# crs_54099 = CRS.from_proj4("+proj=spilhaus +lat_0=-49.56371678 +lon_0=66.94970198 +azi=40.17823482 +k_0=1.4142135623731 +rot=45 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs +type=crs")
# crs_3857 = CRS.from_epsg("3857")
# crs_4326 = CRS.from_epsg("4326")

# print(crs_3857.to_wkt)
# print(crs_4326.to_wkt)

# tform = Transformer.from_crs(crs_4326, crs_54099, always_xy = True)

# def coord_trans (x,y):
#     x_new, y_new = tform.transform(x,y)
#     return [x_new, y_new]


# def transform_geojson (in_path, out_path):
#     with open(in_path, "r", encoding= "utf=8") as f:
#         data = json.load(f)
#     for feature in data.get("features"):
#         coord = feature


def transform(in_path, out_path):
    crs_54099 = CRS.from_proj4("+proj=spilhaus +lat_0=-49.56371678 +lon_0=66.94970198 +azi=40.17823482 +k_0=1.4142135623731 +rot=45 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs +type=crs")
    crs_4326 = CRS.from_epsg(4326)
    tform = Transformer.from_crs(crs_4326, crs_54099, always_xy = True)

    def tx_point(coord):
        x,y = tform.transform(coord[0],coord[1])
        return [x,y]
    
    with open(in_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    for feature in data.get("features"):
        coords = feature.get("geometry").get("coordinates") 
        feature["geometry"]["coordinates"] = [[[tx_point(pt) for pt in ring] for ring in poly]for poly in coords]
        
    with open (out_path, "w", encoding = "utf-8") as f:
        json.dump(data,f,ensure_ascii=False)

transform("assets/worldPolygon.geojson","assets/spilhaus.geojson")