import os, json
from urllib.parse import quote
from dotenv import load_dotenv
from pyairtable import Api
"""
script to fetch the data from airtable and generate geojson data for seleced countries
"""

load_dotenv()
AIRTABLE_BASE = os.getenv("AIRTABLE_BASE")
AIRTABLE_TABLE=os.getenv("AIRTABLE_TABLE")
AIRTABLE_TOKEN =os.getenv("AIRTABLE_TOKEN")
AIRTABLE_VIEW = os.getenv("AIRTABLE_VIEW")
CACHE_PATH = os.getenv("CACHE_PATH", "./airtablesync/unique_country.geojson")
LAT_FIELD = os.getenv("LAT_FIELD")
LNG_FIELD = os.getenv("LNG_FIELD")

def fetch_record():
    """
    sync with airtable
    fectch only field: country
    RETURN DICT: records
    """
    api = Api(AIRTABLE_TOKEN)
    table = api.table(AIRTABLE_BASE,AIRTABLE_TABLE)
    fields = ["Country"]
    records = table.all(fields=fields)
    return records 

def country_unique (data):
    """
    take records from fetch_record() func
    find unique country in airtable
    return LIST: country_unique
    """
    countries = []
    for item in data:
        country = item.get("fields").get("Country")
        countries.append(country)
    country_unique = set(countries)
    country_unique.discard(None)
    country_unique = [
        "United States of America" if x =="United States" else x
        for x in country_unique
    ]
    print(country_unique)
    return country_unique

def find_country_geojson(country_unique:list):
    """
    take country_unique list from country_unique()func
    save country properties of selected country
    return DICT: new_features
    """
    with open ("assets/countryWGS_all.geojson", "r", encoding= "utf-8") as f:
        country_all = json.load(f)
    features = country_all.get("features")
    filtered = []
    for item in features: 
        name = item.get("properties").get("NAME")
        if name in country_unique:
            filtered.append(item)
    return filtered

def make_new_geojson(data:dict):
    """
    Docstring for make_new_geojson
    
    :param data: new_feature from find_country_geojson()func
    :type data: dict
    """
    new_geoson = {
        "type": "FeatureCollection",
        "name": "worldPolygon",
        "crs": {
            "type": "name",
            "properties": { "name": "urn:ogc:def:crs:EPSG::3857" }
        },
        "features": data
        }
    with open ("assets/selectedcountryWGS.geojson", "w", encoding="utf-8") as f:
        json.dump(new_geoson,f, ensure_ascii=False, indent=2, default=str)


if __name__=="__main__":
    data = fetch_record()
    country = country_unique(data)
    new_features = find_country_geojson(country)
    make_new_geojson(new_features)
    