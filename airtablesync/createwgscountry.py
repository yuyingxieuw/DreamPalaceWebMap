import os, json
from urllib.parse import quote
from dotenv import load_dotenv
from pyairtable import Api

load_dotenv()
AIRTABLE_BASE = os.getenv("AIRTABLE_BASE")
AIRTABLE_TABLE=os.getenv("AIRTABLE_TABLE")
AIRTABLE_TOKEN =os.getenv("AIRTABLE_TOKEN")
AIRTABLE_VIEW = os.getenv("AIRTABLE_VIEW")
CACHE_PATH = os.getenv("CACHE_PATH", "./airtablesync/unique_country.geojson")
LAT_FIELD = os.getenv("LAT_FIELD")
LNG_FIELD = os.getenv("LNG_FIELD")

def fetch_record():
    "RETURN DICT"
    api = Api(AIRTABLE_TOKEN)
    table = api.table(AIRTABLE_BASE,AIRTABLE_TABLE)
    fields = ["Country"]
    records = table.all(fields=fields)
    return records 

def country_unique (data):
    countries = []
    for item in data:
        country = item.get("fields").get("Country")
        countries.append(country)
    country_unique = set(countries)
    country_unique.discard(None)
    return country_unique

def find_country_geojson(country):
    pass
if __name__=="__main__":
    data = fetch_record()
    country_unique = country_unique(data)
    