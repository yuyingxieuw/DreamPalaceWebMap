"use strict";

var baseLayers;
var overlays;
var name_list = [];
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
var country_centroid = {
  // prettier-ignore
  "Brazil": [-7.535994, -72.340427],
  // prettier-ignore
  "Burkina Faso": [11.726473, -5.308822],
  // prettier-ignore
  "Cameroon": [5.810411, 9.631660],
  // prettier-ignore
  "Ghana": [7.678434, -2.749734],
  // prettier-ignore
  "Mali": [18.191814, -5.811439],
  // prettier-ignore
  "Mozambique": [-18.877222, 32.659506],
  // prettier-ignore
  "Nigeria": [9.039145, 2.763425],
  // prettier-ignore
  "Senegal": [14.781868, -17.375992],
  // prettier-ignore
  "South Africa": [-28.898819, 17.063372],
  // prettier-ignore
  "United Kingdom": [54.091472, -13.224016],
  // prettier-ignore
  "United States of America": [41.599380, -105.308336],
};

// map load
// set base layers
var map = L.map("map").setView([17.812196, -50.188083], 2);
var openStreetMap = L.tileLayer(
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }
);
openStreetMap.addTo(map);

var Stadia_AlidadeSatellite = L.tileLayer(
  "https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.{ext}",
  {
    minZoom: 0,
    maxZoom: 20,
    attribution:
      '&copy; CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | &copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    ext: "jpg",
  }
);

// load point data (style 1)
var address_US_1 = new L.GeoJSON.AJAX("assets/Address_US.geojson", {
  pointToLayer: US_style_1,
}).addTo(map);

function US_style_1(feature, latlng) {
  const attr = feature.properties;
  const status = attr["Current Status"];
  let fill_color = "rgba(203, 206, 18, 1)"; // stroke color
  let color = "hsla(195, 69%, 71%, 1.00)"; // fallback fill
  const radius = 4.5;
  const fillOpacity = 0.9;
  const opacity = 0.6;
  const weight = 2;
  switch (status) {
    case "Still Standing":
      color = "#C70039"; // orange
      fill_color = "rgba(235, 65, 113, 1)";
      break;
    // case "Converted":
    //   color = "#FF5733"; // yellow
    //   break;
    // case "Demolished":
    //   color = "#FFC300"; // greenish
    //   break;
    // case null:
    // case undefined:
    // case "":
    //   color = "#f9e79f"; // light
    //   break;
  }
  var marker = L.circleMarker(latlng, {
    radius,
    color,
    weight,
    fillColor: fill_color,
    fillOpacity,
    fill: true,
    opacity: opacity,
  });

  // add click function
  marker.on("click", function () {
    var message =
      "Theater:&nbsp" +
      attr.Name +
      "<br> Address:&nbsp" +
      attr.Address +
      "<br> City:&nbsp" +
      attr.City +
      "<br> State:&nbsp" +
      attr.State +
      "<br> ZIP Code:&nbsp" +
      attr.ZIP +
      "<br> Current Status:&nbsp" +
      (attr["Current Status"] ? attr["Current Status"] : "Unknow") +
      "<br> Year of Existence:&nbsp" +
      (attr.Creation ? attr.Creation : "Unknow") +
      "&nbsp-&nbsp" +
      (attr.Closure ? attr.Closure : "Unknow") +
      "<br> Website:&nbsp" +
      (attr.Website ? attr.Website : "Unknow") +
      "<br> Notes:&nbsp" +
      (attr.Notes ? attr.Notes : "Unknow");
    document.getElementById("data_query").click();
    $("#data_query_window").html(message);
  });

  return marker;
}
// load point data (style 2)
var address_US_2 = new L.GeoJSON.AJAX("assets/Address_US.geojson", {
  pointToLayer: US_style_2,
});

