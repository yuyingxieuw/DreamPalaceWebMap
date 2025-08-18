// const minx = -16857702.71589949;
// const miny = -17212325.962645144;
// const maxx = 17289853.05215329;
// const maxy = 16935229.805407636;

// const resolutions = [
//   213422.22355032988708, // z=0
//   106711.11177516494354, // z=1
//   53355.55588758247177, // z=2
//   26677.77794379123588, // z=3
// ];

// proj4.defs(
//   "ESRI:54099",
//   "+proj=moll +lon_0=0 +x_0=0 +y_0=0 +units=m +datum=WGS84 +no_defs"
// );

// const spilhausCRS = new L.Proj.CRS("ESRI:54099", proj4.defs("ESRI:54099"), {
//   origin: [minx, maxy],
//   resolutions,
//   bounds: L.bounds([minx, miny], [maxx, maxy]),
// });

// var map_spilhaus = L.map("map", {
//   crs: spilhausCRS,
//   center: [0, 0],
//   minZoom: 0,
//   maxZoom: 3,
//   //dragging: false,
//   //scrollWhenlZoom: false,
//   doubleClickZoom: false,
//   boxZoom: false,
//   keyboard: false,
//   zoomControl: false,
// }).setView([0, 0], 0);

// L.tileLayer("tiles8.12/{z}/{x}/{y}.png", {
//   tms: true,
//   tileSize: 256,
//   minZoom: 0,
//   maxZoom: 3,
//   noWrap: true,
// }).addTo(map_spilhaus);

// fetch("assets/Brazil.geojson", { cache: "no-cache" })
//   .then((r) => {
//     if (!r.ok) throw new Error(`HTTP ${r.status}`);
//     return r.json();
//   })
//   .then((geojson) => {
//     geojson.crs = { type: "name", properties: { name: "ESRI:54099" } };

//     const baseStyle = {
//       color: "#1f2937",
//       weight: 1,
//       fillColor: "#60a5fa",
//       fillOpacity: 0.25,
//     };

//     const polyLayer = new L.Proj.GeoJSON(geojson, {
//       style: baseStyle,
//       onEachFeature: (feature, layer) => {
//         // hover 高亮
//         layer.on({
//           mouseover: (e) => {
//             e.target.setStyle({ weight: 2, fillOpacity: 0.35 });
//             e.target.bringToFront();
//           },
//           mouseout: (e) => {
//             polyLayer.resetStyle(e.target);
//           },
//           click: (e) => {
//             const p = feature.properties || {};
//             const html = `<div style="font:12px/1.4 sans-serif">
//                  <b>Polygon</b><br/>
//                  ${
//                    Object.keys(p).length
//                      ? JSON.stringify(p, null, 2)
//                      : "no properties"
//                  }
//                </div>`;
//             e.target.bindPopup(html).openPopup();
//           },
//         });
//       },
//     }).addTo(map_spilhaus);

//   })
//   .catch((err) => {
//     console.error("Failed to load polygons_54099.geojson:", err);
//   });

proj4.defs(
  "ESRI:54099",
  "+proj=moll +lon_0=0 +x_0=0 +y_0=0 +units=m +datum=WGS84 +no_defs"
);
const minx = -16857702.71589949;
const miny = -17212325.962645144;
const maxx = 17289853.05215329;
const maxy = 16935229.805407636;

const resolutions = [
  213422.22355032988708, // z=0
  106711.11177516494354, // z=1
  53355.55588758247177, // z=2
  26677.77794379123588, // z=3
];

const spilhausCRS = new L.Proj.CRS("ESRI:54099", proj4.defs("ESRI:54099"), {
  origin: [minx, maxy], // 左上角 (minx, maxy)
  resolutions, // 与 XML 完全一致
  bounds: L.bounds([minx, miny], [maxx, maxy]), // 限制平移
});

const map_spilhaus = L.map("map", {
  crs: spilhausCRS,
  center: [0, 0],
  zoom: 2,
  minZoom: 0,
  maxZoom: 3,
  scrollWheelZoom: "center",
  touchZoom: "center",
  doubleClickZoom: "center",
  zoomSnap: 1,
  zoomDelta: 1,
  inertia: false,
});

L.tileLayer("tiles8.12/{z}/{x}/{y}.png", {
  tms: true,
  tileSize: 256,
  minZoom: 0,
  maxZoom: 3,
  minNativeZoom: 3,
  maxNativeZoom: 3,
  noWrap: true,
  updateWhenZooming: true,
  keepBuffer: 2,
}).addTo(map_spilhaus);

