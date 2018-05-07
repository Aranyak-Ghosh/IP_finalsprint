
angular.module('angularApp').factory('RoomService', function ($rootScope, ServerInterfaceService) {
    var roomsLog = 'ROOM SERVICE: ';
    var roomsKey = 'ROOMS';
    var storage = window.localStorage;

    var rooms = [];
    var log = function (message) {
        console.log(roomsLog + message);
    }
    
    var init = function () {
        log('initializing RoomsService');
        fetchRoomsFromStorage();
    }

    var fetchRoomsFromStorage = function(){
        log('fetching room data from storage');
        var r = JSON.parse(storage.getItem(roomsKey));
        if (r) {
            tempArray = [];
            log('Fetched rooms from local storage ');
            r.forEach(element => {
                tempArray.push(element);
                log('Found in storage: ' + JSON.stringify(element));
            });
            rooms = tempArray;
        } else {
            log('There are no rooms stored in local storage');
        }
    }

    // updates the local storage with new project object
    var updateLocalStorage = function () {
        console.log('storing room data in local storage');
        storage.setItem(projectsKey, JSON.stringify(rooms));
    }

    var requestARoom = function (uuid, major) {
        ServerInterfaceService.requestARoomWithMajor(uuid, major);
    }

    $rootScope.$on('received-rooms', function (event, args) {
        log('recieved all rooms');
        addNewRooms(args.rooms);
    })
    
    $rootScope.$on('received-a-room', function(event, args){
        log('recieved one room with major: '+args.major)
        $rootScope.$broadcast('add-new-positions', {major: args.major, beacons:args.beacons})
        addSingleRoom(args);
    })

    function addSingleRoom(room){
        log('adding room'+JSON.stringify(room));
        rooms.push(room);
        updateLocalStorage();
    }

    function addNewRooms(newRooms) {
        log('Overwriting old rooms');
        rooms = newRooms;
        rooms.forEach(element => {
            log('recieved room:' + JSON.stringify(element));
            // ServerInterfaceService.requestOneProjectImage(element.route);
        });
        updateLocalStorage();
    }

    // var requestAllrooms = function () {
    //     log('requesting all rooms from server');
    //     ServerInterfaceService.requestRooms();
    // }

    var returnRoomsArray = function () {
        return rooms;
    }

    return {
        init:init,
        getRooms:returnRoomsArray,
        requestARoom:requestARoom
    }
})
