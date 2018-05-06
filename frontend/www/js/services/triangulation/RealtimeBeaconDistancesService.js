angular.module('angularApp').factory('RealtimeBeaconDistancesService', ['$timeout', '$rootScope', function ($timeout, $rootScope) {
    var universal_uuid;
    var init = function (uuid) {
        universal_uuid = uuid;
    }
    // the list of all beacons around the user
    var beacons = {};
    // the position object (x,y) of the user
    var position = {};
    // list of the nearest three beacons to the user
    var nearOrImmediateBeacons = [];
    // used for logging
    var beaconTag = "REALTIME BEACON DISTANCES: ";
    // This array must be in local storage or imported from online
    // var beaconPositionNew = BeaconPositionsFactory.beaconPosition;
    var nearOrImmediateBeacons = [];
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



    var identifier = "sdf"
    var delegate;

    function log(message) {
        console.log(beaconTag + message);
    }

    // initiates the phones bluetooth
    function initBluetooth() {
        try { // bluetooth is bound and ON
            // check to see if Bluetooth is ON, if not turn it ON
            cordova.plugins.locationManager.isBluetoothEnabled()
                .then(function (isEnabled) {
                    log("BLE isEnabled: " + isEnabled);
                    if (isEnabled) {
                    } else {
                        cordova.plugins.locationManager.enableBluetooth();
                    }
                })
                .fail(function (e) {
                })
                .done();
        }
        catch (err) {
        }
    }

    // Creates a BeaconRange based on given information
    function createBeaconReagon(uuid, identifier, major, minor) {
        var beaconRegion;
        try {
            if (major) {
                if (minor) {

                    beaconRegion = new cordova.plugins.locationManager.BeaconRegion(identifier, uuid, major, minor);
                }
                else {

                    beaconRegion = new cordova.plugins.locationManager.BeaconRegion(identifier, uuid, major);
                }
            }
            else
                beaconRegion = new cordova.plugins.locationManager.BeaconRegion(identifier, uuid);
        }
        catch (err) {
            log('could not create beaconRegion: '+err);
        }
        return beaconRegion;
    }


    // initiate the delegate and set up the callbacks for ranging, finding distances from beacons
    // and saving all that info in 'beacons'
    function setupDelegateToRegionBR(beaconR) {

        try { //iBeacon Initializtation

            // create a delegate
            delegate = new cordova.plugins.locationManager.Delegate();

            const bufferSize = 2;
            // called every second, there is a list of beacons inside data.beacons
            // will get called even if there are 0 beacons in the list
            delegate.didRangeBeaconsInRegion = function (pluginResult) {
                // The closes three beacons are kept in an array, the following function
                // empties this array at the beginning of every ranging
                resetNearbyBeaconsList();
                var CircularBuffer = require('circular-buffer');
                // go over every beacon ranged
                for (var i = 0; i < pluginResult.beacons.length; i++) {
                    var stats = require("stats-analysis") // include statistics library
                    // creates an entry in the beacons JSON object for each beacon if it doesn't have one
                    if (!beacons['major' + pluginResult.beacons[i].major]) {
                        log('No entry in beacons for beacons with major = ' + pluginResult.beacons[i].major)
                        beacons['major' + pluginResult.beacons[i].major] = {};
                    }
                    // creates an entry for the current beacon inside beacons.[major$(its major)]
                    if (!beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor]) {
                        log('No entry in beacons[major' + pluginResult.beacons[i].major + '] for beacons with minor = ' + pluginResult.beacons[i].minor)
                        beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor] = {}
                    }

                    // enques the last seen RSSI
                    beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor].rssi = pluginResult.beacons[i].rssi;
                    // adds the proximity level
                    beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor].proximity = pluginResult.beacons[i].proximity;
                    // adds tx as well
                    beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor].tx = pluginResult.beacons[i].tx;
                    // adds major
                    beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor].major = pluginResult.beacons[i].major;
                    // adds minor
                    beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor].minor = pluginResult.beacons[i].minor;

                    // if no distances buffer is created, create one
                    if (!beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor].buffer) {
                        log('There was no buffer for beacon ' + i)
                        beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor].buffer = new CircularBuffer(bufferSize);
                    }
                    // calculates distance from beacon and adds it to a buffer for this beacon
                    beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor].buffer.enq(
                        calculateDistanceFromBeacon(beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor].tx,
                            beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor].rssi
                        ))
                    var proximity;
                    // checks the proximity of the beacon
                    if (pluginResult.beacons[i].proximity == "ProximityNear")
                        proximity = 1;
                    else if (pluginResult.beacons[i].proximity == "ProximityImmediate")
                        proximity = 0;
                    else
                        proximity = 2;
                    // adds proxity integer
                    beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor].proximity = proximity;
                    // calculates average of distances and records it
                    beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor].distance =
                        stats.mean(/*stats.filterOutliers(*/beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor].buffer.toarray()/*)*/).toFixed(2) * 1;

                    if (proximity < 2) {
                        addBeaconToNearbyBeacons(beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor]);
                        log(JSON.stringify(beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor]));
                    }

                }

                function add(a, b) {
                    return a + b;
                }
                // helper function for calculating distance
                function calculateDistanceFromBeacon(tx, rssi) {
                    return Math.pow(10, (tx - rssi) / (10 * 2.25));
                }
                // this will initiate the finding of the absolute position
                // setPosition();

                // console.log(JSON.stringify(beacons));
                // $rootScope.$apply();
                    $rootScope.$emit('calculate-position');
                log('Ranged beacons');
            };

            //set the delegate
            cordova.plugins.locationManager.setDelegate(delegate);

            cordova.plugins.locationManager.startMonitoringForRegion(beaconR)
                .fail(function (e) { log(e); })
                .done();
            cordova.plugins.locationManager.startRangingBeaconsInRegion(beaconR)
                .fail(function (e) {
                    logerror(e);
                    //   logToError("Fail: startMonitoringForRegion > " + e);
                })
                .done();


        }
        catch (err) { // try failed in iBeacon

            var vDebug = "";
            for (var prop in err) {
                vDebug += "property: " + prop + " value: [" + err[prop] + "]\n";
            }
            vDebug += "toString(): " + " value: [" + err.toString() + "]";


        }
    }

    // resets the nearOrImmediateBeacons list
    function resetNearbyBeaconsList() {
        nearOrImmediateBeacons = [];
    }


    // adds a beacon to the nearOrImmediateBeacons based on nearness
    function addBeaconToNearbyBeacons(beaconData) {
        log('Found a close beacon')

        if (nearOrImmediateBeacons.length < 3) {
            log('There are less than 3 close beacons. Adding this one anyway')
            nearOrImmediateBeacons.push(beaconData);
        }
        else {
            log('There are already three close beacons. Checking this one')
            for (var i = 0; i < 3; i++) {
                if (nearOrImmediateBeacons[i].proximity > beaconData.proximity) {
                    log('Beacon ' + beaconData.major + ', ' + beaconData.minor + ' will replace' + nearOrImmediateBeacons[i].major + ', ' + nearOrImmediateBeacons[i].minor)
                    nearOrImmediateBeacons[i] = beaconData;
                    return;
                }
            }
        }
    }

    initBluetooth();
    var beaconReagon = createBeaconReagon(universal_uuid, identifier);
    setupDelegateToRegionBR(beaconReagon);

    return {
        init: init,
        nearOrImmediateBeacons: nearOrImmediateBeacons,
        position: position
    }

}])
