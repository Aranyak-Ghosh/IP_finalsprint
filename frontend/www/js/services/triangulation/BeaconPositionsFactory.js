// this factory provides a bindable object of all stored beacon positions.
// Calculating the distances from each beacon will take into account the proximity factor and RSSI.
// After getting each beacon's distance and, having their absolute position, the absolute position
// of the user is returned.

// Exposes: beacons: a JSON reference to all nearby beacons
//          position: x, y of the user relative to the system's grid


angular.module('angularApp').factory('BeaconPositionsFactory', function ($rootScope, ServerInterfaceService) {
    // storage references
    var storage = window.localStorage;
    var universal_uuid;
    var beaconPositionKey = "beaconPositions"
    // beacon positions
    var beaconPositions = {}; // beaconPositions = {}

    function init(uuid) 
    {   
        universal_uuid = uuid;
        var storedPositions = storage.getItem(beaconPositionKey);
        if (storedPositions) beaconPositions = JSON.parse(storedPositions);
    }

    init();

    var checkRooms = function (roomMajors) {
        console.log('checking rooms');
        if (beaconPositions) {
            if (beaconPositions['major' + roomMajors[0]] && beaconPositions['major' + roomMajors[1]] && beaconPositions['major' + roomMajors[2]]) {
                return true;
            } else {
                return false;
            }
        }
        else {
            return false;
        }
    }

    var requestRoomsWithMajor = function (roomMajors) { // [m1,m2,m3]
        console.log('requesting rooms')
        for (var i = 0; i < roomMajors.length; i++) {
            if (!beaconPositions['major' + roomMajors[i]]) {
                ServerInterfaceService.requestARoomWithMajor(universal_uuid, roomMajors[i]);
            }
        }
    }

    $rootScope.$on('received-a-room', function (event, args) {
        beaconPositions['major' + args.major] = {};
        for (var i = 0; i < args.minors.length; i++) {
            beaconPositions['major' + args.major]['minor' + args.minors[i].number] = args.minors[i].position;
            updateLocalStorage();
        }
    })

    function updateLocalStorage() {
        console.log('updating localStorage');
        storage.setItem(beaconPositionKey, JSON.stringify(beaconPositions));
    }

    return {
        init:init,
        checkRooms: checkRooms,
        requestARoomWithMajor: requestRoomsWithMajor,
        beaconPositions: beaconPositions
    }
})
