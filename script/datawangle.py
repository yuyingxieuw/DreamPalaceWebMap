
import geopandas as gpd
import shapely
from shapely import Polygon, box
from shapely.geometry import Polygon
import json 

# country_gdf = gpd.read_file("assets/selectedcountryWGS_old.geojson")
# country_gdf[["minx", "miny", "maxx", "maxy"]] = (country_gdf["geometry"]).bounds
# country_gdf["southwest"]= country_gdf[["miny", "minx"]].values.tolist()
# country_gdf["northeast"] = country_gdf[["maxy", "maxx"]].values.tolist()
# columns_to_drop = ['minx', 'miny', 'maxy', 'maxx']
# gdf = country_gdf.drop(columns=columns_to_drop)
# print(gdf)
# gdf.to_file("assets/selectedcountryWGS_withbounds.geojson", driver = "GeoJSON")

# country_gdf["bounds"] = shapely.box(country_gdf["minx"], country_gdf["miny"], country_gdf["maxx"], country_gdf["maxy"])

# country_gdf["bounds"] = country_gdf.geometry.apply(lambda geom: list(geom.bounds))
# print (country_gdf)
# country_gdf.to_file("assets/selectedcountryWGS_withbounds.geojson", driver = "GeoJSON")

# with open ("assets/selectedcountryWGS_withbounds.geojson", "r", encoding="utf-8") as f:
#     data = json.load(f)

# country_bound = {}

# for feature in data.get("features"):
#     prop = feature.get("properties")
#     name = prop.get("NAME")
#     print(name)
#     sw = prop.get("southwest")
#     ne = prop.get("northeast")
#     country_bound[name] = [sw,ne]

# print(country_bound)

world_box = [ [ -126.238971989475715, 51.922813285251294 ], 
             [ 49.494574920983865, 53.035050923925084 ], 
             [ 52.831287837005249, -61.896171739033718 ], 
             [ -123.643750832570205, -64.491392895939242 ], 
             [ -123.643750832570205, -64.491392895939242 ], 
             [ -126.238971989475715, 51.922813285251294 ] ]
box_poly = Polygon(world_box)
print (box_poly)

bounding_box_coords = box_poly.bounds

xmin, ymin, xmax, ymax = bounding_box_coords


southwest = [ymin, xmin]
northeast = [ymax, xmax]

print([southwest, northeast])
