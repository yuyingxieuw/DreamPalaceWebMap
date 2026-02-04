class WebMapApp {
  constructor() {
    this.mapManager = new MapManager(this);
    this.dataManager = new DataManager(this);
    this.layerManager = new LayerManager(this);
    this.uiManager = new UIManager(this);
    //this.searchManager = new SearchManager(this);
    this.eventManager = new EventManager(this);
    this.timelineManager = new TimelineManager(this);
    this.wgsStateManager = new WgsStateManager(this);
  }

  async initialize() {
    // 1. fetch core data
    // 2. load initial projection
    // 3. init UI components
    await this.dataManager.fetchData();
    this.mapManager.buildCRS();
    this.mapManager.createSpilhaus();
    this.mapManager.addSpilhausTiles();
    this.mapManager.loadSpilhausCountries();
    this.mapManager.loadSpilhausPalace();
    this.mapManager.spilhausCenterSwitch();
    this.mapManager.activate("spilhaus");
    this.layerManager.loadForProjection("spilhaus");
    this.uiManager.initFilterEvents();
    this.timelineManager.initTimelineUI();
  }
}

class MapManager {
  constructor(app) {
    this.app = app;
    this.document = document;
    // DOM
    this.containerSpilhaus = "mapSpilhaus";
    this.containerWgs = "mapWgs";
    // projection const
    this.metersProjection = null;
    this.spilhausCRS = null;
    this.mapBounds = null;
    // map const
    this.mapSpilhaus = null;
    this.mapWgs = null;
    this.active = null; // 'spilhaus'|'wgs' // for _emitprojectionchange function
    this.activeCountry = null; // for _emitprojectionchange function
    // layer const
    this.spilhausTiles = null;
    this.spilhausCountryLayers = [];
    // setveiw
    this.spilhausStart = { center: [-1590000, -14000000], zoom: 2 };
    this.spilhausFocus = { center: [-100, -14000000], zoom: 2 };
    this.wgsDefaultZoom = 4;
    // country centroid
    this.countryCentroid = {
      // [lat, lon-20]
      Benin: [9.167515, -18.149943],
      Brazil: [-7.535994, -87.340427],
      Burkina_Faso: [11.726473, -25.308822],
      Cameroon: [5.810411, 0.63166],
      Gabon: [-0.65928, -9.265509],
      Ghana: [7.678434, -22.749734],
      Ivory_Coast: [7.448314, -25.57044],
      Mali: [18.191814, -15.811439],
      Mauritania: [19.845131, -30.86385],
      Mozambique: [-18.877222, 0.659506],
      Niger: [16.988293, -11.573399],
      Nigeria: [9.039145, 2.763425],
      Democratic_Republic_of_the_Congo: [-1.328403, -5.385447],
      Senegal: [14.781868, -17.375992],
      South_Africa: [-28.898819, -7.063372],
      Sudan: [16.210732, 8.558508],
      Chad: [15.828363, -2.61267],
      Togo: [8.481892, 1.057643],
      United_Kingdom: [54.091472, -23.224016],
      US: [41.59938, -125.308336],
      Zimbabwe: [-19.214896, 9.839996],
    };
    this.spilhausCountryFiles = [
      "Benin",
      "Brazil",
      "Burkina_Faso",
      "Cameroon",
      "Gabon",
      "Ghana",
      "Ivory_Coast",
      "Mali",
      "Mauritania",
      "Mozambique",
      "Niger",
      "Nigeria",
      "Democratic_Republic_of_the_Congo",
      "Senegal",
      "South_Africa",
      "Sudan",
      "Chad",
      "Togo",
      "United_Kingdom",
      "US",
      "Zimbabwe",
    ];
  }

