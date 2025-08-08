"use strict";
proj4.defs(
  "EPSG:54099",
  "+proj=aea +lat_1=-86 +lat_2=-52 +lat_0=-79 +lon_0=180 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs"
);

const spilhausCRS = new L.Proj.CRS("EPSG:54099", proj4.defs("EPSG:54099"), {
  origin: [-16683169.289447047, 16683169.289447047],
  resolutions: [
    65168.63003690253, 32584.315018451263, 16292.157509225632,
    8146.078754612816, 4073.039377306408, 2036.519688653204, 1018.259844326602,
    509.129922163301, 254.5649610816505,
  ],
  bounds: L.bounds(
    [-16683169.289447047, -16683169.289447047],
    [16683169.289447045, 16683169.289447045]
  ),
});

const map = L.map("map", {
  crs: spilhausCRS,
  minZoom: 0,
  maxZoom: 9,
  maxBounds: spilhausCRS.bounds,
}).setView([0, 0], 2);

L.esri.Vector.vectorTileLayer({
  url: " https://tiles.arcgis.com/tiles/jIL9msH9OI208GCb/arcgis/rest/services/Spilhaus_Ocean_VTP/VectorTileServer",
  vectorTileStyles: {
    // layerName must match one of the names inside the style JSON
    Spilhaus_Basemap:
      "https://tiles.arcgis.com/tiles/jIL9msH9OI208GCb/" +
      "arcgis/rest/services/Spilhaus_Ocean_VTP/VectorTileServer/" +
      "resources/styles/root.json",
  },
  tileSize: 512,
  maxNativeZoom: 9,
  attribution: "© Esri Living Atlas",
}).addTo(map);
