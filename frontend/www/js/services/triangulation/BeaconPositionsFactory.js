// this factory provides a bindable object of all stored beacon positions.
// Calculating the distances from each beacon will take into account the proximity factor and RSSI.
// After getting each beacon's distance and, having their absolute position, the absolute position
// of the user is returned.

// Exposes: beacons: a JSON reference to all nearby beacons
//          position: x, y of the user relative to the system's grid

// Listens: 'recieved-a-room-positions': expects the beacon positions of every beacon in a room 

angular.module('angularApp').factory('BeaconPositionsFactory', function ($rootScope, RoomService) {
    // storage references
    var storage = window.localStorage;
    var universal_uuid;
    var beaconPositionKey = "beaconPositions"
    // beacon positions
    var beaconPositions = {}; // beaconPositions = {}

    function init(uuid) {
        universal_uuid = uuid;
        var storedPositions = storage.getItem(beaconPositionKey);
        if (storedPositions) beaconPositions = JSON.parse(storedPositions);
    }

    init();

    var checkRooms = function (roomMajors) {
        return true;
        // console.log('checking rooms');
        // if (beaconPositions) {
        //     if (beaconPositions['major' + roomMajors[0]] && beaconPositions['major' + roomMajors[1]] && beaconPositions['major' + roomMajors[2]]) {
        //         return true;
        //     } else {
        //         return false;
        //     }
        // }
        // else {
        //     return false;
        // }
    }

    var requestRoomsWithMajor = function (roomMajors) { // [m1,m2,m3]
        console.log('requesting rooms')
        for (var i = 0; i < roomMajors.length; i++) {
            if (!beaconPositions['major' + roomMajors[i]]) {
                RoomService.requestARoom(universal_uuid, roomMajors[i]);
            }
        }
    }

    $rootScope.$on('add-new-positions', function (event, args) {
        beaconPositions['major' + args.major] = {};
        args.positions.forEach(element => {
            beaconPositions['major' + args.major]['minor' + element.number] = element.position;
            updateLocalStorage();
        })
    })

    function updateLocalStorage() {
        console.log('updating localStorage');
        storage.setItem(beaconPositionKey, JSON.stringify(beaconPositions));
    }

    var beaconPosition =
        {
            major1: {
                minor1: {
                    x: 0,
                    y: 0
                },
                minor14867: {
                    x: 1,
                    y: 0
                },
                minor6478: {
                    x: 0,
                    y: 1
                },
                minor62746: {
                    x: 1,
                    y: 1
                }

            }, major2: {
                minor1: {
                    x: 2,
                    y: 2.4
                },
                minor14867: {
                    x: 1,
                    y: 1.22
                },
                minor6478: {
                    x: 5,
                    y: 1.45
                },
                minor62746: {
                    x: 4,
                    y: 8
                }

            }
        }

    var getBeaconPositions = function () {
        return beaconPosition;
        // return beaconPositions;
    }

    return {
        init: init,
        checkRooms: checkRooms,
        requestARoomWithMajor: requestRoomsWithMajor,
        getBeaconPositions: getBeaconPositions
    }
})
