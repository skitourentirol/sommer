/* A TOUR A DAY Summer */


let innsbruck = {
    lat: 47.267222,
    lng: 11.392778,
    zoom: 9
};

// WMTS Hintergrundlayer der eGrundkarte Tirol definieren
const eGrundkarteTirol = {
    sommer: L.tileLayer(
        "http://wmts.kartetirol.at/gdi_summer/{z}/{x}/{y}.png", {
            attribution: `Datenquelle: <a href="https://www.data.gv.at/katalog/dataset/land-tirol_elektronischekartetirol">eGrundkarte Tirol</a>`
        }
    ),
    ortho: L.tileLayer(
        "http://wmts.kartetirol.at/gdi_ortho/{z}/{x}/{y}.png", {
            attribution: `Datenquelle: <a href="https://www.data.gv.at/katalog/dataset/land-tirol_elektronischekartetirol">eGrundkarte Tirol</a>`
        }
    ),
    nomenklatur: L.tileLayer(
        "http://wmts.kartetirol.at/gdi_nomenklatur/{z}/{x}/{y}.png", {
            attribution: `Datenquelle: <a href="https://www.data.gv.at/katalog/dataset/land-tirol_elektronischekartetirol">eGrundkarte Tirol</a>`,
            pane: "overlayPane",
        }
    )
}

// eGrundkarte Tirol Sommer als Startlayer
let startLayer = eGrundkarteTirol.sommer;
// Overlays Objekt für die thematischen Layer
let overlays = {
    stations: L.featureGroup(),
    temperature: L.featureGroup(),
    humidity: L.featureGroup(),
    snowheight: L.featureGroup(),
    wind: L.featureGroup(),
    gpx: L.featureGroup(),
    
};

// Karte initialisieren
let map = L.map("map", {
    center: [innsbruck.lat, innsbruck.lng],
    zoom: innsbruck.zoom,
    layers: [
        startLayer
    ],
});

// Layer control mit WMTS Hintergründen und Overlays
let layerControl = L.control.layers({
    "eGrundkarte Tirol Sommer": startLayer,
    "eGrundkarte Tirol Orthofoto": eGrundkarteTirol.ortho,
    "eGrundkarte Tirol Orthofoto mit Beschriftung": L.layerGroup([
        eGrundkarteTirol.ortho,
        eGrundkarteTirol.nomenklatur,
    ])
}, {
    "Wetterstationen": overlays.stations,
    "Temperatur": overlays.temperature,
    "Relative Luftfeuchtigkeit": overlays.humidity,
    "Schneehöhe": overlays.snowheight,
    "Wind": overlays.wind,
    "Radrouten": overlays.gpx,
}).addTo(map);


// Layer control ausklappen
layerControl.expand();

// Maßstab control
L.control.scale({
    imperial: false
}).addTo(map);

// Minimap
var osm2 = new L.TileLayer("http://wmts.kartetirol.at/gdi_summer/{z}/{x}/{y}.png",{minZoom: 6, maxZoom:7, attribution: "https://www.data.gv.at/katalog/dataset/land-tirol_elektronischekartetirol"});
var miniMap = new L.Control.MiniMap(osm2).addTo(map);


// Fullscreen control
L.control.fullscreen().addTo(map);

// Diese Layer beim Laden anzeigen 
overlays.gpx.addTo(map);

// Farben nach Wert und Schwellen ermitteln
let getColor = function(value,ramp) {
    for (let rule of ramp) {
        if (value >= rule.min && value < rule.max)
        return rule.color; 
    }
};


// Almen anzeigen 
async function loadHuts(url) {
    let response = await fetch(url);
    let geojson = await response.json(); 
    let overlay = L.markerClusterGroup();
    layerControl.addOverlay(overlay,"Almen");
    overlay.addTo(map);

    L.geoJSON(geojson,{
        pointToLayer: function(geoJsonPoint,latlng){
            let popup = `
                <strong>${geoJsonPoint.properties.NAME}</strong>
            `;

            return L.marker(latlng, {
                icon: L.icon({
                    iconUrl: "icons/almen.png",
                    iconAnchor: [16,37],
                    popupAnchor: [0,-37]
                })
            }).bindPopup(popup); 
        }
    }).addTo(overlay);
}
loadHuts("https://opendata.arcgis.com/datasets/cd1b86196f2e4f14aeae79269433a499_0.geojson");