fetch("assets/Brazil.geojson", { cache: "no-cache" })
  .then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  })
  .then((geojson) => {
    geojson.crs = { type: "name", properties: { name: "ESRI:54099" } };

    const polyLayer = new L.Proj.GeoJSON(geojson, {
      style: {
        color: "#1f2937",
        weight: 1,
        fillColor: "#60a5fa",
        fillOpacity: 0.25,
      },
      onEachFeature: (feature, layer) => {
        layer.on({
          mouseover: (e) => {
            e.target.setStyle({ weight: 2, fillOpacity: 0.35 });
            e.target.bringToFront();
          },
          mouseout: (e) => {
            polyLayer.resetStyle(e.target);
          },
        });
      },
    }).addTo(map_spilhaus);

    // 可选：视图贴合
    // const b = polyLayer.getBounds();
    // if (b.isValid()) map_spilhaus.fitBounds(b, { maxZoom: 3, padding: [10,10] });
  })
  .catch((err) => console.error("GeoJSON load failed:", err));

fetch("assets/Burkina_Faso.geojson", { cache: "no-cache" })
  .then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  })
  .then((geojson) => {
    geojson.crs = { type: "name", properties: { name: "ESRI:54099" } };

    const polyLayer = new L.Proj.GeoJSON(geojson, {
      style: {
        color: "#1f2937",
        weight: 1,
        fillColor: "#60a5fa",
        fillOpacity: 0.25,
      },
      onEachFeature: (feature, layer) => {
        layer.on({
          mouseover: (e) => {
            e.target.setStyle({ weight: 2, fillOpacity: 0.35 });
            e.target.bringToFront();
          },
          mouseout: (e) => {
            polyLayer.resetStyle(e.target);
          },
        });
      },
    }).addTo(map_spilhaus);

    // 可选：视图贴合
    // const b = polyLayer.getBounds();
    // if (b.isValid()) map_spilhaus.fitBounds(b, { maxZoom: 3, padding: [10,10] });
  })
  .catch((err) => console.error("GeoJSON load failed:", err));

fetch("assets/Cameroon.geojson", { cache: "no-cache" })
  .then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  })
  .then((geojson) => {
    geojson.crs = { type: "name", properties: { name: "ESRI:54099" } };

    const polyLayer = new L.Proj.GeoJSON(geojson, {
      style: {
        color: "#1f2937",
        weight: 1,
        fillColor: "#60a5fa",
        fillOpacity: 0.25,
      },
      onEachFeature: (feature, layer) => {
        layer.on({
          mouseover: (e) => {
            e.target.setStyle({ weight: 2, fillOpacity: 0.35 });
            e.target.bringToFront();
          },
          mouseout: (e) => {
            polyLayer.resetStyle(e.target);
          },
        });
      },
    }).addTo(map_spilhaus);

    // 可选：视图贴合
    // const b = polyLayer.getBounds();
    // if (b.isValid()) map_spilhaus.fitBounds(b, { maxZoom: 3, padding: [10,10] });
  })
  .catch((err) => console.error("GeoJSON load failed:", err));

fetch("assets/Ghana.geojson", { cache: "no-cache" })
  .then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  })
  .then((geojson) => {
    geojson.crs = { type: "name", properties: { name: "ESRI:54099" } };

    const polyLayer = new L.Proj.GeoJSON(geojson, {
      style: {
        color: "#1f2937",
        weight: 1,
        fillColor: "#60a5fa",
        fillOpacity: 0.25,
      },
      onEachFeature: (feature, layer) => {
        layer.on({
          mouseover: (e) => {
            e.target.setStyle({ weight: 2, fillOpacity: 0.35 });
            e.target.bringToFront();
          },
          mouseout: (e) => {
            polyLayer.resetStyle(e.target);
          },
        });
      },
    }).addTo(map_spilhaus);

    // 可选：视图贴合
    // const b = polyLayer.getBounds();
    // if (b.isValid()) map_spilhaus.fitBounds(b, { maxZoom: 3, padding: [10,10] });
  })
  .catch((err) => console.error("GeoJSON load failed:", err));

fetch("assets/Mali.geojson", { cache: "no-cache" })
  .then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  })
  .then((geojson) => {
    geojson.crs = { type: "name", properties: { name: "ESRI:54099" } };

    const polyLayer = new L.Proj.GeoJSON(geojson, {
      style: {
        color: "#1f2937",
        weight: 1,
        fillColor: "#60a5fa",
        fillOpacity: 0.25,
      },
      onEachFeature: (feature, layer) => {
        layer.on({
          mouseover: (e) => {
            e.target.setStyle({ weight: 2, fillOpacity: 0.35 });
            e.target.bringToFront();
          },
          mouseout: (e) => {
            polyLayer.resetStyle(e.target);
          },
        });
      },
    }).addTo(map_spilhaus);

    // 可选：视图贴合
    // const b = polyLayer.getBounds();
    // if (b.isValid()) map_spilhaus.fitBounds(b, { maxZoom: 3, padding: [10,10] });
  })
  .catch((err) => console.error("GeoJSON load failed:", err));

