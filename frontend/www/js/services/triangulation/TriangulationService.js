angular.module('angularApp').service('TriangulationService', function ($rootScope, BeaconPositionsFactory, CenterlizationService, RealtimeBeaconDistancesService) {
    var universal_uuid;
    var nearbyBeacons;
    var beaconPositions;
    var position = { p: '' };
    const triangulationLog = "TRIANGULATION: "
    function log(message) {
        console.log(triangulationLog + message)
    }
    var init = function (uuid) {
        log('Starting up triangulation with uuid:' + uuid)
        universal_uuid = uuid;
        RealtimeBeaconDistancesService.init(universal_uuid);
        BeaconPositionsFactory.init(universal_uuid);
    }

    // At ranging of beacons, calculate the new position of the user
    $rootScope.$on('calculate-position', function (event, args) {
        log('Recieved \'calculate-position\' broadcast')
        nearbyBeacons = args.nearbyBeacons;
        var majorsOfCurrentRooms = [];
        nearbyBeacons.forEach(element => {
            majorsOfCurrentRooms.push(element.major);
        });
        log('majors of current room(s): ' + JSON.stringify(majorsOfCurrentRooms));
        if (BeaconPositionsFactory.checkRooms(majorsOfCurrentRooms)) {
            log('Required beacon positions of rooms: ' + JSON.stringify(majorsOfCurrentRooms) + ' to trilaterate are stored. Trilaterating ....');
            beaconPositions = BeaconPositionsFactory.getBeaconPositions();
            var position = CenterlizationService.calculateNewPosition(nearbyBeacons, beaconPositions);
            log('sending \'calculated-new-position\' broadcast')
            $rootScope.$broadcast('calculated-new-position', position);
        }
        else {
            log('Required information to trilaterate is not stored. Requesting information ...');
            BeaconPositionsFactory.requestRoomsWithMajor(majorsOfCurrentRooms);
        }
    });

    return {
        init: init,
        position: position.pos
    }

})