import pandas as pd
import urllib.parse
import requests
# Load the CSV
df = pd.read_csv("Cinema spaces.csv")

# Construct full address
def construct_address(row):
    if pd.notna(row['Full Address']) and row['Full Address'].strip() not in ["", "/", "\\", ","]:
        return row['Full Address']
    elif pd.notna(row['Address']) and pd.notna(row['City']) and pd.notna(row['State']) and pd.notna(row['Country']):
        return f"{row['Address']}, {row['City']}, {row['State']}, {row['Country']}"
    elif pd.notna(row['City']) and pd.notna(row['State']) and pd.notna(row['Country']):
        return f"{row['City']}, {row['State']}, {row['Country']}"
    else:
        return None

# Create the 'Geocode Address' column
df['Geocode Address'] = df.apply(construct_address, axis=1)

# Clean up the address (remove leading slashes and spaces)
def clean_address(address):
    if isinstance(address, str):
        return address.lstrip("/\\, ").strip()
    return address

df['Clean Address'] = df['Geocode Address'].apply(clean_address)

# Filter valid addresses
cleaned_addresses = df['Clean Address'].dropna().tolist()

# Print cleaned addresses
for address in cleaned_addresses:
    print(address)

# Google API setup
api_key = "AIzaSyBAw7Ck5FK0IushfKcQ6v282pKj5xtRgfs"
base_url = "https://maps.googleapis.com/maps/api/geocode/json"

# Store results
locations = []

# Geocode each cleaned address
for address in cleaned_addresses:
    encoded_address = urllib.parse.quote(address)
    url = f'{base_url}?address={encoded_address}&key={api_key}'
    try:
        response = requests.get(url)
        if response.status_code != 200:
            print(f"HTTP error for: {address}")
            continue

        data = response.json()
        if data["status"] != "OK":
            print(f"Geocoding failed for: {address}")
            continue

        location = data["results"][0]["geometry"]["location"]
        lat, lng = location["lat"], location["lng"]
        locations.append({
            "address": address,
            "latitude": lat,
            "longitude": lng,
            "map_link": f"https://www.google.com/maps?q={lat},{lng}"
        })
        print(f"Success: {address} → {lat}, {lng}")
    except Exception as e:
        print(f"Error with {address}: {e}")

# Optional: save results to CSV
pd.DataFrame(locations).to_csv("geocoded_locations.csv", index=False)