function US_style_2(feature, latlng) {
  const attr = feature.properties;
  const status = attr["Specific Location"];
  let fill_color = "#12120fff"; // stroke color
  let color = "hsla(195, 69%, 71%, 1.00)"; // fallback fill
  const radius = 4.5;
  let fillOpacity = 0.9;
  const opacity = 0.6;
  const weight = 2;
  switch (status) {
    case 1:
      color = "#b6adb9ff"; // orange
      fill_color = "rgba(235, 65, 113, 1)";
      fillOpacity = 1;
      break;
  }
  var marker = L.circleMarker(latlng, {
    radius,
    color,
    weight,
    fillColor: fill_color,
    fillOpacity,
    fill: true,
    opacity: opacity,
  });

  // add click function
  marker.on("click", function () {
    var message =
      "Theater:&nbsp" +
      attr.Name +
      "<br> Address:&nbsp" +
      attr.Address +
      "<br> City:&nbsp" +
      attr.City +
      "<br> State:&nbsp" +
      attr.State +
      "<br> ZIP Code:&nbsp" +
      attr.ZIP +
      "<br> Current Status:&nbsp" +
      (attr["Current Status"] ? attr["Current Status"] : "Unknow") +
      "<br> Year of Existence:&nbsp" +
      (attr.Creation ? attr.Creation : "Unknow") +
      "&nbsp-&nbsp" +
      (attr.Closure ? attr.Closure : "Unknow") +
      "<br> Website:&nbsp" +
      (attr.Website ? attr.Website : "Unknow") +
      "<br> Notes:&nbsp" +
      (attr.Notes ? attr.Notes : "Unknow");
    $("#data_info").html(message);
  });

  return marker;
}
// load city polygon
var city = new L.GeoJSON.AJAX("assets/citylayer7.30.geojson", {
  style: city_style,
  onEachFeature: city_process,
});

function city_style(feature) {
  return {
    color: "rgba(12, 175, 178, 1)",
    weight: 2,
    fillColor: "#cacae5ff",
    fillOpacity: 0.5,
  };
}
function city_process(feature, layer) {
  var attr = feature.properties;
  var city_name = attr.city;
  /// generate name list for search bar
  name_list.push({ name: city_name, layer: layer });
  // console.log(name_list);
  // console.log("Processing city:", city_name);
  layer.on("click", function () {
    map.fitBounds(layer.getBounds());
    layer.bindPopup("City" + city_name);
  });
}

// load world map
var world = new L.GeoJSON.AJAX("assets/worldPolygon.geojson", {
  style: world_style,
  onEachFeature: world_process,
}).addTo(map);
function world_style(feature) {
  const attr = feature.properties;
  const country_name = attr.NAME;
  let fill_color = "gray";
  let fill_opacity = 0.6;
  let restcolor = "white";
  let restweight = 0.4;
  if (country_array.includes(country_name)) {
    fill_color = "rgba(255, 255, 255, 1)";
    fill_opacity = 0;
    restcolor = "#8F1C06";
    restweight = 1;
    console.log(country_name);
  }

  return {
    color: restcolor,
    weight: restweight,
    fillColor: fill_color,
    fillOpacity: fill_opacity,
  };
}

function world_process(feature, layer) {
  var attr = feature.properties;
  var country_name = attr.NAME;
  name_list.push({ name: country_name, layer: layer }); // this for search bar
  if (country_array.includes(country_name)) {
    layer.on("click", function () {
      var latlon = country_centroid[country_name];
      if (latlon) {
        map.setView(latlon, 5);
        // // reset the color
        // world.eachLayer(function (l) {
        //   const name = l.feature.properties.NAME;
        //   const isTarget = country_array.includes(name);
        //   l.setStyle({
        //     fillColor: isTarget ? "#1888ee" : "white",
        //     fillOpacity: 1,
        //   });

        //   l.off("mouseover");
        //   l.off("mouseout");
        // });
        // // Make clicked country transparent
        // layer.setStyle({ fillOpacity: 0 });
      }
    });

    // layer.on("mouseover", function () {
    //   layer.setStyle({ fillOpacity: 1 });
    //   layer.getElement()?.style &&
    //     (layer.getElement().style.cursor = "pointer");
    // });
    // layer.on("mouseout", function () {
    //   layer.setStyle({ fillOpacity: 0.5 });
    // });
  }
}

// general function

/// find the map - buttom
$("#backBtn").click(function () {
  map.setView([17.812196, -50.188083], 2);
});
// reset the data - buttom
$("#resetBtn").click(function () {
  map.setView([17.812196, -50.188083], 2);
  $("#data_info").html(" ");
});

