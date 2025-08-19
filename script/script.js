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
    this.mapManager.buildCRS();
    this.mapManager.createSpilhaus();
    this.mapManager.addSpilhausTiles();
    this.mapManager.loadSpilhausCountries();
    this.mapManager.activate("spilhaus");
    this.layerManager.loadForProjection("spilhaus");
  }
}

class MapManager {
  constructor(app) {
    this.app = app;
    // DOM
    this.containerSpilhaus = "mapSpilhaus";
    this.containerWgs = "mapWgs";
    // projection const
    this.projCode = "ESRI:54099";
    this.spilhausCRS = null;
    // map const
    this.mapSpilhaus = null;
    this.mapWgs = null;
    this.active = null; // 'spilhaus'|'wgs' // for _emitprojectionchange function
    this.activeCountry = null; // for _emitprojectionchange function
    // layer const
    this.spilhausTiles = null;
    this.spilhausCountryLayers = [];
    // setveiw
    this.spilhausStart = { center: [0, -150], zoom: 2 };
    this.wgsDefaultZoom = 4;
    // country centroid
    this.countryCentroid = {
      Brazil: [-7.535994, -72.340427],
      Burkina_Faso: [11.726473, -25.308822],
      Cameroon: [5.810411, 0.63166],
      Ghana: [7.678434, -22.749734],
      Mali: [18.191814, -15.811439],
      Mozambique: [-18.877222, 0.659506],
      Nigeria: [9.039145, 2.763425],
      Senegal: [14.781868, -17.375992],
      South_Africa: [-28.898819, -7.063372],
      United_Kingdom: [54.091472, -3.224016],
      United_States_of_America: [41.59938, -105.308336],
    };
    this.spilhausCountryFiles = [
      "Brazil",
      "Burkina_Faso",
      "Cameroon",
      "Ghana",
      "Mali",
      "Mozambique",
      "Nigeria",
      "Senegal",
      "South_Africa",
      // need to add US and UK
    ];
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

  createSpilhaus() {
    this._hide(this.containerWgs);
    this._show(this.containerSpilhaus);

    this.mapSpilhaus = L.map(this.containerSpilhaus, {
      crs: this.spilhausCRS,
      center: this.spilhausStart.center,
      zoom: this.spilhausStart.zoom,
      minZoom: 2,
      maxZoom: 3,
      scrollWheelZoom: "center",
      touchZoom: "center",
      doubleClickZoom: "center",
      zoomSnap: 1,
      zoomDelta: 1,
      inertia: false,
    });
  }

  addSpilhausTiles() {
    this.spilhausTiles = L.tileLayer("tiles8.12/{z}/{x}/{y}.png", {
      tms: true,
      tileSize: 256,
      minZoom: 2,
      maxZoom: 3,
      minNativeZoom: 3,
      maxNativeZoom: 3,
      noWrap: true,
      updateWhenZooming: true,
      keepBuffer: 2,
    }).addTo(this.mapSpilhaus);
  }

  _ensureWgsCreated({ center = [0, 0], zoom = this.wgsDefaultZoom } = {}) {
    if (this.mapWgs) return;
    this.mapWgs = L.map(this.containerWgs, {
      center,
      zoom: Math.max(zoom, 4),
      minZoom: 4,
      maxZoom: 19,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      zoomSnap: 1,
    });

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      minZoom: 4,
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.mapWgs);
  }

  loadSpilhausCountries() {
    const style = {
      color: "#1f2937",
      weight: 1,
      fillColor: "#60a5fa",
      fillOpacity: 0.25,
    };

    this.spilhausCountryFiles.forEach((key) => {
      fetch(`assets/${key}.geojson`, {
        cache: "no-cache",
      })
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then((geojson) => {
          geojson.crs = { type: "name", properties: { name: this.projCode } };
          const polyLayer = new L.Proj.GeoJSON(geojson, {
            style,
            interactive: true,
            onEachFeature: (_, layer) => {
              layer.on({
                mouseover: (e) => {
                  e.target.setStyle({ weight: 2, fillOpacity: 0.35 });
                  e.target.bringToFront();
                  console.log("Mouseover::", e);
                },
                mouseout: (e) => {
                  polyLayer.resetStyle(e.target);
                },
                click: () => {
                  this._switchToWgsUsingCentroid(key);
                },
              });
            },
          }).addTo(this.mapSpilhaus);
          this.spilhausCountryLayers.push(polyLayer);
        })
        .catch((err) =>
          console.error(`[Spilhaus] GeoJSON load failed: ${key}`, err)
        );
    });
  }