// Radrouten Tirol Anzeigen Geojson
async function loadTracks(url) {
    let response = await fetch(url);
    let geojson = await response.json(); 
    console.log(geojson);
    let overlay = L.featureGroup();
    layerControl.addOverlay(overlay,"Bikerouten");
    overlay.addTo(map);

    L.geoJSON(geojson, {
        style: function(feature) {
            let colors = {
                "schwierig" : "#FF4136",
                "mittelschwierig": "#0074D9", 
                "leicht": "#2ECC40",
            };
            return {
                color: `${colors[feature.properties.SCHWIERIGKEITSGRAD]}`,
                weight: 4,
                dashArray: [10, 6]
            } 
        }
    }).bindPopup(function (layer) {
        return `
            <h4>${layer.feature.properties.ROUTENNAME} (${layer.feature.properties.ROUTEN_TYP}) </h4>
            
            von: ${layer.feature.properties.ROUTENSTART}<br>
            nach: ${layer.feature.properties.ROUTENZIEL}<br>
            <p> ${layer.feature.properties.ROUTENBESCHREIBUNG}</p>
            <p><li> StreckenLänge: ${layer.feature.properties.LAENGE_HAUPTROUTE_KM} km</li>
            <li> Fahrzeit: ${layer.feature.properties.FAHRZEIT}</li>
            <li> Hoehenmeter bergauf: ${layer.feature.properties.HM_BERGAUF} m</li>
            <li> Hoehenmeter bergab: ${layer.feature.properties.HM_BERGAB} m</li></p>
        `;
    
    }).addTo(overlay);
}
loadTracks("https://data-tiris.opendata.arcgis.com/datasets/tiris::radrouten-tirol.geojson");



// Station
let drawStation = function(geojson) {
    // Wetterstationen mit Icons und Popups implementieren
    L.geoJson(geojson, {
        pointToLayer: function(geoJsonPoint, latlng) {
            let popup = `
                <strong>${geoJsonPoint.properties.name}<br></strong>
                Lufttemperatur (°C): ${geoJsonPoint.properties.LT}<br>
                Windgeschwindigeit (km/h): ${geoJsonPoint.properties.WG}<br>
                Windrichtung (°): ${geoJsonPoint.properties.WR}<br>
                Schneehöhe (cm): ${geoJsonPoint.properties.HS}<br>
                Relative Luftfeuchtigkeit (%): ${geoJsonPoint.properties.RH}<br>
                (${geoJsonPoint.geometry.coordinates[2]} m ü.d.M.)Wetterverlaufsgrafik
                <a href="https://wiski.tirol.gv.at/lawine/grafiken/1100/standard/dreitage/${geoJsonPoint.properties.plot}.png">Wetterverlaufsgrafik</a>
            `;
            return L.marker(latlng, {
                icon: L.icon({
                    iconUrl: `/icons/station.png`,
                    iconAnchor: [16, 37],
                    popupAnchor: [0, -37]
                })
            }).bindPopup(popup);
        }
    }).addTo(overlays.stations);

}



//Temperatur 
let drawTemperature = function(geojson) {
    // Wetterstationen mit Icons und Popups implementieren
    L.geoJson(geojson, {
        filter: function(geoJsonPoint){
            if (geoJsonPoint.properties.LT > -50 && geoJsonPoint.properties.LT < 50){
                return true;
            }

        },
        pointToLayer: function(geoJsonPoint, latlng) {
            let popup = `
                <strong>${geoJsonPoint.properties.name}</strong><br>
                (${geoJsonPoint.geometry.coordinates[2]} m ü.d.M.)
            `;
            let color = getColor(
                geoJsonPoint.properties.LT,
                COLORS.temperature
            );
        

            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon",
                    html:`<span style="background-color:${color}">${geoJsonPoint.properties.LT.toFixed(1)}</span>`
                })
            }).bindPopup(popup);
        }
    }).addTo(overlays.temperature);

}


