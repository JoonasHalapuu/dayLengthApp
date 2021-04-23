window.onload = init

function init(){
    const map = new ol.Map({
        view: new ol.View({
            center: [0,0],
            zoom: 2,
            projection: 'EPSG:4326',//Coordinates in x = longitude and y = latitude, 
            maxZoom: 20,
            extent: [-180,-90,180,90] // Map cannot go out of bounds
        }),
        layers: [
            new ol.layer.Tile({
                source: new ol.source.OSM()
            })
        ],
        target: 'js-map'
    })

    map.on('click', function(e){
        let longitudeField = document.getElementById('longitude');
        let latitudeField = document.getElementById('latitude');
        longitudeField.value=e.coordinate[0]
        latitudeField.value=e.coordinate[1]
    })

    var today = moment().format('YYYY-MM-DD');
    document.getElementById("calendarDate").value = today;
}