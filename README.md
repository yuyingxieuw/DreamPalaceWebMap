# DreamPalacesWebMap

## System Documentation

This webmap visualizes the Dream Palaces dataset and provides an interactive way to explore spatial, historical, and cultural information.
The project follows a modular architecture to ensure long-term maintainability, scalability, and flexibility for future feature additions.

### Website stucture

This repository contains all frontend code related to map rendering, user interaction, and UI components.

The frontend is implemented using vanilla JavaScript + Leaflet, structured with a custom OOP architecture:

- WebMapApp — application bootstrap
- MapManager — map initialization & projection
- UIManager — sidebar, info panels, UI interactions
- DataManager (planned) — data loading & preprocessing
- StateEngine (planned) — global state management for zoom, viewport, active content

### Data pipeline structure

The data pipeline is maintained in a separate repository (link) and interacts with this webmap through a REST API.

#### Pipeline Overview

Airtable → Python Data Pipeline → Flask API → Render Deployment → Frontend Consumption

##### Explanation

_Airtable_
The Dream Palaces dataset is maintained in Airtable.
_ython Data Pipeline_
Data is fetched, cleaned, normalized, and exported to GeoJSON.
(Code stored in the separate repo.)
_Flask Application_
Hosts a lightweight API that serves:

- palaces data (GeoJSON)
- caching (refresh interval: once per week)
  _Render.com Deployment_
  The API is deployed as a free-tier web service.
  To prevent sleeping, UptimeRobot pings an endpoint every 5 minutes.
  _Frontend (this repo)_
  Fetches GeoJSON layers from the Flask API and renders them on the map.

### Map rendering structure

All map rendering is written in vanilla JavaScript, with a class-based architecture for clarity and modularity.

Below is an overview of key classes:

#### (Class) WebMapAPP

Bootstraps the application and initializes core modules.
_Key responsibilities:_

- instantiate MapManager and UIManager
- load configuration
- orchestrate event bindings

#### (Class) MapManager

Handles map creation, projection, tiles,（for spilhause map）data layers

- buildCRS(): Creates the custom Spilhaus projection for Leaflet.
- createSpilhaus(): Initializes the Spilhaus map instance with appropriate bounds & zoom settings.
- addSpilhausTiles(): Loads pre-generated Spilhaus PNG tiles from static assets.
- ensureWgsCreated(): Initializes a secondary map in WGS84 (for debugging or fallback).
- loadSpilhausCountries(): Loads static country polygons (GeoJSON).
- loadSpilhausPalace(): Fetches palace point data from the Flask API and adds them to the map.
- activate(): Kicks off necessary initialization steps.
  This module will later integrate with StateEngine for dynamic styling, viewport detection, and zoom-dependent behavior.

#### (Planned) StateEngine

A lightweight global state machine that manages:

- Current zoom level
- Current viewport
- Selected country or palace
- Active UI panel content
- Map → UI → Data synchronization

This greatly reduces code complexity and future maintenance cost.

#### (Planned) DataManager

A dedicated data layer that:

- Loads all datasets
- Preprocesses geometries (e.g., centroids)
- Provides optimized lookup functions (e.g., “which country is visible in viewport?”)
- Ensures UI and map only see clean, normalized data

#### Deployment Notes

- API hosted on Render.com
- Free tier requires UptimeRobot to keep the service alive
- Frontend served via static hosting (Vercel or GitHub Pages recommended)
- All configuration can be extended through .env files or central modules
