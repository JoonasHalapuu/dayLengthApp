window.onload = init

function init(){ 
    //Set default date to today.
    var today = moment().format('YYYY-MM-DD');
    //end date can not be before start date and start date can not be after end date.
    document.getElementById("startDate").value= today;
    document.getElementById("endDate").min = today


    //Create the map
    const map = new ol.Map({
        view: new ol.View({
            center: [0,0],
            zoom: 2,
            projection: 'EPSG:4326',//Coordinates in x = longitude and y = latitude, 
            maxZoom: 20,
            extent: [-180,-90,180,90] //Map cannot go out of bounds.
        }),
        layers: [
            new ol.layer.Tile({
                source: new ol.source.OSM()
            }),
            new ol.layer.Vector({
                style: new ol.style.Style({
                  image: new ol.style.Icon({
                    anchor: [0.5, 46],
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'pixels',
                    src: './libs/Images/marker-48.png' //from https://www.iconsdb.com/soylent-red-icons/map-marker-2-icon.html
                  })
                }),
              })
        ],
        target: 'js-map'
    })


    map.on('click', function(e){
        //Set marker to click location
        moveMarker(map.getLayers().array_[1],e.coordinate[0],e.coordinate[1]);
        

        //update coordinates 
        document.getElementById("latitude").value=e.coordinate[1];
        document.getElementById("longitude").value=e.coordinate[0];

        //update sunrise, sunset times and calculate day length. 
        showSunTimes();

        //Draw line chart if possible
        let endDate = document.getElementById("endDate").value;
        if(endDate){
            if (endDate<document.getElementById("startDate").value)
                alert("Start date should be before end date!");
            else
               updateChart(dayLengthChart);
        }
    })


    //Creating the chart
    var dayLengthChart = new Chart(
        document.getElementById('lineChart'),
        {type: 'line',
        data: {datasets: [{
            label: 'Day length in hours',
            fill: true,
            lineTension: 0.1,
            backgroundColor: 'rgb(161, 240, 255)',
            borderColor: 'rgb(63, 200, 250)',
        }]},
        options: {
            scales: {
                y: {
                    type: 'linear',
                    min: 0,
                    max: 24
                }
            }
        }}
    );

    //Don't show chart at the beginning.
    document.getElementById('lineChart').style.display ="none";

    document.getElementById("startDate").onchange = function(){
        if (document.getElementById("longitude").value && document.getElementById("latitude").value)
            showSunTimes();

        let startDate = document.getElementById("startDate");
        let endDate = document.getElementById("endDate");
        endDate.min = startDate.value; 

        updateChart(dayLengthChart);
    };

    document.getElementById("endDate").onchange = function(){
        let startDate = document.getElementById("startDate");
        let endDate = document.getElementById("endDate");
        
        startDate.max = endDate.value; 

        updateChart(dayLengthChart);
    };


    //Updates as much of the page as possible. 
    //Given: coordinateUnits = units that have been changed (longitude or latitude)
    //       layer = the layer of the map to change
    function updateCordinates(coordinateUnits, layer){
        let units = document.getElementById(coordinateUnits).value;
        let maxValue = coordinateUnits.localeCompare("longitude")==0 ? 180 : 90;

        if (!units || -maxValue>units || units>maxValue)
            alert(coordinateUnits.charAt(0).toUpperCase() + coordinateUnits.slice(1)+" needs to be in ranges from -"+maxValue+" to "+maxValue);
        else{
            //Update page
            let otherUnit = document.getElementById((coordinateUnits == "longitude"?"latitude":"longitude")).value;
            if(otherUnit){
                moveMarker(layer,coordinateUnits=="longitude"?units:otherUnit, coordinateUnits=="latitude"?units:otherUnit);
                if(document.getElementById("endDate").value){
                    if(document.getElementById("endDate").value && document.getElementById("endDate").value<document.getElementById("startDate").value)
                        alert("Start date should be before end date!");
                    else updateChart(dayLengthChart); 
                }
                showSunTimes();
            }
        }
    }

    document.getElementById("longitude").onchange = function(){
        updateCordinates("longitude", map.getLayers().array_[1]);
    };

    
    document.getElementById("latitude").onchange = function(){
        updateCordinates("latitude",map.getLayers().array_[1])
    };
}

//Moves the red marker to given coordinates on the map
//Given: layer = layer on which the marker is
   //longitude = longitude of the markers new place
   //latitude  = latitude of the markers new place
function moveMarker(layer,longitude, latitude){
    layer.setSource(new ol.source.Vector({
        features: [new ol.Feature({
            geometry: new ol.geom.Point([longitude,latitude]),
          })]
      }))
}

