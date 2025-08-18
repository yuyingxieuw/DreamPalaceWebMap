import json

with open ("/Users/xy/Documents/workspace/DreamPalaceWebMap/assets/us.geojson", "r", encoding="utf-8") as f:
    us = json.load(f)

# 处理polygon异常值
#寻找每个polygon中coord 不在一个象限

def find_quadrant (polygon):
    quadrant_list = []
    for coord in polygon:
         x,y = coord
         if x>0 and y>0 : quadrant_list.append(1)
         if x<0 and y>0: quadrant_list.append(2)
         if x<0 and y<0: quadrant_list.append(3)
         if x>0 and y<0: quadrant_list.append(4)
    unique_quadrant = list(set(quadrant_list))
    return unique_quadrant

def write_to_file(found):
     with open ("assets/unusual_us.geojson", "w", encoding="utf-8") as f:
          json.dump(found, f)

def find_unusual(data):
    unusual_polygon = {}
    feature =data.get("geometry").get("coordinates")
    for index,polygon in enumerate(feature):
            #print(f"the {index} data is below")
            # print(polygon[0])
            ring = polygon[0]
            quadrants = find_quadrant(ring)
            if len(quadrants) != 1:
                print(quadrants)
                unusual_polygon[index] = ring
    #print(unusual_polygon.keys())
    write_to_file(unusual_polygon)
    return unusual_polygon


two = find_unusual(us)

first_polygon = two.get(321)
part_one = []
part_two = []

for coord in first_polygon:
     x,y = coord
     if x<0 and y>0: part_one.append(coord)
     elif x>0 and y<0: part_two.append(coord)

print("part_one 点数：", len(part_one))
print("part_two 点数：", len(part_two))

if part_one:
    part_one_closed = part_one + [part_one[0]]
else:
    part_one_closed = []

if part_two:
    part_two_closed = part_two + [part_two[0]]
else:
    part_two_closed = []

print("part_one_closed:", part_one_closed)
print("part_two_closed:", part_two_closed)

us_polygon_1 = {

  "type": "Feature",
  "properties": {
    "fid": 18.0,
    "NAME": "United States of America",
    "countryID": 11
  },
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [ part_one_closed]
    ]
  }
}

with open ("assets/us_polygon_1.geojson", "w", encoding="utf-8") as f:
          json.dump(us_polygon_1, f)