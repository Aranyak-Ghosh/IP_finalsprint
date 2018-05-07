// takes in the position of beacons and the distances of beacons to return the positin of the user as a circle with radius r and center x,y

angular.module('angularApp').factory('CenterlizationService', function ($rootScope, ServerInterfaceService) {
    // sets position of user relative to system's grid using 'beacons' information
    var CircularBuffer = require('circular-buffer');
    var bufferSize = 3;
    var positionBuffer = new CircularBuffer(bufferSize); // buffer of center positions
    var centerlizationLog = 'CENTERLIZATION SERVICE: ';
    function log(message) {
        console.log(centerlizationLog + message);
    }

    var calculateNewPosition = function (nearbyBeacons, beaconPositions) {
        log('Getting new position circle');
        var readingPosition = calculateReadingCenter(nearbyBeacons, beaconPositions);
        positionBuffer.enq(readingPosition);
        var readingArray = positionBuffer.toarray();
        if (readingArray.length >= 3) {
            log('There are three center positions; can estimate center of user position ...')
            var data = calculateCenterAndRadius(readingArray);
            return data;
        }
        else {
            log('There is not enough data points to calculate user center');
        }
    }

    var calculateCenterAndRadius = function(positions){
        log('Calculating center based on the mean of values and std');
        var stats = require("stats-analysis") // include statistics library
        var count = positions.length;
        log('CCAR: count='+count);
        var xReadings=[], yReadings=[];
        positions.forEach(element => {
            xReadings.push(element.x);
            yReadings.push(element.y);
        });
        log('CCAR: xReadings: '+JSON.stringify(xReadings)+', yReadings: '+JSON.stringify(yReadings));
        var center={x:0,y:0};
        center.x = stats.mean(xReadings).toFixed(2)*1;
        center.y = stats.mean(yReadings).toFixed(2)*1;
        log('CCAR: center:'+JSON.stringify(center));
        var distances=[];
        positions.forEach(element=>{
            var distance = getDistance(center, element);
            distances.push(distance);
        })
        var radius = stats.mean(distances).toFixed(2)*1;
        log('CCAR: distances:'+JSON.stringify(distances)+ ', radius: '+radius);
        return {
            center:center,
            radius:radius
        }
    }
    var getDistance = function(pointa, pointb){
        return Math.sqrt(Math.pow(2, pointa.x-pointb.x)+Math.pow(2, pointa.y-pointb.y))
    }

    function calculateReadingCenter(nearbyBeacons, beaconPositions) {
        log('calculating center of current data');
        // checks to see if there are three closeby (immediate or near) beacons
        try {
            // uses absolute position of the three nearby beacns and the distance from them to get
            // an estimate of the actual position
            var beacon0 = {};
            var beacon0x = beaconPositions['major' + nearbyBeacons[0].major]['minor' + nearbyBeacons[0].minor].x;
            var beacon0y = beaconPositions['major' + nearbyBeacons[0].major]['minor' + nearbyBeacons[0].minor].y;
            var beacon0distance = nearbyBeacons[0].distance;
            var beacon1 = {};
            var beacon1x = beaconPositions['major' + nearbyBeacons[1].major]['minor' + nearbyBeacons[1].minor].x;
            var beacon1y = beaconPositions['major' + nearbyBeacons[1].major]['minor' + nearbyBeacons[1].minor].y;
            var beacon1distance = nearbyBeacons[1].distance;
            var beacon2 = {};
            var beacon2x = beaconPositions['major' + nearbyBeacons[2].major]['minor' + nearbyBeacons[2].minor].x;
            var beacon2y = beaconPositions['major' + nearbyBeacons[2].major]['minor' + nearbyBeacons[2].minor].y;
            var beacon2distance = nearbyBeacons[2].distance;
            var trilateration = require('../../../../node_modules/trilateration/index.js');
            trilateration.addBeacon(0, trilateration.vector(Number(beacon0x), Number(beacon0y)));
            trilateration.addBeacon(1, trilateration.vector(Number(beacon1x), Number(beacon1y)));
            trilateration.addBeacon(2, trilateration.vector(Number(beacon2x), Number(beacon2y)));

            // Setting the beacons distances
            trilateration.setDistance(0, Number(beacon0distance));
            trilateration.setDistance(1, Number(beacon1distance));
            trilateration.setDistance(2, Number(beacon2distance));

            // Start Calculation
            var position = trilateration.calculatePosition();

            log("X: " + position.x + "; Y: " + position.y); // X: 7; Y: 6.5

            return position;

        }
        catch (e) {
            log('Error while calculating position: ' + e);
        }
    }
    return {
        calculateNewPosition: calculateNewPosition
    };
})