var poliLayer = L.featureGroup([city, world]);
var searchControl = new L.Control.Search({
  layer: poliLayer,
  propertyName: "NAME",
  marker: false,
  collapsed: false,
  position: "topright",
  moveToLocation: function (latlng, title, map) {
    var zoom = map.getBoundsZoom(latlng.layer.getBounds());
    map.setView(latlng, zoom);
  },
});

searchControl.on("search:locationfound", function (e) {
  console.log("search:locationfound");
  console.log(e);
});

map.addControl(searchControl);

// document.addEventListener("DOMContentLoaded", function () {
//   const dropdown = document.getElementById("customSearchDropdown");
//   if (dropdown) {
//     name_list.forEach((entry) => {
//       const option = document.createElement("option");
//       option.value = entry.name;
//       option.textContent = entry.name;
//       dropdown.appendChild(option);
//     });

//     dropdown.addEventListener("change", function () {
//       const selectedName = this.value;
//       const match = name_list.find((e) => e.name === selectedName);
//       if (match) {
//         map.fitBounds(match.layer.getBounds());
//         match.layer.bindPopup(`You selected: ${match.name}`).openPopup();
//       }
//     });
//   } else {
//     console.error("Dropdown element not found");
//   }
// });

////add search bar to custom conatiner
// setTimeout(() => {
//   const searchControlEl = document.querySelector(".leaflet-control-search");
//   const targetContainer = document.getElementById("search-container");
//   if (searchControlEl && targetContainer) {
//     targetContainer.appendChild(searchControlEl);
//   }
// }, 500);

// add layer control
baseLayers = {
  "Still Standing": address_US_1,
  "With/out Specific location": address_US_2,
};
overlays = {
  "City Boundary": city,
  "Dream Palaces": address_US_1,
  "Country Boundary": world,
};
var control_layers = L.control.layers(baseLayers, overlays).addTo(map);

// add zoom control
L.control.zoom({ position: "topright" }).addTo(map);

// add side bar
var sidebar = L.control.sidebar("sidebar", {
  position: "left",
});
map.addControl(sidebar);
sidebar.open("home");

// add geometry bar
map.pm.addControls({
  position: "topright",
  drawMarker: true,
  drawCircleMarker: false,
  drawPolyline: false,
  drawRectangle: false,
  drawCircle: false,
  drawPolygon: false,
  drawText: false,
  editMode: true,
  dragMode: true,
  cutPolygon: false,
  removalMode: true,
  oneBlock: false,
  rotateMode: false,
  drawControls: true,
  editControls: true,
  editMode: false,
});

//sidebar button effect
//btn explore dream palace
document.querySelector("#explore").addEventListener("click", function () {
  document.querySelector("#level_2_menu_group").style.display = "block";
  document.querySelector("#explore_container").style.display = "block";
  document.querySelector("#data_container").style.display = "none";
  document.querySelector("#about_project").style.display = "inline";
  document.querySelector("#about_project_content").style.display = "block";
  document.querySelector("#data_source_content").style.display = "none";
  document.querySelector("#about_team_content").style.display = "none";
});

//btn data query
document.querySelector("#data_query").addEventListener("click", function () {
  document.querySelector("#explore_container").style.display = "none";
  document.querySelector("#data_container").style.display = "block";
});

//btn about project
document.querySelector("#about_project").addEventListener("click", function () {
  document.querySelector("#about_project_content").style.display = "block";
  document.querySelector("#data_source_content").style.display = "none";
  document.querySelector("#about_team_content").style.display = "none";
  document.querySelector("#data_container").style.display = "none";
});

//btn data source
document.querySelector("#data_source").addEventListener("click", function () {
  document.querySelector("#about_project_content").style.display = "none";
  document.querySelector("#data_source_content").style.display = "block";
  document.querySelector("#about_team_content").style.display = "none";
  document.querySelector("#data_container").style.display = "none";
});

//btn about team
document.querySelector("#about_team").addEventListener("click", function () {
  document.querySelector("#about_project_content").style.display = "none";
  document.querySelector("#data_source_content").style.display = "none";
  document.querySelector("#about_team_content").style.display = "block";
  document.querySelector("#data_container").style.display = "none";
});
