class WebMapApp {
  constructor() {
    this.mapManager = new MapManager(this);
    this.layerManager = new LayerManager(this);
    this.uiManager = new UIManager(this);
    this.searchManager = new SearchManager(this);
    this.eventManager = new EventManager(this);
  }

  initialize() {
    this.mapManager.registerCRS();
    this.mapManager.createSpilhaus();
    this.mapManager.activate("spilhaus");
    // this.mapManager.initMapWithWGS();
    // this.mapManager.addBaseTiles();
    // this.mapManager.guardMapRestes();
    this.layerManager.loadForProjection("spilhaus");
  }
}

class MapManager {
  constructor(app) {
    this.app = app;
    this.projCode = "ESRI:54099";
    this.map_spilhaus = null;
    this.map_wgs = null;
    this.spilhausCRS = null;
    this.countryLayers = [];
  }

  registerCRS() {
    proj4.defs(
      "ESRI:54099",
      "+proj=moll +lon_0=0 +x_0=0 +y_0=0 +units=m +datum=WGS84 +no_defs"
    );
  }

  buildCRS() {
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

    this.spilhausCRS = new L.Proj.CRS(
      this.projCode,
      proj4.defs(this.projCode),
      {
        origin: [minx, maxy], // 左上角 (minx, maxy)
        resolutions, // 与 XML 完全一致
        bounds: L.bounds([minx, miny], [maxx, maxy]), // 限制平移
      }
    );
  }

  initMapWithSpilhaus() {
    this.map_spilhaus = L.map("mapSpilhaus", {
      crs: this.spilhausCRS,
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
  }

  addBaseTiles() {
    //this is baseTile for spilhaus
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
    }).addTo(this.map_spilhaus);
  }

  loadSpilhausGeoJSON() {
    const country_spil = [
      "Brazil",
      "Burkina_Faso",
      "Cameroon",
      "Ghana",
      "Mali",
      "Mozambique",
      "Nigeria",
      "Senegal",
      "South_Africa",
    ];

    const style = {
      color: "#1f2937",
      weight: 1,
      fillColor: "#60a5fa",
      fillOpacity: 0.25,
      pane: "worldPane",
    };

    country_spil.map(async (country) => {
      fetch(`assets/${country.replace(/\s+/g, "_")}.geojson`, {
        cache: "no-cache",
      })
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
                click: (e) => {
                  initMapWithWGS(country);
                },
              });
            },
          }).addTo(this.app.mapSpilhaus);
        })
        .catch((err) => console.error("GeoJSON load failed:", err));
    });
  }

  initMapWithWGS(country) {
    if (this.map_wgs) {
      this.map_wgs.remove();
    }
    const country_centroid = {
      // prettier-ignore
      "Brazil": [-7.535994, -72.340427],
      // prettier-ignore
      "Burkina_Faso": [11.726473, -5.308822],
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
      "South_Africa": [-28.898819, 17.063372],
      // prettier-ignore
      "uk": [54.091472, -13.224016],
      // prettier-ignore
      "us": [41.599380, -105.308336],
    };
    this.map_wgs = L.map("mapWGS", {
      center: country_centroid[country],
      zoom: 2,
      scrollWheelZoom: true,
      doubleClickZoom: true,
    });
  }
  setViewWGS() {
    this.layerManager.loadAllLayers();
    this.searchManager.initSearchBar();
    this.uiManager.initSideBar();
    this.uiManager.initSidebarEvents();
    this.eventManager.attachLayerControl();
    this.eventManager.attachZoomHandler();
    this.eventManager.attachDrawButtons();
  }
}

class LayerManager {
  constructor(app) {
    this.app = app;
    this.city_list = [];
    this.country_list = [];
    this.openStreetMap = null;
    this.city = null;
    this.world = null;
    this.palace = null;
  }

  loadAllLayers() {
    //set pan level
    this.app.map.createPane("palacePane");
    this.app.map.createPane("cityPane");
    this.app.map.createPane("worldPane");
    this.app.map.getPane("palacePane").style.zIndex = 450;
    this.app.map.getPane("cityPane").style.zIndex = 300;
    this.app.map.getPane("worldPane").style.zIndex = 250;

    this.loadBasemap();
    this.loadPalacePoints();
    this.initStyleRadioWatcher();
    this.loadStatePolygon();
    this.loadCityPolygon();
    this.loadWorldPolygon();
  }

