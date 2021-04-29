window.onload = init

function init(){
    const map = new ol.Map({
        view: new ol.View({
            center: [0,0],
            zoom: 2,
            projection: 'EPSG:4326',//Coordinates in x = longitude and y = latitude, 
            maxZoom: 20,
            extent: [-180,-90,180,90] // Map cannot go out of bounds.
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
        longitudeField.value=e.coordinate[0];
        latitudeField.value=e.coordinate[1];


        let sunriseField = document.getElementById("sunriseTime");
        let sunseteField = document.getElementById("sunsetTime");
        let dayLengthField = document.getElementById("lengthOfDay");
        let yearMonthDay = document.getElementById("calendarDate").value.split("-");
        //Date format is (YYYY,MM,DD) where jan is 0 and dec is 11.
        let times = SunCalc.getTimes(new Date(yearMonthDay[0],(yearMonthDay[1]-1),yearMonthDay[2]), latitudeField.value, longitudeField.value);
        sunriseField.innerHTML=times.sunrise.getHours() + ':' + times.sunrise.getMinutes();
        sunseteField.innerHTML=times.sunset.getHours() + ':' + times.sunset.getMinutes();
        dayLengthField.innerHTML = (times.sunset.getHours()-times.sunrise.getHours())+ ':' +times.sunset.getMinutes();
    })

    //Default date is today.
    var today = moment().format('YYYY-MM-DD');
    document.getElementById("calendarDate").value = today;

    

}