fetch("assets/Mozambique.geojson", { cache: "no-cache" })
  .then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  })
  .then((geojson) => {
    geojson.crs = { type: "name", properties: { name: "ESRI:54099" } };

    const polyLayer = new L.Proj.GeoJSON(geojson, {
      style: {
        color: "#1f2937",
        weight: 1,
        fillColor: "#60a5fa",
        fillOpacity: 0.25,
      },
      onEachFeature: (feature, layer) => {
        layer.on({
          mouseover: (e) => {
            e.target.setStyle({ weight: 2, fillOpacity: 0.35 });
            e.target.bringToFront();
          },
          mouseout: (e) => {
            polyLayer.resetStyle(e.target);
          },
        });
      },
    }).addTo(map_spilhaus);

    // 可选：视图贴合
    // const b = polyLayer.getBounds();
    // if (b.isValid()) map_spilhaus.fitBounds(b, { maxZoom: 3, padding: [10,10] });
  })
  .catch((err) => console.error("GeoJSON load failed:", err));

fetch("assets/Nigeria.geojson", { cache: "no-cache" })
  .then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  })
  .then((geojson) => {
    geojson.crs = { type: "name", properties: { name: "ESRI:54099" } };

    const polyLayer = new L.Proj.GeoJSON(geojson, {
      style: {
        color: "#1f2937",
        weight: 1,
        fillColor: "#60a5fa",
        fillOpacity: 0.25,
      },
      onEachFeature: (feature, layer) => {
        layer.on({
          mouseover: (e) => {
            e.target.setStyle({ weight: 2, fillOpacity: 0.35 });
            e.target.bringToFront();
          },
          mouseout: (e) => {
            polyLayer.resetStyle(e.target);
          },
        });
      },
    }).addTo(map_spilhaus);

    // 可选：视图贴合
    // const b = polyLayer.getBounds();
    // if (b.isValid()) map_spilhaus.fitBounds(b, { maxZoom: 3, padding: [10,10] });
  })
  .catch((err) => console.error("GeoJSON load failed:", err));

fetch("assets/Senegal.geojson", { cache: "no-cache" })
  .then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  })
  .then((geojson) => {
    geojson.crs = { type: "name", properties: { name: "ESRI:54099" } };

    const polyLayer = new L.Proj.GeoJSON(geojson, {
      style: {
        color: "#1f2937",
        weight: 1,
        fillColor: "#60a5fa",
        fillOpacity: 0.25,
      },
      onEachFeature: (feature, layer) => {
        layer.on({
          mouseover: (e) => {
            e.target.setStyle({ weight: 2, fillOpacity: 0.35 });
            e.target.bringToFront();
          },
          mouseout: (e) => {
            polyLayer.resetStyle(e.target);
          },
        });
      },
    }).addTo(map_spilhaus);

    // 可选：视图贴合
    // const b = polyLayer.getBounds();
    // if (b.isValid()) map_spilhaus.fitBounds(b, { maxZoom: 3, padding: [10,10] });
  })
  .catch((err) => console.error("GeoJSON load failed:", err));

fetch("assets/South_Africa.geojson", { cache: "no-cache" })
  .then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  })
  .then((geojson) => {
    geojson.crs = { type: "name", properties: { name: "ESRI:54099" } };

    const polyLayer = new L.Proj.GeoJSON(geojson, {
      style: {
        color: "#1f2937",
        weight: 1,
        fillColor: "#60a5fa",
        fillOpacity: 0.25,
      },
      onEachFeature: (feature, layer) => {
        layer.on({
          mouseover: (e) => {
            e.target.setStyle({ weight: 2, fillOpacity: 0.35 });
            e.target.bringToFront();
          },
          mouseout: (e) => {
            polyLayer.resetStyle(e.target);
          },
        });
      },
    }).addTo(map_spilhaus);

    // 可选：视图贴合
    // const b = polyLayer.getBounds();
    // if (b.isValid()) map_spilhaus.fitBounds(b, { maxZoom: 3, padding: [10,10] });
  })
  .catch((err) => console.error("GeoJSON load failed:", err));