  activate(mode, opts = {}) {
    if (mode === "spilhaus") {
      this._show(this.containerSpilhaus);
      this._hide(this.containerWgs);
      this.active = "spilhaus";
      this.activeCountry = null;
      // leaflet rest
      requestAnimationFrame(() => {
        if (this.mapSpilhaus) this.mapSpilhaus.invalidateSize();
      });

      if (opts.center || typeof opts.zoom === "number") {
        this.setView(
          opts.center ?? this.spilhausStart.center,
          opts.zoom ?? this.spilhausStart.zoom
        );
      }
      this._emitProjectionChange();
      return;
    }

    if (mode === "wgs") {
      this._ensureWgsCreated({
        center: opts.center,
        zoom: opts.zoom ?? this.wgsDefaultZoom,
      });
      this._hide(this.containerSpilhaus);
      this._show(this.containerWgs);
      this.active = "wgs";
      requestAnimationFrame(() => {
        if (this.mapSpilhaus) this.mapWgs.invalidateSize();
      });

      if (opts.center || typeof opts.zoom === "number") {
        this.setView(opts.center, opts.zoom ?? this.wgsDefaultZoom);
      }
      this._emitProjectionChange();
      return;
    }

    console.warn(`Unknown projection mode ${mode}`);
  }

  _switchToWgsUsingCentroid(countryKey) {
    const center = this.countryCentroid[countryKey];
    if (!center) {
      console.warn(
        `[WGS] Missing centroid for ${countryKey}, fallback to [0,0].`
      );
    }
    this.activeCountry = countryKey;
    this.activate("wgs", {
      center: center ?? [0, 0],
      zoom: this.wgsDefaultZoom,
    });
  }

  getActiveMap() {
    return this.active === "wgs" ? this.mapWgs : this.mapSpilhaus;
  }

  setView(latlng, zoom, options) {
    const m = this.getActiveMap();
    if (!m || !latlng) return;
    const z = typeof zoom === "number" ? zoom : m.getZoom();
    m.setView(latlng, z, options);
  }

  guardMapReset() {}

  _emitProjectionChange() {
    window.dispatchEvent(
      new CustomEvent("projectionchange", {
        detail: { projection: this.active, country: this.activeCountry },
      })
    );
  }