  loadBasemap() {
    this.openStreetMap = L.tileLayer(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    );
    this.openStreetMap.addTo(this.app.map);
  }

  loadPalacePoints() {
    this.palace = new L.GeoJSON.AJAX("assets/Address_US.geojson", {
      pane: "palacePane",
      pointToLayer: this.getPointStyleFunction(),
    }).addTo(this.app.map);
  }

  initStyleRadioWatcher() {
    document.querySelectorAll('input[name="choosestyle"]').forEach((radio) => {
      radio.addEventListener("change", () => {
        console.log("选项变化，重新加载图层");
        this.reloadPalaceLayer(); // 每次根据 getPointStyleFunction 重新加载
      });
    });
  }

  reloadPalaceLayer() {
    if (this.palace) {
      this.palace.remove();
    }
    this.palace = new L.GeoJSON.AJAX("assets/Address_US.geojson", {
      pointToLayer: this.getPointStyleFunction(),
      pane: "palacePane",
    }).addTo(this.app.map);
  }

  getPointStyleFunction() {
    const selected = document.querySelector(
      'input[name="choosestyle"]:checked'
    ).id;
    // console.log(selected);
    return selected === "pointStyle1"
      ? this.pointStyle1.bind(this)
      : this.pointStyle2.bind(this);
  }

  pointStyle1(feature, latlng) {
    const attr = feature.properties;
    const location = latlng;
    const status = attr["Current Status"];
    const radius = 4.5;
    const fillOpacity = 0.9;
    const opacity = 0.6;
    const weight = 2;
    let fill_color = "rgba(203, 206, 18, 1)";
    let inner_color = "#f9e79f";

    switch (status) {
      case "Still Standing":
        inner_color = "#C70039";
        fill_color = "rgba(235, 65, 113, 1)";
        break;
    }

    const marker = L.circleMarker(latlng, {
      radius,
      fillOpacity,
      opacity,
      weight,
      fillColor: fill_color,
      color: inner_color,
    });

    marker.on("click", () => {
      const message = this.generatePointMsg(attr);
      this.app.uiManager.initSideBar(); // in case it's collapsed
      // handel when dataquery is shown
      const el = document.querySelector("#data_container");
      const isHidden = window.getComputedStyle(el).display === "none";
      console.log("是否隐藏：", isHidden);
      if (!isHidden) {
        this.app.uiManager.showElement("#explore_container");
      }
      this.app.uiManager.handleExploreAreaClick();
      $("#explore_area_content").html(message);
      // can add setview but it's too much move
      const location = latlng;
      this.app.map.setView(location, 9);
    });
    return marker;
  }

  pointStyle2(feature, latlng) {
    const attr = feature.properties;
    const status = attr["Specific Location"];
    const radius = 4.5;
    const opacity = 0.6;
    const weight = 2;
    let fill_opacity = 0.9;
    let fill_color = "#12120fff";
    let inner_color = "hsla(195, 69%, 71%, 1.00)";

    switch (status) {
      case 1:
        inner_color = "#b6adb9ff"; // orange
        fill_color = "rgba(235, 65, 113, 1)";
        fill_opacity = 1;
        break;
    }

    const marker = L.circleMarker(latlng, {
      radius,
      opacity,
      weight,
      fillColor: fill_color,
      color: inner_color,
      fillOpacity: fill_opacity,
    });

    marker.on("click", () => {
      const message = this.generatePointMsg(attr);
      this.app.uiManager.initSideBar(); // in case it's collapsed
      // handel when dataquery is shown
      const el = document.querySelector("#data_container");
      const isHidden = window.getComputedStyle(el).display === "none";
      console.log("是否隐藏：", isHidden);
      if (!isHidden) {
        this.app.uiManager.showElement("#explore_container");
      }
      this.app.uiManager.handleExploreAreaClick();
      $("#explore_area_content").html(message);
      // can add setview but it's too much move
      // const location = latlng;
      // this.app.map.setView(location, 8);
    });
    return marker;
  }