  buildCRS() {
    const xOffset = 0; // 右移 20万
    const yOffset = 1300000; // 上移
    const minx = -16589673.7126 + xOffset;
    const miny = -16615682.2786 + yOffset;
    const maxx = 16881778.7724 + xOffset;
    const maxy = 16855770.2064 + yOffset;

    const resolutions = [
      191265.4427718493971, // z=0
      95632.72138592469855, // z=1
      47816.36069296234928, // z=2
      23908.18034648117464, // z=3
    ];

    this.metersProjection = {
      project: (latlng) => L.point(latlng.lng, latlng.lat), // [x,y] -> Point(x,y)
      unproject: (point) => L.latLng(point.y, point.x), // 反变换
      bounds: L.bounds(L.point(minx, miny), L.point(maxx, maxy)),
    };

    this.spilhausCRS = L.extend({}, L.CRS.Simple, {
      projection: this.metersProjection,
      transformation: new L.Transformation(1, -minx, -1, maxy),
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

    //this.mapBounds = L.latLngBounds([miny, minx], [maxy, maxx]);
  }

  createSpilhaus() {
    this._hide(this.containerWgs);
    this._show(this.containerSpilhaus);

    this.mapSpilhaus = L.map(this.containerSpilhaus, {
      crs: this.spilhausCRS,
      center: this.spilhausStart.center,
      zoom: this.spilhausStart.zoom,
      maxBounds: this.mapBounds,
      minZoom: 2,
      maxZoom: 2,
      scrollWheelZoom: "center",
      touchZoom: "center",
      doubleClickZoom: "center",
      zoomControl: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      boxZoom: false,
      keyboard: false,

      zoomSnap: 1,
      zoomDelta: 1,
      inertia: false,
    });

    //this.mapSpilhaus.fitBounds(this.mapBounds);

    // 调试：看看每级 “世界像素” 和瓦片数
    // this.mapSpilhaus.on("zoomend", () => {
    //   const z = this.mapSpilhaus.getZoom();
    //   const wb = this.spilhausCRS.getProjectedBounds(z).getSize();
    // console.log(
    //   `world px @z=${z}: ${wb.x} x ${wb.y}; tiles ≈ ${Math.ceil(
    //     wb.x / 256
    //   )} x ${Math.ceil(wb.y / 256)}`
    // );
    // });
  }

  addSpilhausTiles() {
    this.spilhausTiles = L.tileLayer("tileOcean10.29/{z}/{x}/{y}.png", {
      tms: true,
      tileSize: 256,
      minZoom: 2,
      maxZoom: 2,
      minNativeZoom: 2,
      maxNativeZoom: 2,
      noWrap: true,
      bounds: this.mapBounds,
      keepBuffer: 2,
    }).addTo(this.mapSpilhaus);
  }

  _ensureWgsCreated({ center = [0, 0], zoom = this.wgsDefaultZoom } = {}) {
    if (this.mapWgs) return;
    this.mapWgs = L.map(this.containerWgs, {
      center,
      zoom: Math.max(zoom, 4),
      minZoom: 2,
      maxZoom: 20,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      zoomSnap: 1,
      zoomControl: false,
      zoomAnimation: true,
      fadeAnimation: true,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}@2x.png",
      {
        tileSize: 512,
        zoomOffset: -1,
        minZoom: 2,
        maxZoom: 20,
        reuseTiles: true,
        keepBuffer: 6,
        updateWhenIdle: false,
        updateWhenZooming: false,
        detectRetina: true,
        attribution: "&copy; CARTO &copy; OpenStreetMap contributors",
      },
    ).addTo(this.mapWgs);
  }

  loadSpilhausCountries() {
    const polygonYOffset = 2000000;
    const polygonXOffset = 0;
    const style = {
      color: "#e4e5e7ff",
      weight: 0.7,
      fillColor: "#ffffffff",
      fillOpacity: 0,
      className: "glow-line",
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
          if (geojson.crs) delete geojson.crs;
          const polyLayer = new L.geoJSON(geojson, {
            coordsToLatLng: (c) =>
              L.latLng(c[1] - polygonYOffset, c[0] + polygonXOffset),
            style,
            interactive: true,
            onEachFeature: (feature, layer) => {
              const label = feature.properties.NAME;
              layer.on({
                mouseover: (e) => {
                  if (e.target.getTooltip()) {
                    e.target.closeTooltip();
                    e.target.unbindTooltip();
                  }
                  e.target.setStyle({ weight: 2, fillOpacity: 0 });
                  e.target.bringToFront();
                  e.target
                    .bindTooltip(label, {
                      permanent: false,
                      direction: "top",
                      className: "country-label",
                      offset: [0, -4],
                    })
                    .openTooltip();
                },
                mouseout: (e) => {
                  polyLayer.resetStyle(e.target);
                  if (e.target.getTooltip()) {
                    e.target.closeTooltip();
                    e.target.unbindTooltip();
                  }
                },
                click: () => {
                  this._switchToWgsUsingCentroid(key);
                  this.spilhausToDefault(); //取消所有的平移
                  this.app.uiManager.handleAreaInfoShift(key);
                  this.app.eventManager.rebindForProjection("wgs"); // add zoomhandler
                },
              });
            },
          }).addTo(this.mapSpilhaus);
          this.spilhausCountryLayers.push(polyLayer);
        })
        .catch((err) =>
          console.error(`[Spilhaus] GeoJSON load failed: ${key}`, err),
        );
    });
  }

  loadSpilhausPalace() {
    const polygonYOffset = 1990000;
    try {
      this.mapSpilhaus.createPane("pointPane");
      const pointPane = this.mapSpilhaus.getPane("pointPane");
      pointPane.style.zindex = 700;
      pointPane.style.pointerEvents = "none";
      const data = this.app.dataManager.geojson_spil;
      // console.log(data);
      const pointStyle = {
        radius: 1,
        fillColor: "#ffffff",
        fillOpacity: 0.9, // 内部白点保持亮
        color: "#0044d8ff",
        weight: 0.5,
        opacity: 0.3,
        className: "palace-spilhaus-point dream-star fade-point",
      };
      this.palaceSpil = L.geoJSON(data, {
        coordsToLatLng: (c) => L.latLng(c[1] - polygonYOffset, c[0]),
        pane: "pointPane",
        pointToLayer: (feature, latlng) => {
          return L.circleMarker(latlng, pointStyle);
        },
      }).addTo(this.mapSpilhaus);
    } catch (err) {
      console.error("Failed to load palace point spilhaus data", err);
    }
  }

  spilhausCenterSwitch() {
    const collapsedButton = this.document.querySelector(".triangle-left");
    const expandButton = this.document.querySelector(".triangle-right");
    const mapEl = this.mapSpilhaus.getContainer();
    // console.log(mapEl);
    // collaspe
    if (collapsedButton) {
      collapsedButton.addEventListener("click", () => {
        mapEl.classList.add("map-shifted-to-left");
      });
    }
    //expand
    if (expandButton) {
      expandButton.addEventListener("click", () => {
        this.spilhausToDefault();
      });
    }
  }

  spilhausToDefault() {
    const mapEl = this.mapSpilhaus.getContainer();
    const classList = mapEl.classList;
    if (classList.contains("map-shifted-to-left")) {
      classList.remove("map-shifted-to-left");
    }
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
          opts.zoom ?? this.spilhausStart.zoom,
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
        `[WGS] Missing centroid for ${countryKey}, fallback to [0,0].`,
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
      }),
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

