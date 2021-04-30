window.onload = init

function init(){ 
    //Map
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


        //TODO: Put as much into functions as possible.

        //let longitude = document.getElementById('longitude').value;
        //let latitude = document.getElementById('latitude').value;
        //CALCULATE SUNRISE AND SUNSET
        let sunriseField = document.getElementById("sunriseTime");
        let sunseteField = document.getElementById("sunsetTime");
        let dayLengthField = document.getElementById("lengthOfDay");
        let yearMonthDay = document.getElementById("startDate").value.split("-");
        //Date format is (YYYY,MM,DD) where jan is 0 and dec is 11.
        let times = SunCalc.getTimes(new Date(yearMonthDay[0],(yearMonthDay[1]-1),yearMonthDay[2]), latitudeField.value, longitudeField.value);
        sunriseField.innerHTML=times.sunrise.getHours() + ':' + times.sunrise.getMinutes();
        sunseteField.innerHTML=times.sunset.getHours() + ':' + times.sunset.getMinutes();


        //Forcing function to work
        let startDate = document.getElementById("startDate").value;
        let endDate = document.getElementById("endDate").value;
        if(endDate){
        var dateList = getDaysBetweenDates(startDate, endDate);
        }
        else{
            var dateList = getDaysBetweenDates(startDate, startDate);
        }
        let daysLengths= calculateDayLengths(latitudeField.value,longitudeField.value,dateList);
        dayLengthField.innerHTML=Math.trunc(daysLengths[0])+":"+Math.round((daysLengths[0]-Math.trunc(daysLengths[0]))*60);

        updateChart(daysLengths,dateList);

    })


    //TODO:
    //IDEA! When datesArray.length<30 -> show all dates separately
    //datesArray.length>30 and <75 -> show every third date on x axis
    // When >75 and less than 1 year show every month
    //Then show every second month 
    //Then show years.
    //Given: latitude and longitude numbers and an array of dates to calculate day lengths for.
    //Return:  array of numbers where each represents the days length of given date respectively.
    calculateDayLengths= function(latitude, longitude, datesArray){
        let x=[];
        //When datesArray.length<30 -> show all dates separately
        for (i=0; i<datesArray.length; i++){
            //console.log(datesArray[i])
            let date = datesArray[i].split("-");//YYYY-MM-DD
            let times = SunCalc.getTimes(new Date(date[0],(date[1]-1),date[2]), latitude, longitude);
            x.push(dayLength(times.sunrise, times.sunset));
        }
        return x;
    };

    //Given: sunrise and sunset of Suncalc times getTimes function.
    //Return: correctly calculated length of the day rounded up to minutes.
    //Author: https://stackoverflow.com/questions/10804042/calculate-time-difference-with-javascript/27484203
    var dayLength= function (sunrise, sunset){
        var startDate = new Date(0, 0, 0, sunrise.getHours(), sunrise.getMinutes(),0);
        var endDate = new Date(0, 0, 0, sunset.getHours(), sunset.getMinutes(), 0);
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

    //Set default date to today.
    var today = moment().format('YYYY-MM-DD');
    document.getElementById("startDate").value = today;

    //Chart Data
    const labels = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
      ];
    const data = {
        labels: labels,
        datasets: [{
            label: 'Day length in hours',
            fill: true,
            lineTension: 0.2,
            backgroundColor: 'rgb(255, 192, 203)',
            borderColor: 'rgb(255, 99, 132)',
            data: [0, 10.5, 5, 2.44, 20, 30, 45],
        }],
    };

    const config = {
        type: 'line',
        data,
        options: {
            scales: {
                y: {
                    type: 'linear',
                    min: 0,
                    max: 24
                }
            }
        }
    };

    //Actual chart
    var myChart = new Chart(
        document.getElementById('lineChart'),
        config
    );


    updateChart = function(values, newLabels){
        myChart.data.datasets[0].data =values;
        myChart.data.labels=newLabels;
        myChart.update();
    };


    //Must be refractored into proper function and added to "startDate.onchange" as well.
    document.getElementById("endDate").onchange = function(){
        // print out all dates between given time.
        let startDate = document.getElementById("startDate").value;
        let endDate = document.getElementById("endDate").value;

        var dateList = getDaysBetweenDates(startDate, endDate);
    };
    
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

