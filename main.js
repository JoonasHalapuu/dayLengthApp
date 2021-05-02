window.onload = init

function init(){ 
    //Set default date to today.
    var today = moment().format('YYYY-MM-DD');
    document.getElementById("startDate").value= today;
    //end date can not be before start date.
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
                    src: './libs/Images/marker-48.png' //https://www.iconsdb.com/soylent-red-icons/map-marker-2-icon.html
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

        //Draw line chart
        let endDate = document.getElementById("endDate").value;
        if(endDate){
            if (endDate<document.getElementById("startDate").value)
                alert("Start date should be before end date!");
            else
               updateChart(endDate);
        }
    })


    //Creating the chart
    var myChart = new Chart(
        document.getElementById('lineChart'),
        {type: 'line',
        data: {datasets: [{
            label: 'Day length in hours',
            fill: true,
            lineTension: 0.2,
            backgroundColor: 'rgb(255, 192, 203)',
            borderColor: 'rgb(255, 99, 132)',
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

    document.getElementById('lineChart').style.display ="none";


    updateChart = function(endDate){
        let startDate = document.getElementById("startDate").value;
        let latitude = document.getElementById("latitude").value;
        let longitude = document.getElementById("longitude").value;

        let datesList = getDaysBetweenDates(startDate, endDate);
        let daysLengths= calculateDayLengths(latitude,longitude,datesList);

        myChart.data.datasets[0].data = daysLengths;
        myChart.data.labels=datesList;
        myChart.update();
        document.getElementById('lineChart').style.display = "block";
    };


    document.getElementById("startDate").onchange = function(){
        if (document.getElementById("longitude").value && document.getElementById("latitude").value)
            showSunTimes();
        // print out all dates between given time.
        let startDate = document.getElementById("startDate");
        let endDate = document.getElementById("endDate");
        endDate.min = startDate.value; 
        if (endDate.value<startDate.value || endDate.value.split("-")[0]-startDate.value.split("-")[0]>50)
            return;
        if(endDate.value && document.getElementById("longitude").value && document.getElementById("latitude").value)
            updateChart(endDate.value);
    };

    document.getElementById("endDate").onchange = function(){
        let startDate = document.getElementById("startDate");
        let endDate = document.getElementById("endDate");
        if (endDate.value<startDate.value)
            return;
        startDate.max = endDate.value; 
        if(document.getElementById("longitude").value && document.getElementById("latitude").value)
            updateChart(endDate.value);
    };


    function updateCordinates(coordinateUnits){
        let units = document.getElementById(coordinateUnits).value;
        let maxminValue = units == "longitude" ? 180 : 90;
        if (!units || -maxminValue>units || units>maxminValue)
            alert(coordinateUnits.charAt(0).toUpperCase() + coordinateUnits.slice(1)+" needs to be in ranges from -"+maxminValue+" to "+maxminValue);
        else{
            let otherUnit = document.getElementById((coordinateUnits == "longitude"?"latitude":"longitude")).value;
            if(otherUnit){
                moveMarker(map.getLayers().array_[1],coordinateUnits=="longitude"?units:otherUnit, coordinateUnits=="latitude"?units:otherUnit);
                if(document.getElementById("endDate").value){
                    if(document.getElementById("endDate").value>=document.getElementById("startDate").value)
                        updateChart(document.getElementById("endDate").value);
                    else alert("Start date should be before end date!");
                }
                showSunTimes();
            }
        }
    }

    document.getElementById("longitude").onchange = function(){
        updateCordinates("longitude");
    };

    
    document.getElementById("latitude").onchange = function(){
        updateCordinates("latitude")
    };
}

function moveMarker(layer,longitude, latitude){
    layer.setSource(new ol.source.Vector({
        features: [new ol.Feature({
            geometry: new ol.geom.Point([longitude,latitude]),
          })]
      }))
}

//Why should u store a function in var or let?
showSunTimes = function(){
    //Get coordinates
    let longitude = document.getElementById('longitude').value;
    let latitude = document.getElementById('latitude').value;

    //Calculate sunrise & sunset
    let startDate = document.getElementById("startDate").value;
    let yearMonthDay = startDate.split("-");
    let times = SunCalc.getTimes(new Date(yearMonthDay[0],(yearMonthDay[1]-1),yearMonthDay[2]), latitude, longitude);

    let sunriseHour=times.sunrise.getHours()
    let sunriseMin=times.sunrise.getMinutes()
    let sunsetHour=times.sunset.getHours()
    let sunsetMin=times.sunset.getMinutes()

    //Show sunrise & sunset
    if(isNaN(sunriseHour) || isNaN(sunsetHour)){
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

//Given: latitude and longitude numbers and an array of dates to calculate day lengths for.
//Return:  array of numbers where each represents the days length of given date respectively.
calculateDayLengths= function(latitude, longitude, datesArray){
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




prettyTimeFormat = function(hours, minutes){
    return (hours <= 9 ? "0" : "") + hours + ':' + (minutes <= 9 ? "0" : "") + minutes;
}