class DataManager {
  // DataManager lifecycle:
  // - fetch once at app init
  // - shared across all projections and maps
  constructor(app) {
    this.app = app;
    this.geojson_wgs = []; // geojson data already
    this.geojson_spil = []; // geojson
    this.unique_country = [];
  }

  async fetchData() {
    //fetch geojson data for wgs palace
    try {
      const response_wgs = await fetch(
        "https://dreampalacemapapp.onrender.com/api/palaces_wgs.geojson",
      );
      this.geojson_wgs = await response_wgs.json();
    } catch (err) {
      console.log("Failed to fetch geojson_wgs data");
    }
    // fetch geojson data for spil (note: this data only have name and latlng)
    try {
      const response_spil = await fetch(
        "https://dreampalacemapapp.onrender.com/api/palaces_spil.geojson",
      );
      this.geojson_spil = await response_spil.json();
    } catch (err) {
      console.log("Failed to fetch geojson_spil data");
    }
  }

  // get combined filter data
  getCombinedFilters() {
    return {
      ...this.app.uiManager.getUIFilters(),
      ...this.app.timelineManager.getTimeFilters(),
    };
  }

  // filter original data
  filterData() {
    const filters = this.getCombinedFilters();

    return this.geojson_wgs.features.filter((f) => {
      const p = f.properties;
      const timeMatch_Creation =
        filters.yearChoose === "all" || p.Creation <= filters.yearChoose;
      const timeMatch_Closure =
        filters.yearChoose === "all" || p.Closure >= filters.yearChoose;
      const countryMatch =
        filters.country === "all" || p.Country === filters.country;
      const cityMatch = filters.city === "all" || p.City === filters.city;
      const conditionMatch =
        filters.condition === "all" || p.Condition === filters.condition;
      const typologyMatch =
        filters.typology === "all" || p.Typology === filters.typology;
      return (
        timeMatch_Creation &&
        timeMatch_Closure &&
        cityMatch &&
        countryMatch &&
        conditionMatch &&
        typologyMatch
      );
    });
  }
}

