/* A TOUR A DAY */


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
    winter: L.tileLayer(
        "http://wmts.kartetirol.at/gdi_winter/{z}/{x}/{y}.png", {
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
    // "Grundkarte Tirol": startLayer,
    // "Esri World Imagery": L.tileLayer.provider("Esri.WorldImagery"),
    "eGrundkarte Tirol Sommer": startLayer,
    "eGrundkarte Tirol Winter": eGrundkarteTirol.winter,
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
    //"Almen": overelays.almen
}).addTo(map);


// Layer control ausklappen
layerControl.expand();

// Maßstab control
L.control.scale({
    imperial: false
}).addTo(map);

// Fullscreen control
L.control.fullscreen().addTo(map);

// Diese Layer beim Laden anzeigen 
overlays.gpx.addTo(map);

// Farben nach Wert und Sc hwellen ermitteln
let getColor = function(value,ramp) {
    //console.log(value,ramp);
    for (let rule of ramp) {
        //console.log(rule)
        if (value >= rule.min && value < rule.max)
        return rule.color; 
    }
};


// Almen anzeigen 

async function loadHuts(url) {
    let response = await fetch(url);
    let geojson = await response.json(); 
    // console.log(geojson);
    let overlay = L.markerClusterGroup();
    layerControl.addOverlay(overlay,"Almen");
    overlay.addTo(map);
    
    // let overlay = L.MarkerClusterGroup();

    L.geoJSON(geojson,{
        pointToLayer: function(geoJsonPoint,latlng){
            // console.log(geoJsonPoint.properties.NAME);
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
// Wetterstationslayer beim Laden anzeigen
// overlays.temperature.addTo(map);


// Station
let drawStation = function(geojson) {
    // Wetterstationen mit Icons und Popups implementieren
    L.geoJson(geojson, {
        pointToLayer: function(geoJsonPoint, latlng) {
            // L.marker(latlng).addTo(map)
            // console.log(geoJsonPoint.geometry.coordinates[2]);
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
                    iconUrl: `/icons/wifi.png`,
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
            // L.marker(latlng).addTo(map)
            // console.log(geoJsonPoint.geometry.coordinates[2]);
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

    drawStation(geojson);
    drawTemperature(geojson);
    drawSnowheight(geojson);
    drawWindspeed(geojson);
    drawHumidity(geojson);

    
}
loadData("https://static.avalanche.report/weather_stations/stations.geojson");

// Generate Random Number 
let randomNumber = Math.floor(Math.random() * 760);
console.log(randomNumber);
let strRandom = randomNumber.toString();

// Generate path with RandomNumber
const path = "./data/Radtouren/"
const endPath = ".gpx"
const str1 = path.concat(strRandom)
let str = str1 + endPath
console.log(str)



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

    let popup = `
            <h3>${gpxLayer.get_name()}</h3>
            <ul>
                <li> StreckenLänge: ${(gpxLayer.get_distance()/1000).toFixed()} km</li>
                <li> tiefster Punkt: ${gpxLayer.get_elevation_min()} m</li>
                <li> höchster Punkt: ${gpxLayer.get_elevation_max()} m</li>
                <li> Hoehenmeter bergauf: ${gpxLayer.get_elevation_gain().toFixed()} m</li>
                <li> Hoehenmeter bergab: ${gpxLayer.get_elevation_loss().toFixed()} m</li>`;
    gpxLayer.bindPopup(popup);
});

let elevationControl = L.control.elevation({
    time: false,
    elevationDiv: "#profile",
    theme: "bike-tirol",
    height: 200,
    

}).addTo(map);
gpxTrack.on("addline", function(evt){
    elevationControl.addData(evt.line);
    
});