// Schneehöhen 
let drawSnowheight = function (geojson){
    L.geoJson(geojson, {
        filter: function(geoJsonPoint){
            if (geoJsonPoint.properties.HS >= 0 && geoJsonPoint.properties.HS < 1500){
                return true;
            }

        },
        pointToLayer: function(geoJsonPoint, latlng) {
            let popup = `
                <strong>${geoJsonPoint.properties.name}</strong><br>
                (${geoJsonPoint.geometry.coordinates[2]} m ü.d.M.)
            `;
            let color = getColor(
                geoJsonPoint.properties.HS,
                COLORS.snowheight
            );
        

            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon",
                    html:`<span style="background-color:${color}">${geoJsonPoint.properties.HS.toFixed(0)}</span>`
                })
            }).bindPopup(popup);
        }
    }).addTo(overlays.snowheight);

}

// Windgeschwindigkeit
let drawWindspeed = function (geojson){
    L.geoJson(geojson, {
        filter: function(geoJsonPoint){
            if (geoJsonPoint.properties.WG >= 0 && geoJsonPoint.properties.WG < 300 && geoJsonPoint.properties.WR >= 0 && geoJsonPoint.properties.WR <= 360){
                return true;
            }

        },
        pointToLayer: function(geoJsonPoint, latlng) {
            let popup = `
                <strong>${geoJsonPoint.properties.name}</strong><br>
                (${geoJsonPoint.geometry.coordinates[2]} m ü.d.M.)
            `;
            let color = getColor(
                geoJsonPoint.properties.WG,
                COLORS.windspeed
            );

            let deg = geoJsonPoint.properties.WR;
            // console.log(deg)

        

            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon",
                    html:`<span style="background-color:${color};
                    transform: rotate(${deg}deg)"><i class="fa-solid fa-circle-arrow-up"></i>${geoJsonPoint.properties.WG.toFixed(0)}</span>`
                })
            }).bindPopup(popup);
        }
    }).addTo(overlays.wind);

}


// Relative Luftfeuchte
let drawHumidity = function (geojson){
    L.geoJson(geojson, {
        filter: function(geoJsonPoint){
            if (geoJsonPoint.properties.RH >= 0 && geoJsonPoint.properties.RH < 100){
                return true;
            }

        },
        pointToLayer: function(geoJsonPoint, latlng) {
            let popup = `
                <strong>${geoJsonPoint.properties.name}</strong><br>
                (${geoJsonPoint.geometry.coordinates[2]} m ü.d.M.)
            `;
            let color = getColor(
                geoJsonPoint.properties.RH,
                COLORS.humidity
            );

            let deg = geoJsonPoint.properties.RH;
            // console.log(deg)

        

            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon",
                    html:`<span style="background-color:${color}">${geoJsonPoint.properties.RH.toFixed(0)}</span>`
                })
            }).bindPopup(popup);
        }
    }).addTo(overlays.humidity);

}


// Wetterstationen
async function loadData(url) {
    let response = await fetch(url);
    let geojson = await response.json();
    geojson.innerHTML; 
    drawStation(geojson);
    drawTemperature(geojson);
    drawSnowheight(geojson);
    drawWindspeed(geojson);
    drawHumidity(geojson);

    
}
loadData("https://static.avalanche.report/weather_stations/stations.geojson");

// Generate Random Number 
let randomNumber = Math.floor(Math.random() * 760);
let strRandom = randomNumber.toString();

// Generate path with RandomNumber
const path = "./data/Radtouren/"
const endPath = ".gpx"
const str1 = path.concat(strRandom)
let str = str1 + endPath

// GPX Track Layer implementieren with random Track
let gpxTrack = new L.GPX(str, {
    async: true,
    marker_options: {
        startIconUrl:"icons/start.png",
        endIconUrl: "icons/finish.png",
        shadowUrl: null,
        iconSize: [32, 37], 
        iconAnchor: [16, 37],
    },
    polyline_options: {
        color: "black",
        dashArray:[2, 5],
    },
}).addTo(overlays.gpx); 

gpxTrack.on("loaded", function(evt) {
    console.log("Loaded gpx event: ", evt);
    let gpxLayer = evt.target;
    map.fitBounds(gpxLayer.getBounds());
    
}).addTo(map);

// Optional (falls Daten mit Höhe vorliegen)
// let elevationControl = L.control.elevation({
//     time: false,
//     elevationDiv: "#profile",
//     theme: "bike-tirol",
//     height: 200,

// }).addTo(map);
// gpxTrack.on("addline", function(evt){
//     elevationControl.addData(evt.line);
    
// });