  _show(id) {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = "block";
      el.style.pointerEvents = "auto";
    }
  }

  _hide(id) {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = "none";
      el.style.pointerEvents = "none";
    }
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

    window.addEventListener("projectionchange", (e) => {
      const mode = e.detail.projection;
      this.loadForProjection(mode);
    });
  }

  loadForProjection(mode) {
    this.clearAll();
    if (mode !== "wgs") {
      return;
    }
    this._initPanesWGS();
    this.loadBasemapWGS();
    this.loadPalacePoints();
    this.initStyleRadioWatcher();
    this.loadCityPolygon();
    this.loadEmpirePolygon();
    this.loadWorldPolygon();
  }

  getMap() {
    return this.app.mapManager.getActiveMap();
  }

  getProj() {
    return this.app.mapManager.active;
  }

  _initPanesWGS() {
    const map = this.getMap();
    if (!map) return;
    if (!map.getPane("palacePane")) map.createPane("palacePane");
    if (!map.getPane("cityPane")) map.createPane("cityPane");
    if (!map.getPane("worldPane")) map.createPane("worldPane");
    map.getPane("palacePane").style.zIndex = 450;
    map.getPane("cityPane").style.zIndex = 300;
    map.getPane("worldPane").style.zIndex = 250;
  }

  clearAll() {
    const map = this.getMap();
    [this.palace, this.city, this.world, this.openStreetMap].forEach((lyr) => {
      if (lyr && map && map.hasLayer(lyr)) map.removeLayer(lyr);
    });
    this.palace = this.city = this.world = this.openStreetMap = null;
    this.city_list = [];
    this.country_list = [];
  }

  loadBasemapWGS() {
    const map = this.getMap();
    if (!map) return;
    this.openStreetMap = L.tileLayer(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    );
    this.openStreetMap.addTo(map);
  }

  loadPalacePoints() {
    const map = this.getMap();
    if (!map) return;
    this.palace = new L.GeoJSON.AJAX("assets/Address_US.geojson", {
      pane: "palacePane",
      pointToLayer: this.getPointStyleFunction(),
    }).addTo(map);
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
    const map = this.getMap();
    const proj = this.getProj();
    if (!map || proj === "spilhaus") return;
    if (this.palace) {
      map.removeLayer(this.palace);
    }
    this.palace = new L.GeoJSON.AJAX("assets/Address_US.geojson", {
      pointToLayer: this.getPointStyleFunction(),
      pane: "palacePane",
    }).addTo(map);
  }

  getPointStyleFunction() {
    const selected =
      document.querySelector('input[name="choosestyle"]:checked')?.id ||
      "pointStyle1";
    // console.log(selected);
    return selected === "pointStyle1"
      ? this.pointStyle1.bind(this)
      : this.pointStyle2.bind(this);
  }

  pointStyle1(feature, latlng) {
    const attr = feature.properties;
    const status = attr["Current Status"];
    const marker = L.circleMarker(latlng, {
      radius: 4.5,
      fillOpacity: 0.9,
      opacity: 0.6,
      weight: 2,
      fillColor:
        status === "Still Standing"
          ? "rgba(235, 65, 113, 1)"
          : "rgba(203, 206, 18, 1)",
      color: status === "Still Standing" ? "#C70039" : "#f9e79f",
    });

    marker.on("click", () => {
      const message = this.generatePointMsg(attr);
      this.app.uiManager.initSideBar(); // in case it's collapsed
      // handel when dataquery is shown
      const el = document.querySelector("#data_container");
      const isHidden = el && window.getComputedStyle(el).display === "none";
      console.log("是否隐藏：", isHidden);
      if (!isHidden) {
        this.app.uiManager.showElement("#explore_container");
      }
      this.app.uiManager.handleExploreAreaClick();
      $("#explore_area_content").html(message);
      // can add setview but it's too much move
      //this.app.mapManager.setView(latlng, 9);
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
      const isHidden = el && window.getComputedStyle(el).display === "none";
      console.log("是否隐藏：", isHidden);
      if (!isHidden) this.app.uiManager.showElement("#explore_container");
      this.app.uiManager.handleExploreAreaClick();
      $("#explore_area_content").html(message);
      // can add setview but it's too much move
      // const location = latlng;
      // this.app.mapManager.setView(location, 8);
    });
    return marker;
  }

  generatePointMsg(data) {
    return (
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
      (data.Notes ? data.Notes : "Unknown")
    );
  }

  loadCityPolygon() {
    const map = this.getMap();
    if (!map) return;
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
    }).addTo(map);
  }

  loadEmpirePolygon() {}

  loadWorldPolygon() {
    const map = this.getMap();
    if (!map) return;
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
    const centroid = {
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
        // 点击国家移动禁止
        // if (country_array.includes(name)) {
        //   layer.on("click", () => {
        //     this.app.mapManager.setView(centroid[name], 5);
        //   });
        // }
      },
    }).addTo(map);
  }
}

class UIManager {
  constructor(app) {
    this.app = app;
    this.sidebar = null;

    window.addEventListener("projectionchange", () => {
      this.initSideBar();
    });
  }

  getMap() {
    return this.app.mapManager.getActiveMap();
  }