  generatePointMsg(data) {
    let message =
      "Theater:&nbsp" +
      data.Name +
      "<br> Address:&nbsp" +
      data.Address +
      "<br> City:&nbsp" +
      data.City +
      "<br> State:&nbsp" +
      data.State +
      "<br> ZIP Code:&nbsp" +
      data.ZIP +
      "<br> Current Status:&nbsp" +
      (data["Current Status"] ? data["Current Status"] : "Unknown") +
      "<br> Year of Existence:&nbsp" +
      (data.Creation ? data.Creation : "Unknown") +
      "&nbsp-&nbsp" +
      (data.Closure ? data.Closure : "Unknown") +
      "<br> Website:&nbsp" +
      (data.Website ? data.Website : "Unknown") +
      "<br> Notes:&nbsp" +
      (data.Notes ? data.Notes : "Unknown");
    return message;
  }

  loadCityPolygon() {
    this.city = new L.GeoJSON.AJAX("assets/citylayer7.30.geojson", {
      pane: "cityPane",
      style: () => ({
        color: "gray",
        weight: 0,
        opacity: 1,
        fillOpacity: 0,
      }),
      onEachFeature: (feature, layer) => {
        this.city_list.push({
          name: feature.properties.city,
          layer,
          bounds: layer.getBounds(),
        });

        layer.on("mouseover", () => {
          layer.setStyle({ weight: 1.3 });
        });

        layer.on("mouseout", () => {
          layer.setStyle({ weight: 0 });
        });
      },
    }).addTo(this.app.map);
  }

  loadStatePolygon() {}