class LayerManager {
  constructor(app) {
    this.app = app;
    this._radioAbort = null;
    this.city_list = [];
    this.country_list = [];
    this.openStreetMap = null;
    this.city = null;
    this.world = null;
    this.empire = null;
    this.palace = null;
    this.originalData = null;
    this.filteredFeatures = null;

    window.addEventListener("projectionchange", (e) => {
      const mode = e.detail.projection;
      this.loadForProjection(mode);
    });

    window.addEventListener("yearFiltered", (e) => {
      const filtered = e.detail.filtered;
      console.log("LayerManager received filtered:", filtered.length);
      this.loadPalacePoints(filtered);
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
    window.dispatchEvent(
      new CustomEvent("projectionready", {
        detail: { projection: "wgs" },
      }),
    );
    this.initStyleRadioWatcher();
    // this.loadCityPolygon();
    // this.loadEmpirePolygon();
    this.loadCountryPolygon();
    this.app.wgsStateManager.handleZoomChange();
  }

  getMap() {
    return this.app.mapManager.getActiveMap();
  }

  getProj() {
    return this.app.mapManager.active;
  }

  _initPanesWGS() {
    //skip city for now
    const map = this.getMap();
    if (!map) return;
    if (!map.getPane("palacePane")) map.createPane("palacePane");
    // if (!map.getPane("cityPane")) map.createPane("cityPane");
    if (!map.getPane("countryPane")) map.createPane("countryPane");
    // if (!map.getPane("empirePane")) map.createPane("empirePane");
    map.getPane("palacePane").style.zIndex = 450;
    map.getPane("palacePane").style.pointerEvents = "none";
    // map.getPane("cityPane").style.zIndex = 400;
    // map.getPane("empirePane").style.zIndex = 300;
    map.getPane("countryPane").style.zIndex = 250;
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
  }

  // load original data (all year/ all data)
  // loadPalaceData() {
  //   console.log("DEBUG: loadPalaceData() START");
  //   try {
  //     this.originalData = this.app.dataManager.geojson_wgs;
  //     console.log("Original data loaded:", this.originalData);
  //     this.app.uiManager.populateDropdowns(this.originalData);
  //     console.log("populatedropdowns inits");
  //     this.loadPalacePoints();
  //   } catch (err) {
  //     console.error("Failed to load palace data", err);
  //   }
  // }

  //render layer
  renderPalaceLayer(filteredFeatures) {
    // render points
    const map = this.getMap();
    if (!map) return;

    //clean old layer
    if (this.palace) {
      map.removeLayer(this.palace);
    }
    // add new layer
    this.palace = L.geoJSON(
      { type: "FeatureCollection", features: filteredFeatures },
      { pointToLayer: this.getPointStyleFunction() },
    ).addTo(map);
  }

  // update map
  loadPalacePoints() {
    const map = this.getMap();
    const proj = this.getProj();
    if (proj !== "wgs") {
      // console.log("Skip loadPalacePoints(): not WGS");
      return;
    }
    if (!map) {
      console.warn("Map not ready yet, skip loadPalacePoints()");
      return;
    }

    if (this.palace) {
      map.removeLayer(this.palace);
    }

    const filteredFeatures = this.app.dataManager.filterData();
    this.renderPalaceLayer(filteredFeatures);
  }

  initStyleRadioWatcher() {
    if (this._radioAbort) this._radioAbort.abort();
    this._radioAbort = new AbortController();
    const sig = this._radioAbort.signal;

    document.querySelectorAll('input[name="choosestyle"]').forEach((radio) => {
      radio.addEventListener(
        "change",
        () => {
          // console.log("选项变化，重新加载图层");
          this.renderPalaceLayer(); // 每次根据 getPointStyleFunction 重新加载
        },
        { signal: sig },
      );
    });
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

  getRadiusByZoom(zoom) {
    if (zoom <= 2) return 1.7;
    if (zoom === 3) return 3;
    if (zoom === 4) return 4.5;
    if (zoom === 5) return 6;
    return 8;
  }

  updatePalaceMarkerSize() {
    const zoom = this.app.wgsStateManager.getZoomLevel();
    const radius = this.getRadiusByZoom(zoom);
    this.app.mapManager.mapWgs.eachLayer((layer) => {
      if (
        layer instanceof L.CircleMarker &&
        layer.options.pane === "palacePane"
      ) {
        layer.setRadius(radius);
      }
    });
  }

  pointStyle1(feature, latlng) {
    const attr = feature.properties;
    const status = attr["Condition"];
    const zoom = this.app.mapManager.mapWgs.getZoom();
    const radius = this.getRadiusByZoom(zoom);
    const marker = L.circleMarker(latlng, {
      className: "palace-marker",
      radius: radius,
      fillOpacity: 0.9,
      opacity: 0.6,
      weight: 0.7,
      fillColor: status === "Still Standing" ? "#4f9cfb" : "#4f9cfb",
      color: status === "Still Standing" ? "#f4f2f2ff" : "#ffffffff",
      pane: "palacePane",
    });

    marker.on("click", () => {
      const message = this.app.uiManager.generatePointMsg(attr);
      this.app.uiManager.initSideBar(); // in case it's collapsed
      // handel when dataquery is shown
      const el = document.querySelector("#data_container");
      const isHidden = el && window.getComputedStyle(el).display === "none";
      //console.log("是否隐藏：", isHidden);
      if (!isHidden) this.app.uiManager.showElement("#data_query_window");
      this.app.uiManager.handleAboutPalaceClick();
      document.querySelector("#data_query_window").innerHTML = message;
      this.app.uiManager.enableCarouselInSidebar();
      console.log("carsouldconnect init");
      // can add setview but it's too much move
      // const location = latlng;
      // this.app.mapManager.setView(location, 8);
    });
    return marker;
  }

  // this func is not used - if want to add choose from data has specific location or not.
  pointStyle2(feature, latlng) {
    const attr = feature.properties;
    const status = attr["Address"];
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
      className: "palace-marker",
      radius,
      opacity,
      weight,
      fillColor: fill_color,
      color: inner_color,
      fillOpacity: fill_opacity,
      pane: "palacePane",
    });

    marker.on("click", () => {
      const message = this.app.uiManager.generatePointMsg(attr); // should return html code
      this.app.uiManager.initSideBar(); // in case it's collapsed
      // handel when dataquery is shown
      const el = document.querySelector("#data_container");
      const isHidden = el && window.getComputedStyle(el).display === "none";
      //console.log("是否隐藏：", isHidden);
      if (!isHidden) this.app.uiManager.showElement("#data_query_window");
      this.app.uiManager.handleAboutPalaceClick();
      document.querySelector("#data_query_window").innerHTML = message;
      this.app.uiManager.enableCarouselInSidebar();
      // can add setview but it's too much move
      // const location = latlng;
      // this.app.mapManager.setView(location, 8);
    });
    return marker;
  }

  //暂时停止city polygon 展示
  // loadCityPolygon() {
  //   const map = this.getMap();
  //   if (!map) return;
  //   this.city = new L.GeoJSON.AJAX("assets/citylayer7.30.geojson", {
  //     pane: "cityPane",
  //     style: () => ({
  //       color: "gray",
  //       weight: 0,
  //       opacity: 1,
  //       fillOpacity: 0,
  //     }),
  //     onEachFeature: (feature, layer) => {
  //       this.city_list.push({
  //         name: feature.properties.city,
  //         layer,
  //         bounds: layer.getBounds(),
  //       });

  //       layer.on("mouseover", () => {
  //         layer.setStyle({ weight: 1.3 });
  //       });

  //       layer.on("mouseout", () => {
  //         layer.setStyle({ weight: 0 });
  //       });
  //     },
  //   }).addTo(map);
  // }

  // async loadEmpirePolygon() {
  // don't delete in case need it
  //   const map = this.getMap();
  //   if (!map) return;
  //   try {
  //     const response = await fetch("assets/empire.geojson");
  //     const data = await response.json();
  //     this.empire = L.geoJSON(data, {
  //       pane: "empirePane",
  //       style: (feature) => {
  //         const name = feature.properties.NAME;
  //         let fillColor = "#ffffffff"; // 默认颜色（灰色）

  //         if (name === "French") {
  //           fillColor = "#EAC170";
  //         } else if (name === "British") {
  //           fillColor = "#D5E2EC";
  //         } else if (name === "Portugal") {
  //           fillColor = "#EAC170";
  //         }

  //         return {
  //           color: fillColor, // 边界线颜色
  //           weight: 1.5, // 边界线宽度
  //           opacity: 0.4,
  //           // fillColor: fillColor, // 填充色
  //           // fillOpacity: 0.4,
  //           fill: false,
  //         };
  //       },
  //       onEachFeature: (feature, layer) => {
  //         const name = feature.properties.NAME;
  //         // 绑定弹窗，显示 NAME
  //         layer.bindPopup(`<b>${name}</b>`);
  //       },
  //     }).addTo(map);
  //   } catch (err) {
  //     console.error("Failed to load empire polygon:", err);
  //   }
  // }

  async loadCountryPolygon() {
    const map = this.getMap();
    if (!map) return;
    const country_array = [
      "Benin",
      "Brazil",
      "Burkina Faso",
      "Cameroon",
      "Chad",
      "Democratic Republic of the Congo",
      "Gabon",
      "Ghana",
      "Ivory Coast",
      "Mali",
      "Mauritania",
      "Mozambique",
      "Niger",
      "Nigeria",
      "Senegal",
      "South Africa",
      "Sudan",
      "Togo",
      "United Kingdom",
      "United States of America",
    ];
    try {
      const response = await fetch("assets/selectedcountryWGS.geojson");
      const data = await response.json();
      this.country = L.geoJSON(data, {
        pane: "countryPane",
        style: (feature) => {
          return {
            color: "#e0e0e0",
            weight: 0.6,
            opacity: 0.3,
            fillColor: "white",
            fillOpacity: 0,
          };
        },
        onEachFeature: (feature, layer) => {
          const name = feature.properties.NAME;
          if (country_array.includes(name)) {
            layer.on({
              mouseover: (e) => {
                e.target.setStyle({
                  color: "#fdfdfdff",
                  weight: 2.5,
                  fillColor: "#062244ff",
                  fillOpacity: 0,
                });
                if (e.target._path) {
                  e.target._path.style.cursor = "default"; // 强制改 cursor
                }
                e.target.bringToFront();
              },
              mouseout: (e) => {
                const to = e.originalEvent.relatedTarget;
                if (to && to.closest(".palace-marker")) {
                  return;
                }
                this.country.resetStyle(e.target);
              },
            });
          } else {
            layer.on({
              mouseover: (e) => {
                if (e.target._path) {
                  e.target._path.style.cursor = "default"; // 强制改 cursor
                }
              },
            });
          }
        },
      }).addTo(map);
    } catch (err) {
      console.error("Failed to load country boundary layer", err);
    }
  }
}

class UIManager {
  constructor(app) {
    this.app = app;
    this.sidebar = null;
    this._eventsAbort = null;
    this.projection = null;
    this.areaInfo = {};
    window.addEventListener("projectionchange", (e) => {
      this.projection = e.detail.projection;
      this.initSideBar();
      this.loadAreaInfo();
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
    this.handleProjectionUI();
    this.initSidebarEvents();
    this.backtoocean();
  }

  showElement(selector) {
    document.querySelector(selector).style.display = "block";
  }

  showElementFlex(selector) {
    document.querySelector(selector).style.display = "flex";
  }

  hideElement(selector) {
    document.querySelector(selector).style.display = "none";
  }

  handleProjectionUI() {
    if (this.projection === "spilhaus") {
      this.showElement("#spilhaus_sidebar");
      this.hideElement("#wgs_sidebar");
    }
    if (this.projection === "wgs") {
      this.hideElement("#spilhaus_sidebar");
      this.showElementFlex("#wgs_sidebar");
    }
  }

  loadAreaInfo() {
    fetch("assets/area_info.json")
      .then((res) => res.json())
      .then((data) => {
        this.area_info = data;
      })
      .catch((err) => console.error("Failed to load area info", err));
  }

  handleAreaInfoShift(key) {
    const info = this.area_info[key];
    if (!info) {
      console.warn("No area info founded for country:", key);
    }

    let imageHTML = "";
    if (info.image && info.image.length > 0) {
      imageHTML = info.image
        .map((src) => `<img src="${src}" class="country-image">`)
        .join("");
    }

    document.querySelector("#area_info").innerHTML = `
    <h3>${info.title}</h3>
    <p>${info.description}</p>
    <div class="image-container">
    </div>
    `;
  }

  // buttons
  handleAboutAreaClick() {
    document.querySelector("#about_area").textContent = "About Area +";
    document.querySelector("#about_palace").textContent = "About Palace -";
    this.hideElement("#spilhaus_sidebar");
    this.showElementFlex("#wgs_sidebar");
    this.showElement("#area_info");
    this.hideElement("#data_query_window");
  }

  handleAboutPalaceClick() {
    document.querySelector("#about_area").textContent = "About Area -";
    document.querySelector("#about_palace").textContent = "About Palace +";
    this.hideElement("#spilhaus_sidebar");
    this.showElementFlex("#wgs_sidebar");
    this.hideElement("#area_info");
    this.showElement("#data_query_window");
  }

  initSidebarEvents() {
    if (this._eventsAbort) this._eventsAbort.abort();
    this._eventsAbort = new AbortController();
    const sig = this._eventsAbort.signal;

    this.showElement("#area_info");
    this.hideElement("#data_query_window");
    document
      .querySelector("#about_area")
      .addEventListener("click", this.handleAboutAreaClick.bind(this), {
        signal: sig,
      });
    document
      .querySelector("#about_palace")
      .addEventListener("click", this.handleAboutPalaceClick.bind(this), {
        signal: sig,
      });
  }

  // filter event
  initFilterEvents() {
    this.originalData = this.app.dataManager.geojson_wgs;
    this.app.uiManager.populateDropdowns(this.originalData);
    //when filter changes
    const ids = [
      "filter-country",
      "filter-city",
      "filter-condition",
      "filter-typology",
    ];

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("change", () => {
          this.app.layerManager.loadPalacePoints();
        });
      }
    });