  getCountry() {
    return this.app.mapManager.activeCountry;
  }

  initSideBar() {
    const map = this.getMap();
    if (!map) return;

    if (this.sidebar && this.sidebar.remove) {
      try {
        this.sidebar.remove();
      } catch {}
    }

    this.sidebar = L.control.sidebar("sidebar", {
      position: "left",
    });
    map.addControl(this.sidebar);
    this.sidebar.open("home");
    this.initSidebarEvents();
    this.backtoocean();
  }

  showGlobalMenu() {
    this.handleAboutProjectClick();
  }

  showCountryMenu() {
    this.handleExploreAreaClick();
  }

  updateSidebarByZoom() {
    const map = this.getMap();
    if (!map) return;

    const el = document.querySelector("#data_container");
    const isHidden = el && window.getComputedStyle(el).display === "none";
    console.log("是否隐藏：", isHidden);
    if (!isHidden) return;

    let currentZoom = map.getZoom();
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

  backtoocean() {
    const el = document.querySelector("#back");
    if (!el) return;
    el.addEventListener("click", (e) => {
      e.preventDefault();
      this.app.mapManager.activate(
        "spilhaus",
        this.app.mapManager.spilhausStart
      );
    });
  }
}

class SearchManager {
  constructor(app) {
    this.app = app;
    this.poliLayer = null;
    this.searchControl = null;

    window.addEventListener("projectionchange", (e) => {
      const mode = e.detail.projection;
      if (mode === "wgs") this.initSearchBar();
      else this.removeSearchBar();
    });
  }
  getMap() {
    return this.app.mapManager.getActiveMap();
  }
  removeSearchBar() {
    const map = this.getMap();
    if (this.searchControl && map) {
      try {
        map.removeControl(this.searchControl);
      } catch {}
      this.searchControl = null;
    }
  }
  initSearchBar() {
    const map = this.getMap();
    if (!map) return;
    this.removeSearchBar();
    this.poliLayer = L.featureGroup([
      this.app.layerManager.city,
      this.app.layerManager.world,
    ]);

    this.searchControl = new L.Control.Search({
      layer: this.poliLayer,
      propertyName: "NAME",
      marker: false,
      collapsed: false,
      position: "topright",
      moveToLocation: (latlng) => {
        this.app.mapManager.setView(latlng, 8);
      },
    });
    map.addControl(this.searchControl);
  }

  updateNameList() {}
}

class EventManager {
  constructor(app) {
    this.app = app;
    this.layersControl = null;

    window.addEventListener("projectionchange", (e) => {
      const mode = e.detail.projection;
      this.rebindForProjection(mode);
    });
  }

  getMap() {
    return this.app.mapManager.getActiveMap();
  }

  rebindForProjection(mode) {
    // 清除旧控制
    if (this.layersControl) {
      const map = this.getMap();
      if (map)
        try {
          map.removeControl(this.layersControl);
        } catch {}
      this.layersControl = null;
    }

    // 仅在 WGS 下挂载这些控件
    if (mode === "wgs") {
      this.attachLayerControl();
      this.attachZoomHandler();
      this.attachDrawButtons();
    }
  }

  attachLayerControl() {
    const map = this.getMap();
    if (!map) return;
    const baseLayers = {
      "Open Street Basemap": this.app.layerManager.openStreetMap,
    };
    const overLays = {
      "City Boundary": this.app.layerManager.city,
      "Country Boundary": this.app.layerManager.world,
    };
    this.layersControl = L.control.layers(baseLayers, overLays).addTo(map);
  }

  attachZoomHandler() {
    const map = this.getMap();
    if (!map) return;
    L.control.zoom({ position: "topright" }).addTo(map);
    map.on("zoomend", () => {
      this.app.uiManager.updateSidebarByZoom();
    });
  }
  attachDrawButtons() {
    const map = this.getMap();
    if (!map || !map.pm) return;
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
  }
}

// test the script
const app = new WebMapApp();
app.initialize();