  loadWorldPolygon() {
    const country_array = [
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
    const country_centroid = {
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
    this.world = new L.GeoJSON.AJAX("assets/worldPolygon.geojson", {
      pane: "worldPane",
      style: (feature) => {
        const name = feature.properties.NAME;
        if (country_array.includes(name)) {
          return {
            color: "#8F1C06",
            weight: 1,
            fillColor: "rgba(255,255,255,0)",
            fillOpacity: 0,
          };
        }
        return {
          color: "white",
          weight: 0.4,
          fillColor: "gray",
          fillOpacity: 0.6,
        };
      },
      onEachFeature: (feature, layer) => {
        const name = feature.properties.NAME;
        this.country_list.push({ name, layer });
        if (country_array.includes(name)) {
          layer.on("click", () => {
            this.app.map.setView(country_centroid[name], 5);
          });
        }
      },
    }).addTo(this.app.map);
  }
}

class UIManager {
  constructor(app) {
    this.app = app;
  }

  initSideBar() {
    this.sidebar = L.control.sidebar("sidebar", {
      position: "left",
    });
    this.app.map.addControl(this.sidebar);
    this.sidebar.open("home");
  }

  showGlobalMenu() {
    this.handleAboutProjectClick();
  }

  showCountryMenu() {
    this.handleExploreAreaClick();
  }

  updateSidebarByZoom() {
    const el = document.querySelector("#data_container");
    const isHidden = window.getComputedStyle(el).display === "none";
    console.log("是否隐藏：", isHidden);
    if (!isHidden) {
      return;
    }
    let currentZoom = this.app.map.getZoom();
    if (currentZoom <= 4) {
      this.showGlobalMenu();
    } else {
      this.showCountryMenu();
    }
  }

  // buttons
  showElement(selector) {
    document.querySelector(selector).style.display = "block";
  }

  hideElement(selector) {
    document.querySelector(selector).style.display = "none";
  }

  setDisplay(selector, value) {
    document.querySelector(selector).style.display = value;
  }

  handleExploreClick() {
    this.showElement("#level_2_menu_group_1");
    this.hideElement("#level_2_menu_group_2");
    this.showElement("#explore_container");
    this.hideElement("#data_container");
    this.setDisplay("#about_project", "inline");
    this.showElement("#about_project_content");
    this.hideElement("#data_source_content");
    this.hideElement("#about_team_content");
    this.hideElement("#explore_area_content");
    this.hideElement("#palace_history_content");
    this.hideElement("#picture_more_content");
    this.app.map.setView([17.812196, -50.188083], 2);
  }

  handleDataQueryClick() {
    this.hideElement("#explore_container");
    this.showElement("#data_container");
  }

  handleAboutProjectClick() {
    this.showElement("#level_2_menu_group_1");
    this.hideElement("#level_2_menu_group_2");
    this.showElement("#about_project_content");
    this.hideElement("#data_source_content");
    this.hideElement("#about_team_content");
    this.hideElement("#data_container");
    this.hideElement("#explore_area_content");
    this.hideElement("#palace_history_content");
    this.hideElement("#picture_more_content");
  }
  handleDataSourceClick() {
    this.hideElement("#about_project_content");
    this.showElement("#data_source_content");
    this.hideElement("#about_team_content");
    this.hideElement("#data_container");
    this.hideElement("#explore_area_content");
    this.hideElement("#palace_history_content");
    this.hideElement("#picture_more_content");
  }
  handleAboutTeamClick() {
    this.hideElement("#about_project_content");
    this.hideElement("#data_source_content");
    this.showElement("#about_team_content");
    this.hideElement("#data_container");
    this.hideElement("#explore_area_content");
    this.hideElement("#palace_history_content");
    this.hideElement("#picture_more_content");
  }

  handleExploreAreaClick() {
    this.hideElement("#level_2_menu_group_1");
    this.showElement("#level_2_menu_group_2");
    this.hideElement("#about_project_content");
    this.hideElement("#data_source_content");
    this.hideElement("#about_team_content");
    this.hideElement("#data_container");
    this.showElement("#explore_area_content");
    this.hideElement("#palace_history_content");
    this.hideElement("#picture_more_content");
  }

  handlePalaceHistoryClick() {
    this.hideElement("#about_project_content");
    this.hideElement("#data_source_content");
    this.hideElement("#about_team_content");
    this.hideElement("#data_container");
    this.hideElement("#explore_area_content");
    this.showElement("#palace_history_content");
    this.hideElement("#picture_more_content");
  }

  handlePictureMoreClick() {
    this.hideElement("#about_project_content");
    this.hideElement("#data_source_content");
    this.hideElement("#about_team_content");
    this.hideElement("#data_container");
    this.hideElement("#explore_area_content");
    this.hideElement("#palace_history_content");
    this.showElement("#picture_more_content");
  }

  initSidebarEvents() {
    document
      .querySelector("#explore")
      .addEventListener("click", this.handleExploreClick.bind(this));
    document
      .querySelector("#data_query")
      .addEventListener("click", this.handleDataQueryClick.bind(this));
    document
      .querySelector("#about_project")
      .addEventListener("click", this.handleAboutProjectClick.bind(this));
    document
      .querySelector("#data_source")
      .addEventListener("click", this.handleDataSourceClick.bind(this));
    document
      .querySelector("#about_team")
      .addEventListener("click", this.handleAboutTeamClick.bind(this));
    document
      .querySelector("#explore_area")
      .addEventListener("click", this.handleExploreAreaClick.bind(this));
    document
      .querySelector("#palace_history")
      .addEventListener("click", this.handlePalaceHistoryClick.bind(this));
    document
      .querySelector("#picture_more")
      .addEventListener("click", this.handlePictureMoreClick.bind(this));
  }
}

class SearchManager {
  constructor(app) {
    this.app = app;
  }

  initSearchBar() {
    const poliLayer = L.featureGroup([
      this.app.layerManager.city,
      this.app.layerManager.world,
    ]);
    this.poliLayer = poliLayer;
    const searchControl = new L.Control.Search({
      layer: poliLayer,
      propertyName: "NAME",
      marker: false,
      collapsed: false,
      position: "topright",
      moveToLocation: (latlng, title, map) => {
        map.setView(latlng, 8);
      },
    });
    this.app.map.addControl(searchControl);
  }

  updateNameList() {}
}

class EventManager {
  constructor(app) {
    this.app = app;
  }

  attachLayerControl() {
    const baseLayers = {
      "Open Street Basemap": this.app.layerManager.openStreetMap,
    };
    const overLays = {
      "City Boundary": this.app.layerManager.city,
      "Country Boundary": this.app.layerManager.world,
    };
    L.control.layers(baseLayers, overLays).addTo(this.app.map);
  }

  attachZoomHandler() {
    L.control.zoom({ position: "topright" }).addTo(this.app.map);
    this.app.map.on("zoomend", () => {
      this.app.uiManager.updateSidebarByZoom();
    });
  }
  attachDrawButtons() {
    this.app.map.pm.addControls({
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
  }
}

// test the script
const app = new WebMapApp();
app.initialize();
