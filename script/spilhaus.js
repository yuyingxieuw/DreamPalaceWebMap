proj4.defs(
  "ESRI:54099",
  "+proj=spilhaus +lat_0=-49.56371678 +lon_0=66.94970198 +azi=40.17823482 +k_0=1.4142135623731 +rot=45 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs +type=crs"
);

const Xmin = -27112517.64081454,
  Ymin = -19403882.25607068;
const Xmax = 18962523.46318168,
  Ymax = 17456150.62712629;
const resolutions = [
  287969.00689997635, 143984.50344998817, 71992.25172499409, 35996.12586249704,
];

const CRS_Spilhaus = new L.Proj.CRS("ESRI:54099", null, {
  origin: [Xmin, Ymax],
  resolutions,
  bounds: L.bounds([Xmin, Ymin], [Xmax, Ymax]),
  //transformation: new L.Transformation(1, -Xmin, -1, Ymax), // 以投影米坐标对齐像素
});

const map = L.map("map", {
  crs: CRS_Spilhaus,
  minZoom: 0,
  maxZoom: 3,
  noWrap: true,
}).addTo(map);

fetch("assets/worldPolygon.geojson")
  .then((r) => r.json())
  .then((g) =>
    L.geoJSON(g, {
      style: (f) => ({
        color: "#e7e3e2",
        weight: 1,
        fillColor: "rgba(214,2,2,0.3)",
        fillOpacity: 1,
      }),
    }).addTo(map)
  );
