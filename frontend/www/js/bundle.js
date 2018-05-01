(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
function CircularBuffer(capacity){
	if(!(this instanceof CircularBuffer))return new CircularBuffer(capacity);
	if(typeof capacity=="object"&&
		Array.isArray(capacity["_buffer"])&&
		typeof capacity._capacity=="number"&&
		typeof capacity._first=="number"&&
		typeof capacity._size=="number"){
		for(var prop in capacity){
			if(capacity.hasOwnProperty(prop))this[prop]=capacity[prop];
		}
	} else {
		if(typeof capacity!="number"||capacity%1!=0||capacity<1)
			throw new TypeError("Invalid capacity");
		this._buffer=new Array(capacity);
		this._capacity=capacity;
		this._first=0;
		this._size=0;
	}
}

CircularBuffer.prototype={
	size:function(){return this._size;},
	capacity:function(){return this._capacity;},
	enq:function(value){
		if(this._first>0)this._first--; else this._first=this._capacity-1;
		this._buffer[this._first]=value;
		if(this._size<this._capacity)this._size++;
	},
	push:function(value){
		if(this._size==this._capacity){
			this._buffer[this._first]=value;
			this._first=(this._first+1)%this._capacity;
		} else {
			this._buffer[(this._first+this._size)%this._capacity]=value;
			this._size++;
		}
	},
	deq:function(){
		if(this._size==0)throw new RangeError("dequeue on empty buffer");
		var value=this._buffer[(this._first+this._size-1)%this._capacity];
		this._size--;
		return value;
	},
	pop:function(){return this.deq();},
	shift:function(){
		if(this._size==0)throw new RangeError("shift on empty buffer");
		var value=this._buffer[this._first];
		if(this._first==this._capacity-1)this._first=0; else this._first++;
		this._size--;
		return value;
	},
	get:function(start,end){
		if(this._size==0&&start==0&&(end==undefined||end==0))return [];
		if(typeof start!="number"||start%1!=0||start<0)throw new TypeError("Invalid start");
		if(start>=this._size)throw new RangeError("Index past end of buffer: "+start);

		if(end==undefined)return this._buffer[(this._first+start)%this._capacity];

		if(typeof end!="number"||end%1!=0||end<0)throw new TypeError("Invalid end");
		if(end>=this._size)throw new RangeError("Index past end of buffer: "+end);

		if(this._first+start>=this._capacity){
			//make sure first+start and first+end are in a normal range
			start-=this._capacity; //becomes a negative number
			end-=this._capacity;
		}
		if(this._first+end<this._capacity)
			return this._buffer.slice(this._first+start,this._first+end+1);
		else
			return this._buffer.slice(this._first+start,this._capacity).concat(this._buffer.slice(0,this._first+end+1-this._capacity));
	},
	toarray:function(){
		if(this._size==0)return [];
		return this.get(0,this._size-1);
	}
};

module.exports=CircularBuffer;

},{}],2:[function(require,module,exports){
'use strict';

(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod);
    global.stats = mod.exports;
  }
})(this, function (module) {
  var outlierMethod = {
    MAD: 'MAD',
    medianDiff: 'medianDiff'
  };

  function mean(arr) {
    return arr.reduce(function (prev, curr) {
      return prev + curr;
    }) / arr.length;
  }

  function variance(arr) {
    var dataMean = mean(arr);
    return mean(arr.map(function (val) {
      return Math.pow(val - dataMean, 2);
    }));
  }

  function stdev(arr) {
    return Math.sqrt(variance(arr));
  }

  function median(arr) {
    var half = Math.floor(arr.length / 2);
    arr = arr.slice(0).sort(numSorter);

    if (arr.length % 2) {
      return arr[half];
    } else {
      return (arr[half - 1] + arr[half]) / 2.0;
    }
  }

  function medianAbsoluteDeviation(arr, dataMedian) {
    dataMedian = dataMedian || median(arr);
    var absoluteDeviation = arr.map(function (val) {
      return Math.abs(val - dataMedian);
    });
    return median(absoluteDeviation);
  }

  function numSorter(a, b) {
    return a - b;
  }

  function isMADoutlier(val, threshold, dataMedian, dataMAD) {
    return Math.abs(0.6745 * (val - dataMedian) / dataMAD) > threshold;
  }

  function indexOfMADoutliers(arr, threshold) {
    threshold = threshold || 3.5;
    var dataMedian = median(arr);
    var dataMAD = medianAbsoluteDeviation(arr, dataMedian);
    return arr.reduce(function (res, val, i) {
      if (isMADoutlier(val, threshold, dataMedian, dataMAD)) {
        res.push(i);
      }

      return res;
    }, []);
  }

  function filterMADoutliers(arr, threshold) {
    threshold = threshold || 3.5;
    var dataMedian = median(arr);
    var dataMAD = medianAbsoluteDeviation(arr, dataMedian);
    return arr.filter(function (val) {
      return !isMADoutlier(val, threshold, dataMedian, dataMAD);
    });
  }

  function differences(arr) {
    return arr.map(function (d, i) {
      return Math.round(Math.abs(d - (arr[i - 1] || d[0]))) + 1;
    });
  }

  function isMedianDiffOutlier(threshold, difference, medianDiff) {
    return difference / medianDiff > threshold;
  }

  function indexOfMedianDiffOutliers(arr, threshold) {
    threshold = threshold || 3;
    var differencesArr = differences(arr);
    var medianDiff = median(differencesArr);
    return arr.reduce(function (res, val, i) {
      if (isMedianDiffOutlier(threshold, differencesArr[i], medianDiff)) {
        res.push(i);
      }

      return res;
    }, []);
  }

  function filterMedianDiffOutliers(arr, threshold) {
    threshold = threshold || 3;
    var differencesArr = differences(arr);
    var medianDiff = median(differencesArr);
    return arr.filter(function (_, i) {
      return !isMedianDiffOutlier(threshold, differencesArr[i], medianDiff);
    });
  }

  function filterOutliers(arr, method, threshold) {
    switch (method) {
      case outlierMethod.MAD:
        return filterMADoutliers(arr, threshold);

      default:
        return filterMedianDiffOutliers(arr, threshold);
    }
  }

  function indexOfOutliers(arr, method, threshold) {
    switch (method) {
      case outlierMethod.MAD:
        return indexOfMADoutliers(arr, threshold);

      default:
        return indexOfMedianDiffOutliers(arr, threshold);
    }
  }

  module.exports = {
    stdev: stdev,
    mean: mean,
    median: median,
    MAD: medianAbsoluteDeviation,
    numSorter: numSorter,
    outlierMethod: outlierMethod,
    filterOutliers: filterOutliers,
    indexOfOutliers: indexOfOutliers,
    filterMADoutliers: filterMADoutliers,
    indexOfMADoutliers: indexOfMADoutliers,
    filterMedianDiffOutliers: filterMedianDiffOutliers,
    indexOfMedianDiffOutliers: indexOfMedianDiffOutliers
  };
});
},{}],3:[function(require,module,exports){
// Generated by CoffeeScript 1.8.0
(function() {
  var beacons, sqr;

  beacons = [];

  sqr = function(a) {
    return Math.pow(a, 2);
  };

  exports.vector = function(x, y) {
    return {
      x: x,
      y: y
    };
  };

  exports.setDistance = function(index, distance) {
    beacons[index].dis = distance;
  };

  exports.addBeacon = function(index, position) {
    beacons[index] = position;
  };

  exports.calculatePosition = function() {
    var j, k, x, y;
    if (beacons.length < 3) {
      console.error("Error! Please add at least three beacons!");
      return exports.vector(0, 0);
    }
    k = (sqr(beacons[0].x) + sqr(beacons[0].y) - sqr(beacons[1].x) - sqr(beacons[1].y) - sqr(beacons[0].dis) + sqr(beacons[1].dis)) / (2 * (beacons[0].y - beacons[1].y)) - (sqr(beacons[0].x) + sqr(beacons[0].y) - sqr(beacons[2].x) - sqr(beacons[2].y) - sqr(beacons[0].dis) + sqr(beacons[2].dis)) / (2 * (beacons[0].y - beacons[2].y));
    j = (beacons[2].x - beacons[0].x) / (beacons[0].y - beacons[2].y) - (beacons[1].x - beacons[0].x) / (beacons[0].y - beacons[1].y);
    x = k / j;
    y = ((beacons[1].x - beacons[0].x) / (beacons[0].y - beacons[1].y)) * x + (sqr(beacons[0].x) + sqr(beacons[0].y) - sqr(beacons[1].x) - sqr(beacons[1].y) - sqr(beacons[0].dis) + sqr(beacons[1].dis)) / (2 * (beacons[0].y - beacons[1].y));
    return exports.vector(x, y);
  };

}).call(this);

},{}],4:[function(require,module,exports){
angular.module('angularApp')
    /*
    * Application to server interface
    * requests all projects 
    * requests a route with a project ID and user location
    * requests a route using a destination coordinate and user location
    */
    .service('ServerInterfaceService', function ($rootScope, $http) {
        var URL = 'http://localhost:3005';
        this.testInterface = function () {
            return 'testing server interface';
        }


        /*
        * Sends a login request to the server
        */
        this.serverLogin = function (un, pw) {
            var options = {
                method: 'POST',
                url: URL + '/login',
                data: { username: un, password: pw }
            }
            $http(options).then(function () {
                console.log('Server request to login succeeded')
                $rootScope.$broadcast('server-login-success', { username: un });
            })
                .catch(function (error) {
                    console.log('Server request to login failed')
                    $rootScope.$broadcast('server-login-failed');
                })
        }

        /*
        * Sends a logout request to the server
        */
        this.serverLogout = function (un) {
            var options = {
                method: 'POST',
                url: URL + '/logout',
                data: { username: un }
            };
            $http(options).then(function () {
                console.log('Server request to logout succeeded');
                $rootScope.$broadcast('server-logout-succeeded');
            })
                .catch(function (error) {
                    console.log('Server request to log out failed');
                    $rootScope.$broadcast('server-lougout-failed');
                })
        }


        /*
        * returns a list of all projects or null if there's an error
        */
        this.requestProjects = function () {
            var options = {
                method: 'GET',
                url: URL
            }
            $http(options)
                .then(function (res) {
                    console.log('Recieved a response to project request');
                    var projects = JSON.parse(res);
                    return projects;
                })
                .catch(function (error) {
                    console.log('Error while requesting projects: ' + error);
                })
        }

        /*
        * returns a route of x,y coordinates or null if there's an error
        */
        this.requestARoute = function (projectID, location) {
            var options = {
                method: 'POST',
                url: URL + '/request_route',
                data: { projectID: projectID, location: { x: location.x, y: location.y } }
            }

            $http(options)
                .then(function (response) {
                    console.log('Recieved a response to route request');
                    var route = JSON.parse(response);
                    console.log('Route: ' + JSON.stringify(route));
                    return route;
                })
                .catch(function (error) {
                    console.log('Error while requesting route: ' + error);
                })
        }

        /*
        * returns a route of x,y coordinates or null if there's an error
        */
        this.requestAReroute = function (currentLocation, destination) {
            var options = {
                method: "POST",
                url: URL + '/request_reroute',
                data: {
                    destination: { x: destination.x, y: destination.y },
                    location: { x: currentLocation.x, y: currentLocation.y }
                }
            }
            $http(option)
                .then(function (response) {
                    console.log('Recieved a response to reroute request');
                    var route = JSON.parse(response);
                    console.log('Route: ' + route);
                    return route;
                })
                .catch(function (error) {
                    console.log('Error while requesting reroute: ' + error)
                })
        }
    })

    .service('UserService', function ($rootScope, ServerInterfaceService) {
        var storage = window.localStorage;
        var loggedInKey = 'loggedIn';
        var usernameKey = 'username';
        var loggedIn = storage.getItem(loggedInKey);
        var username = storage.getItem(usernameKey);


        /*
        * Starts the log in process by sending a login request to the ServerInterface
        */
        this.initiateLogin = function (username, password) {
            console.log('Attempting login with UN: ' + username + ' PW: ' + password);
            ServerInterfaceService.serverLogin(username, password);
        }

        /*
        * Starts the log out process by sending a logout request to the ServerInterface
        */
        this.initiateLogout = function () {
            console.log('Attempting logout of UN: ' + username);
            ServerInterfaceService.serverLogout(username);
        }

        /*
        * Broadcast listener to successful login from ServerInterface
        */
        $rootScope.$on('server-login-success', function (event, args) {
            loggedIn = true;
            storage.setItem(loggedInKey, loggedIn);
            username = args.username;
            storage.setItem(usernameKey, username)
            $rootScope.$broadcast('login-succeeded', { username: username });
            console.log('Logged in UN: ' + username)
        })

        /*
        * Broadcast listener to failed login from ServerInterface
        */
        $rootScope.$on('server-login-failed', function (event) {
            $rootScope.$broadcast('login-failed');
        })

        /*
        * Broadcast listener to successful logout from ServerInterface
        */
        $rootScope.$on('server-logout-succeeded', function (event) {
            loggedIn = false;
            storage.removeItem(loggedInKey);
            username = null;
            storage.removeItem(usernameKey);
            $rootScope.$broadcast('logout-succeeded')
            console.log('Logged out');
        })

        /*
        * Broadcast listener to failed logout from ServerInterface
        */
        $rootScope.$on('server-logout-failed', function (event) {
            $rootScope.$broadcast('logout-failed');
        })



    })
    // Factory to monitor the location of the user
    .factory('TriangulationLocationServicesFactory', function ($rootScope) {
        var positionModel = { longitude: 0, latitude: 0 };
        console.log('Triangulation factory initiated')

        var maximumAge = 3600000;
        var options = {
            enableHighAccuracy: true,
            maximumAge: maximumAge
        }

        var onSuccess = function (position) {
            positionModel.longitude = position.coords.longitude;
            positionModel.latitude = position.coords.latitude;
            console.log('Triangulation: location changed to: ' + positionModel.latitude + ', ' + positionModel.longitude);
        }

        var onError = function (positionError) {
            console.log('TriangulationService ERROR. Code: ' + positionError.code + ' message: ' + positionError.message);
        }

        var watchID = navigator.geolocation.watchPosition(onSuccess, onError, options);

        return {
            position: positionModel, // an object containing the long and lat of the user
            endWatch: function () { // function to end monitoring position
                navigator.geolocation.clearWatch(watchID);
            },
            restartWatch: function () { // function to restart monitoring of positin
                watchID = navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
            }
        }
    })


    /*
                            Get all regions' data from the server
                            Monitor all regions
                            once you enter a region -> 
                                start ranging its beacons
                                Get absolute position of user
                            Get within range of a region
                            Download that regions info from the database
                            start ranging them and getting the exact location of the user
    */




    // this factory will continiously return the beacons near it and the distances from these beacons.
    // Calculating the distances from each beacon will take into account the proximity factor and RSSI.  
    // After getting each beacon's distance and, having their absolute position, the absolute position 
    // of the user is returned.

    // Exposes: beacons: a JSON reference to all nearby beacons
    //          position: x, y of the user relative to the system's grid
    .factory('TriangulationBeaconsService', ['$timeout', '$rootScope', function ($timeout, $rootScope) {
        var beacons = {};
        var position = {};
        var nearOrImmediateBeacons = [];
        var beaconTag = "BEACON: ";
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

        var universal_uuid = "b9407f30-f5f8-466e-aff9-25556b57fe6d";
        var identifier = "sdf"
        var minor = 1; //45968;
        var major = 2; //33300;
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
                    resetNearbyBeaconsList();
                    // console.log('There are ' + pluginResult.beacons.length + ' beacons read');
                    var CircularBuffer = require('circular-buffer');
                    for (var i = 0; i < pluginResult.beacons.length; i++) {
                        var stats = require("stats-analysis") // include statistics library 
                        // creates an entry in the beacons JSON object for each beacon if it doesn't have one
                        if (!beacons['major' + pluginResult.beacons[i].major]) {
                            log('No entry in beacons for beacons with major = ' + pluginResult.beacons[i].major)
                            beacons['major' + pluginResult.beacons[i].major] = {};
                        }
                        if (!beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor]) {
                            log('No entry in beacons[major' + pluginResult.beacons[i].major + '] for beacons with minor = ' + pluginResult.beacons[i].minor)
                            beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor] = {}
                        }

                        // enques the last seen RSSI
                        beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor].rssi = pluginResult.beacons[i].rssi;
                        // adds the proximity level (might need?)
                        beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor].proximity = pluginResult.beacons[i].proximity;
                        // adds tx as well
                        beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor].tx = pluginResult.beacons[i].tx;
                        beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor].major = pluginResult.beacons[i].major;
                        beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor].minor = pluginResult.beacons[i].minor;

                        // if no distances buffer is created, create one
                        if (!beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor].buffer) {
                            log('There was no buffer for beacon ' + i)
                            beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor].buffer = new CircularBuffer(bufferSize);
                        }
                        beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor].buffer.enq(
                            calculateDistanceFromBeacon(beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor].tx,
                                beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor].rssi
                            ))
                        var proximity;
                        if (pluginResult.beacons[i].proximity == "ProximityNear")
                            proximity = 1;
                        else if (pluginResult.beacons[i].proximity == "ProximityImmediate")
                            proximity = 0;
                        else
                            proximity = 2;

                        beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor].proximity = proximity;

                        beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor].distance =
                            stats.mean(/*stats.filterOutliers(*/beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor].buffer.toarray()/*)*/).toFixed(2) * 1;

                        if (proximity<2) {
                            addBeaconToNearbyBeacons(beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor]);
                            log(JSON.stringify(beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor]));
                        }
                        
                    }

                    function add(a, b) {
                        return a + b;
                    }

                    function calculateDistanceFromBeacon(tx, rssi) {
                        return Math.pow(10, (tx - rssi) / (10 * 2.25));
                    }

                    setPosition();

                    // console.log(JSON.stringify(beacons));
                    $rootScope.$apply();

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

        function resetNearbyBeaconsList() {
            nearOrImmediateBeacons = [];
        }

        function addBeaconToNearbyBeacons(beaconData) {
            log('Found a close beacon')
            
            if (nearOrImmediateBeacons.length < 3) {
                log('There are less than 3 close beacons. Adding this one anyway')
                nearOrImmediateBeacons.push(beaconData);
            }
            else {
                log('There are already three close beacons. Checking this one')
                for (var i = 0; i < 3; i++) {
                    if (nearOrImmediateBeacons[i].proximity>beaconData.proximity){
                        log('Beacon '+beaconData.major+', '+beaconData.minor + ' will replace' + nearOrImmediateBeacons[i].major+ ', ' + nearOrImmediateBeacons[i].minor)
                        nearOrImmediateBeacons[i] = beaconData;
                        return;
                    }
                }
            }
        }

        // sets position of user relative to system's grid using 'beacons' information
        function setPosition() {
            if (nearOrImmediateBeacons.length >= 3) {
                var beacon0 = {};
                var beacon0x = beaconPosition['major' + nearOrImmediateBeacons[0].major]['minor' + nearOrImmediateBeacons[0].minor].x;
                var beacon0y = beaconPosition['major' + nearOrImmediateBeacons[0].major]['minor' + nearOrImmediateBeacons[0].minor].y;
                var beacon0distance = nearOrImmediateBeacons[0].distance;
                var beacon1 = {};
                var beacon1x = beaconPosition['major' + nearOrImmediateBeacons[1].major]['minor' + nearOrImmediateBeacons[1].minor].x;
                var beacon1y = beaconPosition['major' + nearOrImmediateBeacons[1].major]['minor' + nearOrImmediateBeacons[1].minor].y;
                var beacon1distance = nearOrImmediateBeacons[1].distance;
                var beacon2 = {};
                var beacon2x = beaconPosition['major' + nearOrImmediateBeacons[2].major]['minor' + nearOrImmediateBeacons[2].minor].x;
                var beacon2y = beaconPosition['major' + nearOrImmediateBeacons[2].major]['minor' + nearOrImmediateBeacons[2].minor].y;
                var beacon2distance = nearOrImmediateBeacons[2].distance;
                var trilateration = require('../../node_modules/trilateration/index.js');
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
                // }
            } else {
                log('Not enough nearby beacons');
            }
        }

        initBluetooth();
        var beaconReagon = createBeaconReagon(universal_uuid, identifier, major);
        setupDelegateToRegionBR(beaconReagon);



        return {
            beacons: beacons,
            position: position
        }

    }])
},{"../../node_modules/trilateration/index.js":3,"circular-buffer":1,"stats-analysis":2}]},{},[4]);