    const cleanBtn = document.getElementById("btn-clean-filter");
    if (cleanBtn) {
      cleanBtn.addEventListener("click", () => {
        this.resetFilter();
        this.app.layerManager.loadPalacePoints();
      });
    }
  }

  resetFilter() {
    const ids = ["filter-country", "filter-condition", "filter-typology"];

    ids.forEach((id) => {
      const sel = document.getElementById(id);
      if (sel) sel.selectedIndex = 0;
    });

    document.getElementById("filter-city").classList.add("inactive");
    document.getElementById("filter-city").selectedIndex = 0;
  }

  populateDropdowns(geojson) {
    const features = geojson.features;
    // set country and it's own cities
    const countryCityMap = {};
    for (const f of features) {
      const prop = f.properties;
      const country = prop.Country;
      const city = prop.City;
      if (!country) continue;

      if (!countryCityMap[country]) {
        countryCityMap[country] = new Set();
      }
      if (Array.isArray(city)) {
        city.forEach((c) => c && countryCityMap[country].add(c));
      } else {
        countryCityMap[country].add(city);
      }
    }

    // all countries
    const countries = Object.keys(countryCityMap).sort();

    // condition & typology filter selector
    const unique = (field) => {
      const values = features.flatMap((f) => {
        const v = f.properties[field];
        if (Array.isArray(v)) return v.filter(Boolean);
        return v ? [v] : [];
      });
      const cleaned = [...new Set(values)].sort();
      return cleaned;
    };
    const conditions = unique("Condition");
    const typologies = unique("Typology");

    // drop down menu
    fill("filter-country", countries);
    fill("filter-city", []);
    fill("filter-condition", conditions);
    fill("filter-typology", typologies);

    document
      .getElementById("filter-country")
      .addEventListener("change", (e) => {
        const selectedCountry = e.target.value;
        const cities = selectedCountry
          ? [...countryCityMap[selectedCountry]]
              .filter((c) => c && c !== "undefined" && c !== "null")
              .sort()
          : [];
        document.getElementById("filter-city").classList.remove("inactive");
        fill("filter-city", cities);
      });

    function fill(id, items) {
      const sel = document.getElementById(id);
      if (!sel) return;

      sel.innerHTML =
        `
      <option value="" disabled selected>${id.replace("filter-", "")}</option>
    ` + items.map((i) => `<option value="${i}">${i}</option>`).join("");
    }
  }

