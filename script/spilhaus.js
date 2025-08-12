proj4.defs(
  "ESRI:54099",
  "+proj=spilhaus +lat_0=-49.56371678 +lon_0=66.94970198 +azi=40.17823482 +k_0=1.4142135623731 +rot=45 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs +type=crs"
);

// const Xmin = -17088218.0553,
//   Ymin = -16972857.6802;
// const Xmax = 16925948.823,
//   Ymax = 17041309.1981;
// const resolutions = [
//   287969.00689997635, 143984.50344998817, 71992.25172499409, 35996.12586249704,
// ];

// const CRS_Spilhaus = L.extend({}, L.CRS.Simple, {
//   transformation: new L.Transformation(1, -Xmin, -1, Ymax),
//   scale: (z) => 1 / resolutions[z],
//   zoom: (s) => {
//     const scales = resolutions.map((r) => 1 / r);
//     let best = 0,
//       err = Infinity;
//     for (let i = 0; i < scales.length; i++) {
//       const d = Math.abs(scales[i] - s);
//       if (d < err) {
//         err = d;
//         best = i;
//       }
//     }
//     return best;
//   },
//   infinite: false,
// });

// const map = L.map("map", {
//   crs: CRS_Spilhaus,
//   minZoom: 0,
//   maxZoom: resolutions.length - 1,
//   maxBounds: L.latLngBounds([Ymin, Xmin], [Ymax, Xmax]),
//   maxBoundsViscosity: 1.0,
// }).setView([0, 0], 1);

// fetch("assets/Burkina_Faso.geojson")
//   .then((r) => r.json())
//   .then((data) => {
//     if (data.crs) delete data.crs;
//     const layer = L.geoJSON(data, {
//       style: { color: "#222", weight: 0.8, fillOpacity: 0.1 },
//     }).addTo(map);
//     map.fitBounds(layer.getBounds());
//   });

// fetch("assets/uk.geojson")
//   .then((r) => r.json())
//   .then((data) => {
//     if (data.crs) delete data.crs;
//     const layer = L.geoJSON(data, {
//       style: { color: "#222", weight: 0.8, fillOpacity: 0.1 },
//     }).addTo(map);
//     map.fitBounds(layer.getBounds());
//   });

// fetch("assets/South_Africa.geojson")
//   .then((r) => r.json())
//   .then((data) => {
//     if (data.crs) delete data.crs;
//     const layer = L.geoJSON(data, {
//       style: { color: "#222", weight: 0.8, fillOpacity: 0.1 },
//     }).addTo(map);
//     map.fitBounds(layer.getBounds());
//   });

// L.tileLayer("tiles/{z}/{x}/{y}.png", {
//   tms: true,
//   tileSize: 256,
//   minZoom: 0,
//   maxZoom: 3,
//   noWrap: true,
// }).addTo(map);

////original one
var spilhausCRS = new L.Proj.CRS(
  "ESRI:54099",
  "+proj=moll +lon_0=0 +x_0=0 +y_0=0 +units=m +datum=WGS84 +no_defs",
  {
    origin: [-16857702.71589949, 16935229.805407636], // ⬅️ top-left of the raster in meters
    resolutions: [
      213422.22355032988708, // z=0
      106711.11177516494354, // z=1
      53355.55588758247177, // z=2
      26677.77794379123588, // z=3
    ],
    bounds: L.bounds(
      [-16857702.71589949, -17212325.962645144], // minX, minY
      [17289853.05215329, 16935229.805407636] // maxX, maxY
    ),
  }
);

var map_spilhaus = L.map("map", {
  crs: spilhausCRS,
  center: [0, 0],
  minZoom: 2,
  maxZoom: 2,
  //dragging: false,
  //scrollWhenlZoom: false,
  doubleClickZoom: false,
  boxZoom: false,
  keyboard: false,
  zoomControl: false,
}).setView([-60, 0], 2);

L.tileLayer("tiles8.12/{z}/{x}/{y}.png", {
  tms: true,
  tileSize: 256,
  minZoom: 2,
  maxZoom: 2,
  noWrap: true,
}).addTo(map_spilhaus);

// fetch("assets/South_Africa.geojson")
//   .then((r) => r.json())
//   .then((data) => {
//     if (data.crs) delete data.crs;
//     const layer = L.geoJSON(data, {
//       style: { color: "#222", weight: 0.8, fillOpacity: 0.1 },
//     }).addTo(map_spilhaus);
//     map.fitBounds(layer.getBounds());
//   });