//Updates the line chart
//Given: chart to be updated.
function updateChart(chart){
    let endDate = document.getElementById("endDate").value;
    let startDate = document.getElementById("startDate").value;
    let latitude = document.getElementById("latitude").value;
    let longitude = document.getElementById("longitude").value;

    if(endDate>=startDate && endDate.split("-")[0]-startDate.split("-")[0]<=50 && longitude && latitude){
        let datesList = getDaysBetweenDates(startDate, endDate);
        let daysLengths= calculateDayLengths(latitude,longitude,datesList);

        chart.data.datasets[0].data = daysLengths;
        chart.data.labels=datesList;
        chart.update();
        document.getElementById('lineChart').style.display = "block";
    }
};

//Updates pages sunrise, sunset and day length times
function showSunTimes(){
    //Get coordinates
    let longitude = document.getElementById('longitude').value;
    let latitude = document.getElementById('latitude').value;

    //Calculate sunrise & sunset
    let startDate = document.getElementById("startDate").value;
    let yearMonthDay = startDate.split("-");
    let times = SunCalc.getTimes(new Date(yearMonthDay[0],(yearMonthDay[1]-1),yearMonthDay[2]), latitude, longitude);

    let sunriseHour=times.sunrise.getUTCHours()
    let sunriseMin=times.sunrise.getUTCMinutes()
    let sunsetHour=times.sunset.getUTCHours()
    let sunsetMin=times.sunset.getUTCMinutes()

    //Show sunrise & sunset
    if(isNaN(sunriseHour) || isNaN(sunsetHour)){
        //In case of polar night or day
        document.getElementById("sunriseTime").innerHTML="-";
        document.getElementById("sunsetTime").innerHTML="-";
    }
    else{
    document.getElementById("sunriseTime").innerHTML= prettyTimeFormat(sunriseHour,sunriseMin);
    document.getElementById("sunsetTime").innerHTML=prettyTimeFormat(sunsetHour,sunsetMin);
    }

    //Show length of day
    let daysLength= calculateDayLengths(latitude,longitude,[startDate]);
    let hours = Math.trunc(daysLength[0])
    let minutes = Math.round((daysLength[0]-hours)*60)
    document.getElementById("lengthOfDay").innerHTML=prettyTimeFormat(hours,minutes);

};

//Calculates lengths of days of given time period and coordinates.
//Given: latitude and longitude numbers and an array of dates to calculate day lengths for.
//       datesArray = array of given dates for which day length needs to be calculated.
//Return: array of numbers where each represents the days length of given date respectively.
function calculateDayLengths(latitude, longitude, datesArray){
    let x=[];
    //When datesArray.length<30 -> show all dates separately
    for (i=0; i<datesArray.length; i++){
        let date = datesArray[i].split("-");//YYYY-MM-DD
        let times = SunCalc.getTimes(new Date(date[0],(date[1]-1),date[2]), latitude, longitude);
        if(isNaN(times.sunrise) || isNaN(times.sunset)){
            newLat = latitude > 60 ? 60 : -60;
            times = SunCalc.getTimes(new Date(date[0],(date[1]-1),date[2]), newLat, longitude)
            x.push(dayLength(times.sunrise, times.sunset)>12?24:0)
        }
        else{
            x.push(dayLength(times.sunrise, times.sunset));
        }
    }
    return x;
};

//Calculates the length of a single day when sunset and sunrise times are known.
//Given: sunrise and sunset of Suncalc times getTimes function.
//Return: correctly calculated length of the day rounded up to minutes.
//Author: https://stackoverflow.com/questions/10804042/calculate-time-difference-with-javascript/27484203
var dayLength= function (sunrise, sunset){
    var startDate = new Date(0, 0, 0, sunrise.getUTCHours(), sunrise.getUTCMinutes(),0);
    var endDate = new Date(0, 0, 0, sunset.getUTCHours(), sunset.getUTCMinutes(), 0);
    var diff = endDate.getTime() - startDate.getTime();
    var hours = Math.floor(diff / 1000 / 60 / 60);
    diff -= hours * 1000 * 60 * 60;
    var minutes = Math.floor(diff / 1000 / 60);

    //For 24 hour format
    if (hours < 0)
        hours = hours + 24;
    // For nice format for future refrerences.   (hours <= 9 ? "0" : "") + hours + ":" + (minutes <= 9 ? "0" : "") + minutes
    return (hours*60+minutes)/60;
}

//Finds all dates between given two dates.
//Given: startDate and endDate.
//Return: array of dates in MM/DD/YYYY and in chronological order.
//Credit: https://www.itsolutionstuff.com/post/get-all-dates-between-two-dates-in-moment-jsexample.html
var getDaysBetweenDates = function(startDate, endDate) {
    startDate=moment(startDate)
    endDate=moment(endDate)
    var now = startDate.clone(), dates = [];
    
    while (now.isSameOrBefore(endDate)) {
        dates.push(now.format('YYYY-MM-DD'));
        now.add(1, 'days');
    }
    return dates;
};

//Formats given hours and minutes to HH:MM.
//Given hours and minutes
//Returns sama hours and minutes in full HH:MM format. 
prettyTimeFormat = function(hours, minutes){
    return (hours <= 9 ? "0" : "") + hours + ':' + (minutes <= 9 ? "0" : "") + minutes;
}
