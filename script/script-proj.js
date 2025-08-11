"use strict";

// Initialize the map
// const map = L.map("map").setView([51.505, -0.09], 13);

// L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
//   attribution:
//     '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
// }).addTo(map);

// zoom to specific place clicking on explore dream places link
// function zoomToPlace() {
//   map.setView([51.505, -0.09], 13);
// }

// ReProjection

// Corrected tile URL pattern and configuration
// proj4.defs(
//   "EPSG:54099",
//   "+proj=aea +lat_1=-86 +lat_2=-52 +lat_0=-79 +lon_0=180 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs"
// );

// const spilhausCRS = new L.Proj.CRS("EPSG:54099", proj4.defs("EPSG:54099"), {
//   origin: [-16683169.289447047, 16683169.289447047],
//   resolutions: [
//     65168.63003690253, 32584.315018451263, 16292.157509225632,
//     8146.078754612816, 4073.039377306408, 2036.519688653204, 1018.259844326602,
//     509.129922163301, 254.5649610816505,
//   ],
//   bounds: L.bounds(
//     [-16683169.289447047, -16683169.289447047],
//     [16683169.289447045, 16683169.289447045]
//   ),
// });

var spilhausCRS = new L.Proj.CRS(
  "ESRI:54099",
  "+proj=moll +lon_0=0 +x_0=0 +y_0=0 +units=m +datum=WGS84 +no_defs",
  {
    origin: [-27112517.64081454, 17456150.62712629], // ⬅️ top-left of the raster in meters
    resolutions: [
      287969.00689997635, // zoom level 0
      143984.50344998817, // zoom level 1
      71992.25172499409, // zoom level 2
      35996.12586249704, // zoom level 3
    ],
    bounds: L.bounds(
      [-27112517.64081454, -19403882.25607068], // bottom-left in meters
      [18962523.46318168, 17456150.62712629] // top-right in meters
    ),
  }
);

var map_spilhaus = L.map("map", {
  crs: spilhausCRS,
  center: [0, 0],
  minZoom: 0,
  maxZoom: 3,
  //dragging: false,
  //scrollWhenlZoom: false,
  doubleClickZoom: false,
  boxZoom: false,
  keyboard: false,
  zoomControl: false,
}).setView([0, -101], 3);

// L.tileLayer("tiles/{z}/{x}/{y}.png", {
//   tms: true,
//   tileSize: 256,
//   minZoom: 0,
//   maxZoom: 3,
//   noWrap: true,
// }).addTo(map_spilhaus);

var sidebar = L.control.sidebar("sidebar", { position: "left" });
map_spilhaus.addControl(sidebar);

var country_array = [
  "Brazil",
  "Burkina Faso",
  "Cameroon",
  "Ghana",
  "Mali",
  "Mozambique",
  "Nigeria",
  "Senegal",
  "South Africa",
  "United Kingdom",
  "United States of America",
];

// geojson layer
// proj4.defs(
//   "ESRI:54099",
//   "+proj=spilhaus +lat_0=-49.56371678 +lon_0=66.94970198 +azi=40.17823482 +k_0=1.4142135623731 +rot=45 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs +type=crs"
// );

proj4.defs(
  "ESRI:54099",
  "+proj=moll +lon_0=0 +x_0=0 +y_0=0 +units=m +datum=WGS84 +no_defs"
);

fetch("assets/worldPolygon4326.geojson")
  .then((response) => {
    if (!response.ok) throw new Error("geojson loading failed");
    return response.json();
  })
  .then((geojsonData) => {
    console.log("GeoJSON loaded:", geojsonData);
    const worldLayer = L.Proj.geoJson(geojsonData, {
      style: (feature) => {
        const name = feature.properties.NAME;
        if (country_array.includes(name)) {
          return {
            color: "#e7e3e2ff",
            weight: 1,
            fillColor: "rgba(214, 2, 2, 0.4)",
            fillOpacity: 1,
          };
        }
        return {
          color: "white",
          weight: 0,
          fillColor: "white",
          fillOpacity: 0,
        };
      },
      onEachFeature: (feature, layer) => {
        const name = feature.properties.NAME;
        // layer.bindPopup(name);
      },
    });
    worldLayer.addTo(map_spilhaus);
  });
console.log(Object.keys(proj4.Proj.projections));

// var world = new L.GeoJSON.AJAX("assets/worldPolygon.geojson", {
//   style: (feature) => {
//     const name = feature.properties.NAME;
//     if (country_array.includes(name)) {
//       return {
//         color: "#8F1C06",
//         weight: 1,
//         fillColor: "rgba(255,255,255,0)",
//         fillOpacity: 0,
//       };
//     }
//     return {
//       color: "white",
//       weight: 0.4,
//       fillColor: "gray",
//       fillOpacity: 0.6,
//     };
//   },
//   onEachFeature: (feature, layer) => {
//     console.log("Loaded:", feature.properties.NAME);
//   },
// }).addTo(map_spilhaus);

// const styleUrl =
//   "https://tiles.arcgis.com/tiles/jIL9msH9OI208GCb/" +
//   "arcgis/rest/services/Spilhaus_Ocean_VTP/VectorTileServer/" +
//   "resources/styles/root.json";

// // Corrected tile URL and configuration
// L.vectorGrid
//   .protobuf(
//     "https://tiles.arcgis.com/tiles/jIL9msH9OI208GCb/" +
//       "arcgis/rest/services/Spilhaus_Ocean_VTP/VectorTileServer/tile/{z}/{y}/{x}.pbf",
//     {
//       tileSize: 512,
//       maxNativeZoom: 9,
//       attribution: "© Esri Living Atlas",
//       vectorTileLayerStyles: {
//         // Target circle layers and hide them
//         "1st_order/Country/abbr": {
//           radius: 0, // Hide circle
//           opacity: 0, // Make fully transparent
//         },
//         "DisputedTerritory/label": {
//           radius: 0,
//           opacity: 0,
//         },
//         "1st_order/Country/label": {
//           radius: 0,
//           opacity: 0,
//         },
//         // prettier-ignore
//         "Marine_Label": {
//           radius: 0,
//           opacity: 0,
//         },
//         // Add other layers you want to keep visible below
//         // prettier-ignore
//         "Rivers_LScale": {
//           weight: 1,
//           opacity: 1,
//           color: "#7D7D7D", // Original river color
//         },
//         // prettier-ignore
//         "Graticule": {
//           weight: 0.933333,
//           color: "#CCCCCC", // Original graticule color
//         },
//         // Add other necessary layers (roads, boundaries, etc.) here
//       },
//     }
//   )
//   .addTo(map);
