import urllib.parse
import requests
class Geocoder:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://maps.googleapis.com/maps/api/geocode/json"

    def geocode(self, address):
        encoded_address = urllib.parse.quote(address)
        url = f'{self.base_url}?address={encoded_address}&key={self.api_key}'
        response = requests.get(url)

        if response.status_code != 200:
            raise Exception("HTTP error")
        
        data= response.json()
        if data["status"] !="OK":
            raise Exception("Geocding error")
        
        location = data["results"][0]["geometry"]["location"]
        return location
    
    def get_map_link(self, lat, lng):
        return f"https://www.google.com/maps?q={lat},{lng}"
    
# Main Script
# change premeter here
if __name__ =="__main__":
    api_key = "AIzaSyBAw7Ck5FK0IushfKcQ6v282pKj5xtRgfs"
    address = "68 Orange Street, Gardens, Cape Town, South Africa"
    geocoder = Geocoder(api_key)

    try:
        location = geocoder.geocode(address)
        map_link = geocoder.get_map_link(location["lat"], location["lng"])
        print(f"Google Maps link: {map_link}")
    except Exception as e:
        print(f"Error: {e}")