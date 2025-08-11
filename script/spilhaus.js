// proj4.defs(
//   "ESRI:54099",
//   "+proj=spilhaus +lat_0=-49.56371678 +lon_0=66.94970198 +azi=40.17823482 +k_0=1.4142135623731 +rot=45 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs +type=crs"
// );

const Xmin = -27112517.64081454,
  Ymin = -19403882.25607068;
const Xmax = 18962523.46318168,
  Ymax = 17456150.62712629;
const resolutions = [
  287969.00689997635, 143984.50344998817, 71992.25172499409, 35996.12586249704,
];

const CRS_Spilhaus = L.extend({}, L.CRS.Simple, {
  transformation: new L.Transformation(1, -Xmin, -1, Ymax),
  scale: (z) => 1 / resolutions[z],
  zoom: (s) => {
    const scales = resolutions.map((r) => 1 / r);
    let best = 0,
      err = Infinity;
    for (let i = 0; i < scales.length; i++) {
      const d = Math.abs(scales[i] - s);
      if (d < err) {
        err = d;
        best = i;
      }
    }
    return best;
  },
  infinite: false,
});

const map = L.map("map", {
  crs: CRS_Spilhaus,
  minZoom: 0,
  maxZoom: resolutions.length - 1,
  maxBounds: L.latLngBounds([Ymin, Xmin], [Ymax, Xmax]),
  maxBoundsViscosity: 1.0,
}).setView([0, 0], 1);

fetch("assets/Burkina_Faso.geojson")
  .then((r) => r.json())
  .then((data) => {
    if (data.crs) delete data.crs;
    const layer = L.geoJSON(data, {
      style: { color: "#222", weight: 0.8, fillOpacity: 0.1 },
    }).addTo(map);
    map.fitBounds(layer.getBounds());
  });

fetch("assets/uk.geojson")
  .then((r) => r.json())
  .then((data) => {
    if (data.crs) delete data.crs;
    const layer = L.geoJSON(data, {
      style: { color: "#222", weight: 0.8, fillOpacity: 0.1 },
    }).addTo(map);
    map.fitBounds(layer.getBounds());
  });

fetch("assets/South_Africa.geojson")
  .then((r) => r.json())
  .then((data) => {
    if (data.crs) delete data.crs;
    const layer = L.geoJSON(data, {
      style: { color: "#222", weight: 0.8, fillOpacity: 0.1 },
    }).addTo(map);
    map.fitBounds(layer.getBounds());
  });