  getUIFilters() {
    return {
      country: document.getElementById("filter-country")?.value || "all",
      city: document.getElementById("filter-city")?.value || "all",
      condition: document.getElementById("filter-condition")?.value || "all",
      typology: document.getElementById("filter-typology")?.value || "all",
    };
  }

  // generate palace info
  parseCommaLinks(value) {
    // in case there are many pic links
    if (!value) return [];
    return String(value)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  driveLinkToImage(shareUrl) {
    const m = shareUrl.match(/\/file\/d\/([^/]+)/);
    if (!m) throw new Error("Not a google drive file share link");
    const fileId = m[1];
    return `https://lh3.googleusercontent.com/d/${fileId}=w1200`;
  }

  generatePointMsg(data) {
    const raw = (data["Image Links"] || "").trim();
    const shareUrls = this.parseCommaLinks(raw);
    let imageUrls = []; // save all image urls
    for (const u of shareUrls) {
      try {
        imageUrls.push(this.driveLinkToImage(u));
      } catch (e) {
        console.warn("invalid image link:", u);
      }
    }
    const safeId = String(data.airtable_id || data.Name || "item").replace(
      /\W+/g,
      "_",
    );
    const hasImages = imageUrls.length > 0;
    const first = hasImages ? imageUrls[0] : "";
    const dotsHtml = //create dots msg
      imageUrls.length > 1
        ? `<div class="dots" data-target="${safeId}">
          ${imageUrls
            .map(
              (_, i) =>
                `<button class="dot${
                  i === 0 ? " active" : ""
                }" data-idx="${i}" aria-label="image ${i + 1}"></button>`,
            )
            .join("")}
        </div>`
        : "";

    const imageHtml = hasImages
      ? `
        <div class="carousel" data-carousel="${safeId}" data-images='${JSON.stringify(
          imageUrls,
        )}'>
        <button class="carousel-arrow left" data-dir="prev" data-carousel="${safeId}">&#10094;</button>
        <div class="img-wrapper">
        <img
            class = "img"
            id="palace_img_${safeId}"
            src="${first}"
            alt="image"
            style="display:block; height:auto;"
          />
          </div>
          <button class="carousel-arrow right" data-dir="next" data-carousel="${safeId}">&#10095;</button>
          ${dotsHtml}
        </div>
      `
      : `<span class="no-image">/</span>`;

    return `
    <h3> ${data.Name || ""} </h3>
    <h4> ${data.City || ""},&nbsp; ${data.Country}</h4>
    <h5> ${data["Creation"] || "/"} - ${data["Closure"] || "/"} </h5>
    <p> ${data.Condition || ""} </p>
    <div class="image-container">
      ${imageHtml}
    </div>
    <p > ${data["Website description"] || ""} </p>
    <p > ${data.Notes || ""} </p>
    <p > ${data["Additional resources"] || ""} </p>
    `;
  }

  enableCarouselInSidebar() {
    const root = document.querySelector("#data_query_window");
    if (!root) {
      return;
    }
    if (root.__carouselBound) {
      return;
    }

    root.addEventListener("click", (e) => {
      //DOTS
      const dot = e.target.closest(".dot");
      if (dot) {
        const idx = Number(dot.dataset.idx);
        const carouselKey = dot.closest(".dots").dataset.target;
        this.switchCarouselImage(root, carouselKey, idx);
        return;
      }

      // ARROW
      const arrow = e.target.closest(".carousel-arrow");
      if (arrow) {
        const dir = arrow.dataset.dir;
        const carouselKey = arrow.dataset.carousel;
        this.shiftCarouselImage(root, carouselKey, dir);
      }
    });
  }

  switchCarouselImage(root, key, idx) {
    // helper for dots to switch image
    const carousel = root.querySelector(`.carousel[data-carousel="${key}"]`);
    if (!carousel) return;
    const images = JSON.parse(carousel.dataset.images || "[]");
    if (!images[idx]) return;
    const img = carousel.querySelector(".img");
    img.src = images[idx];

    // update dots
    const dots = carousel.querySelectorAll(".dot");
    dots.forEach((d) => d.classList.remove("active"));
    const activeDot = carousel.querySelector(`.dot[data-idx="${idx}"]`);
    if (activeDot) activeDot.classList.add("active");
  }

  shiftCarouselImage(root, key, dir) {
    //helper to shft picture
    //find carousel
    const carousel = root.querySelector(`.carousel[data-carousel="${key}"]`);
    if (!carousel) return;
    // get images
    const images = JSON.parse(carousel.dataset.images || "[]");
    if (images.length === 0) return;
    const img = carousel.querySelector(".img");
    //current imgage
    const currentIdx = images.indexOf(img.src);
    let nextIdx = currentIdx;
    if (dir === "next") nextIdx = (currentIdx + 1) % images.length;
    else if (dir === "prev")
      nextIdx = (currentIdx - 1 + images.length) % images.length;
    //shift image
    img.src = images[nextIdx];
    // update dots
    const dots = carousel.querySelectorAll(".dot");
    dots.forEach((d) => d.classList.remove("active"));
    const activateDot = carousel.querySelector(`.dot[data-idx="${nextIdx}"]`);
    if (activateDot) activateDot.classList.add("active");
  }

  // back to ocean bottom
  backtoocean() {
    const el = document.querySelector("#back");
    if (!el) return;
    el.addEventListener("click", (e) => {
      e.preventDefault();
      this.app.mapManager.activate(
        "spilhaus",
        this.app.mapManager.spilhausStart,
      );
    });
  }
}

class SearchManager {
  constructor(app) {
    this.app = app;
    this.poliLayer = null;
    this.searchControl = null;

    window.addEventListener("projectionready", (e) => {
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
    const layers = [
      this.app.layerManager.empire,
      // this.app.layerManager.city,
      // this.app.layerManager.world,
    ].filter(Boolean);

    this.poliLayer = L.featureGroup(layers);

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
    this.zoomControl = null;

    window.addEventListener("projectionready", (e) => {
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

    if (this.zoomControl) {
      const map = this.getMap();
      if (map)
        try {
          map.removeControl(this.zoomControl);
        } catch {}
      this.zoomControl = null;
    }

    // 仅在 WGS 下挂载这些控件
    if (mode === "wgs") {
      this.attachZoomHandler();
    }
  }

  //stop layer controler

  // attachLayerControl() {
  //   const map = this.getMap();
  //   if (!map) return;
  //   const baseLayers = {
  //     "Open Street Basemap": this.app.layerManager.openStreetMap,
  //   };
  //   const overLays = {
  //     "City Boundary": this.app.layerManager.city,
  //     "Country Boundary": this.app.layerManager.world,
  //     "Empire Boundary": this.app.layerManager.empire,
  //   };
  //   const sanitizedOverlays = Object.fromEntries(
  //     Object.entries(overLays).filter(([k, v]) => v)
  //   );
  //   this.layersControl = L.control
  //     .layers(baseLayers, sanitizedOverlays)
  //     .addTo(map);
  // }

  //暂时没有Zoom改变的问题
  attachZoomHandler() {
    const map = this.getMap();
    if (!map) return;
    this.zoomControl = L.control.zoom({ position: "topright" }).addTo(map);
    // map.on("zoomend", () => {
    //   this.app.uiManager.updateSidebarByZoom();
    // });
  }

  // suspend draw button function
  // attachDrawButtons() {
  //   const map = this.getMap();
  //   if (!map || !map.pm) return;
  //   map.pm.addControls({
  //     position: "topright",
  //     drawMarker: true,
  //     drawCircleMarker: false,
  //     drawPolyline: false,
  //     drawRectangle: false,
  //     drawCircle: false,
  //     drawPolygon: false,
  //     drawText: false,
  //     editMode: true,
  //     dragMode: true,
  //     cutPolygon: false,
  //     removalMode: true,
  //     oneBlock: false,
  //     rotateMode: false,
  //     drawControls: true,
  //     editControls: true,
  //     editMode: false,
  //   });
  // }
}

class TimelineManager {
  constructor(app) {
    this.app = app;
    this.year = null;
    this.geojsondata = null;
    this.filtered = null;

    // Bind methods so event listeners keep correct "this"
    this.initTimelineUI = this.initTimelineUI.bind(this);
    this.removeTimelineUI = this.removeTimelineUI.bind(this);
    this.onYearChange = this.onYearChange.bind(this);
  }

  getMap() {
    return this.app.mapManager.getActiveMap();
  }

  initTimelineUI() {
    document.getElementById("time-control").style.display = "flex";
    const slider = document.getElementById("timeSlider");
    const yearDisplay = document.getElementById("year-display");

    if (!slider || !yearDisplay) {
      console.warn("Timeline UI elements not found!");
      return;
    }
    this.boundOnYearChange = this.onYearChange.bind(this);
    slider.addEventListener("input", this.boundOnYearChange);

    // default: all
    slider.value = 2026;
    this.year = null;
    yearDisplay.textContent = "Year: All";
  }

  removeTimelineUI() {
    document.getElementById("time-control").style.display = "none";

    // remove slider listerner if exists
    const slider = document.getElementById("timeSlider");
    if (slider && this.boundOnYearChange) {
      slider.removeEventListener("input", this.boundOnYearChange);
    }
    this.year = null;
  }

  // When user moves slider
  onYearChange(e) {
    const value = Number(e.target.value);
    // update ui
    const yearDisplay = document.getElementById("year-display");

    // special case: value = 2026 is all years
    if (value === 2026) {
      this.year = "all";
      yearDisplay.textContent = "Year: All";
    } else {
      this.year = value;
      yearDisplay.textContent = `Year: ${value}`;
    }
    // inform layermanager
    this.app.layerManager.loadPalacePoints();
  }

  getTimeFilters() {
    return {
      yearChoose: this.year ? this.year : "all",
    };
  }
}

class WgsStateManager {
  constructor(app) {
    this.app = app;
    this.current_zoom = null;
    this.current_center = null;
    this.current_country = null;
  }
  getZoomLevel() {
    this.current_zoom = this.app.mapManager.mapWgs.getZoom();
    console.log(this.current_zoom);
    return this.current_zoom;
  }

  handleZoomChange() {
    this.app.mapManager.mapWgs.on("zoomend", () => {
      this.getZoomLevel();
      this.app.layerManager.updatePalaceMarkerSize();
    });
  }
  getCenterPoint() {
    this.current_center = this.app.mapManager.mapWgs.getCenter();
    console.log(this.current_center);
  }

  getCurrentCountry() {
    this.current_country = this.app.mapManager.activeCountry;
  }
}

// run the script
const app = new WebMapApp();
app.initialize();
