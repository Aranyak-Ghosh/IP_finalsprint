angular.module('angularApp').service('TriangulationService', function ($rootScope, BeaconPositionsFactory, CenterlizationService, RealtimeBeaconDistancesService) {
    var universal_uuid;
    var nearbyBeacons;
    var beaconPositions;
    const triangulationLog = "TRIANGULATION: "
    function log(message) {
        console.log(triangulationLog + message)
    }
    var init = function (uuid) {
        universal_uuid = uuid;
        RealtimeBeaconDistancesService.init(universal_uuid);
        BeaconPositionsFactory.init(universal_uuid);
    }

    nearbyBeacons = RealtimeBeaconDistancesService.nearOrImmediateBeacons;
    beaconPositions = BeaconPositionsFactory.beaconPositions;

    $rootScope.$on('calculate-position', function (event) {
        setPosition();
    });
    // sets position of user relative to system's grid using 'beacons' information
    function setPosition() {
        // checks to see if there are three closeby (immediate or near) beacons
        if (nearbyBeacons.length >= 3) {
            var majorsOfCurrentRooms;
            nearbyBeacons.array.forEach(element => {
                majorsOfCurrentRooms.push(element.major);
            });
            if (BeaconPositionsFactory.checkRooms(majorsOfCurrentRooms)) {
                try {
                    log('Required information to trilaterate is stored. Trilaterating ....');
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
                    position.pos = trilateration.calculatePosition();

                    log("X: " + position.pos.x + "; Y: " + position.pos.y); // X: 7; Y: 6.5


                }
                catch (e) {
                    log('Error while calculating position: ' + e);
                }
            }
            else {
                log('Required information to trilaterate is not stored. Requesting information ...');
                BeaconPositionsFactory.requestRoomsWithMajor(majorsOfCurrentRooms);
            }
        }
        else {
            log('Not enough nearby beacons');
        }
    } 

})