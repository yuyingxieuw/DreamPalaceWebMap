# DreamPalacesWebMap

## System Documentation

An interactive web map visualizing the Dream Palaces dataset using a custom Spilhaus projection.
The project is built with vanilla JavaScript + Leaflet and connects to a lightweight Flask API that serves weekly-refreshed GeoJSON data.

## Features

- Custom CRS (Spilhaus) + tiled base map
- Palace + country layers loaded from a Flask API
- Modular JS structure (WebMapApp / MapManager / UIManager)

### Data pipeline

Airtable → Python ETL → Flask API (Render) → Frontend (Leaflet)
_The data pipeline is maintained in a separate repository (link) and interacts with this webmap through a REST API._

### Code structure

/src
/core → WebMapApp (bootstrap)
/map → MapManager (CRS, tiles, layers)
/ui → UIManager (sidebar, interactions)
/assets → tiles + static data

### API

Base endpoint: <link> (Flask on Render)
