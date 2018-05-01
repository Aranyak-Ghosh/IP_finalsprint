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
    .factory('TriangulationBeaconsService', ['$timeout', '$rootScope',function ($timeout, $rootScope) {
        var CircularBuffer = require('circular-buffer');
        var beacons = {};
        var regions ={}; // Get all the regions from the server (identifiers and major/minors)

        console.log('TriangulationBeaconService factory is on')
        function log(message) {
            console.log(message);
        }

        try { //iBeacon Initializtation

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

            // create a delegate
            var delegate = new cordova.plugins.locationManager.Delegate();

            const bufferSize = 2;
            // called every second, there is a list of beacons inside data.beacons
            // will get called even if there are 0 beacons in the list
            delegate.didRangeBeaconsInRegion = function (pluginResult) {
                updateBeaconsObjectAtRanging(pluginResult);
                // console.log(JSON.stringify(pluginResult))
            };
            
            delegate.didEnterRegion = function(pluginResult){
                console.log('entered region');
                console.log(JSON.stringify(pluginResult));
            }

            delegate.didExitRegion = function(pluginResult){
                console.log('exited region');
                console.log(JSON.stringify(pluginResult));
            }

            var updateBeaconsObjectAtRanging = function (pluginResult) {
                // console.log('There are ' + pluginResult.beacons.length + ' beacons read');

                for (var i = 0; i < pluginResult.beacons.length; i++) {
                    var stats = require("stats-analysis") // include statistics library 
                    // creates an entry in the beacons JSON object for each beacon if it doesn't have one
                    if (!beacons['major' + pluginResult.beacons[i].major]) {
                        console.log('No entry in beacons for beacons with major = ' + pluginResult.beacons[i].major)
                        beacons['major' + pluginResult.beacons[i].major] = {};
                    }
                    if (!beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor]) {
                        console.log('No entry in beacons[major' + pluginResult.beacons[i].major + '] for beacons with minor = ' + pluginResult.beacons[i].minor)
                        beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor] = {}
                    }

                    // enques the last seen RSSI
                    beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor].rssi = pluginResult.beacons[i].rssi;
                    // adds the proximity level (might need?)
                    beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor].proximity = pluginResult.beacons[i].proximity;
                    // adds tx as well
                    beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor].tx = pluginResult.beacons[i].tx;
                    // if no distances buffer is created, create one
                    if (!beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor].buffer) {
                        console.log('There was no buffer for beacon ' + i)
                        beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor].buffer = new CircularBuffer(bufferSize);
                    }
                    beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor].buffer.enq(
                        calculateDistanceFromBeacon(beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor].tx,
                            beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor].rssi
                        ))

                    beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor].distance =
                        stats.mean(/*stats.filterOutliers(*/beacons['major' + pluginResult.beacons[i].major]['minor' + pluginResult.beacons[i].minor].buffer.toarray()/*)*/).toFixed(2) * 1;
                    
                }




                // console.log(JSON.stringify(beacons));
                $rootScope.$apply();

            }

            function add(a, b) {
                return a + b;
            }

            function calculateDistanceFromBeacon(tx, rssi) {
                return Math.pow(10, (tx - rssi) / (10 * 2.25));
            }

            //set the delegate
            cordova.plugins.locationManager.setDelegate(delegate);

            var uuid = "b9407f30-f5f8-466e-aff9-25556b57fe6d";
            // var identifier = "c3b74ba25c022e0bb33aa2e2e0004728"; //"bfb7d7eb384e6f18469c02836cd41813";
            var identifier = "sdf"
            var minor = 1; //45968;
            var major = 1;//33300;

            var beaconRegion;

            try {
                beaconRegion = new cordova.plugins.locationManager.BeaconRegion(identifier, uuid);
            }
            catch (err) {

            }

            // // required in iOS 8+
            // //cordova.plugins.locationManager.requestWhenInUseAuthorization(); 
            // // or cordova.plugins.locationManager.requestAlwaysAuthorization()

            cordova.plugins.locationManager.startMonitoringForRegion(beaconRegion)
                .fail(function(e){
                    console.error(e);
                })
                .done();
            cordova.plugins.locationManager.startRangingBeaconsInRegion(beaconRegion)
                .fail(function (e) {
                    console.error(e);
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
        var position = { pos: [] }
        var updating = false;
        var updatePosition = function () {
            if (beacons.major1.minor6478 && beacons.major1.minor1 && beacons.major1.minor14867) {
                console.log('renewing position');
                var a = { lon: 55.493614200000025, lat: 25.3126148 }
                a.dist = beacons.major1.minor1.distance;
                var b = { lon: 55.49362150000002, lat: 25.3126241 }
                b.dist = beacons.major1.minor14867.distance;
                var c = { lon: 55.493621899999994, lat: 25.3126303 }
                c.dist = beacons.major1.minor6478.distance;
                position.pos = trilaterate([a, b, c]);
                console.log(JSON.stringify(position));
                var trilateration = require('../../node_modules/trilateration/index.js');
                trilateration.addBeacon(0, trilateration.vector(0,))
            }
            $timeout(updatePosition, 5000);
        };



        // var trilaterate = function (points) {
        //     var math = require('mathjs')

        //     // #assuming elevation = 0
        //     var earthR = 6371
        //         , rad = function (deg) {
        //             return deg * (math.pi / 180)
        //         }
        //         , deg = function (rad) {
        //             return rad * (180 / math.pi)
        //         }

        //     // #using authalic sphere
        //     // #if using an ellipsoid this step is slightly different
        //     // #Convert geodetic Lat/Long to ECEF xyz
        //     // #   1. Convert Lat/Long to radians
        //     // #   2. Convert Lat/Long(radians) to ECEF
        //     var P1 = [earthR * (math.cos(rad(points[0].lat)) * math.cos(rad(points[0].lon)))
        //         , earthR * (math.cos(rad(points[0].lat)) * math.sin(rad(points[0].lon)))
        //         , earthR * (math.sin(rad(points[0].lat)))
        //     ]

        //     var P2 = [earthR * (math.cos(rad(points[1].lat)) * math.cos(rad(points[1].lon)))
        //         , earthR * (math.cos(rad(points[1].lat)) * math.sin(rad(points[1].lon)))
        //         , earthR * (math.sin(rad(points[1].lat)))
        //     ]

        //     var P3 = [earthR * (math.cos(rad(points[2].lat)) * math.cos(rad(points[2].lon)))
        //         , earthR * (math.cos(rad(points[2].lat)) * math.sin(rad(points[2].lon)))
        //         , earthR * (math.sin(rad(points[2].lat)))
        //     ]

        //     // #from wikipedia
        //     // #transform to get circle 1 at origin
        //     // #transform to get circle 2 on x axis
        //     var ex = math.divide(math.subtract(P2, P1), math.norm(math.subtract(P2, P1)))
        //     var i = math.dot(ex, math.subtract(P3, P1))

        //     var ey = math.divide(
        //         math.subtract(
        //             math.subtract(P3, P1),
        //             math.multiply(i, ex)
        //         ),
        //         math.norm(
        //             math.subtract(
        //                 math.subtract(P3, P1),
        //                 math.multiply(i, ex)
        //              )
        //         )
        //     )

        //     var ez = math.cross(ex, ey)
        //     var d = math.norm(math.subtract(P2, P1))
        //     var j = math.dot(ey, math.subtract(P3, P1))

        //     // #from wikipedia
        //     // #plug and chug using above values
        //     var x = (math.pow(Number(points[0].dist), 2) - math.pow(Number(points[1].dist), 2) + math.pow(Number(d), 2)) / (2 * d)
        //     var y = ((math.pow(Number(points[0].dist), 2) - math.pow(Number(points[2].dist), 2) + math.pow(Number(i), 2) + math.pow(Number(j), 2)) / (2 * j)) - ((i / j) * x)

        //     // # only one case shown here
        //     //
        //     // I was having problems with the number in the radical being negative,
        //     // so I took the absolute value. Not sure if this is always going to work
        //     var z = math.sqrt(math.abs(math.pow(points[0].dist, 2) - math.pow(x, 2) - math.pow(y, 2)))

        //     // #triPt is an array with ECEF x,y,z of trilateration point
        //     var triPt = math.add(
        //         math.add(
        //             math.add(P1,
        //                 math.multiply(x, ex)
        //             ),
        //             math.multiply(y, ey)
        //         ),
        //         math.multiply(z, ez)
        //     )

        //     // #convert back to lat/long from ECEF
        //     // #convert to degrees
        //     var lat = deg(math.asin(math.divide(triPt[2], earthR)))
        //     var lon = deg(math.atan2(triPt[1], triPt[0]))

        //     return [lat, lon]

        // }



        // function triangulate(a, b, c) { // each object is {lat, long, distance}
        //     var math = require('mathjs');
        //     // #assuming elevation = 0
        //     earthR = 6371
        //     LatA = a.latitude;
        //     LonA = a.longitude;
        //     DistA = a.distance
        //     LatB = b.latitude;
        //     LonB = b.longitude;
        //     DistB = b.distance
        //     LatC = c.latitude;
        //     LonC = c.longitude
        //     DistC = c.distance

        //     // #using authalic sphere
        //     // #if using an ellipsoid this step is slightly different
        //     // #Convert geodetic Lat/Long to ECEF xyz
        //     // #   1. Convert Lat/Long to radians
        //     // #   2. Convert Lat/Long(radians) to ECEF

        //     function radians(number) { return number * 3.1456 / 180; }
        //     function degrees(number) { return number * 180 / 3.1456; }
        //     xA = earthR * (Math.cos(radians(LatA)) * Math.cos(radians(LonA)))
        //     yA = earthR * (Math.cos(radians(LatA)) * Math.sin(radians(LonA)))
        //     zA = earthR * (Math.sin(radians(LatA)))

        //     xB = earthR * (Math.cos(radians(LatB)) * Math.cos(radians(LonB)))
        //     yB = earthR * (Math.cos(radians(LatB)) * Math.sin(radians(LonB)))
        //     zB = earthR * (Math.sin(radians(LatB)))

        //     xC = earthR * (Math.cos(radians(LatC)) * Math.cos(radians(LonC)))
        //     yC = earthR * (Math.cos(radians(LatC)) * Math.sin(radians(LonC)))
        //     zC = earthR * (Math.sin(radians(LatC)))

        //     P1 = math.matrix([xA, yA, zA])
        //     P2 = math.matrix([xB, yB, zB])
        //     P3 = math.matrix([xC, yC, zC])

        //     // #from wikipedia
        //     // #transform to get circle 1 at origin
        //     // #transform to get circle 2 on x axis
        //     ex = math.divide(math.subtract(P2, P1), math.norm(math.subtract(P2, P1)))
        //     i = math.dot(ex, math.subtract(P3, P1))
        //     ey = math.divide(math.subtract(math.subtract(P3, P1), (i * ex)), (math.norm(math.subtract(math.subtract(P3, P1), (i * ex)))))
        //     ez = math.cross(ex, ey)
        //     d = math.norm(math.subtract(P2, P1))
        //     j = math.dot(ey, math.subtract(P3, P1))

        //     // #from wikipedia
        //     // #plug and chug using above values
        //     x = (Math.pow(DistA, 2) - Math.pow(DistB, 2) + Math.pow(d, 2)) / (2 * d)
        //     y = ((Math.pow(DistA, 2) - Math.pow(DistC, 2) + Math.pow(i, 2) + Math.pow(j, 2)) / (2 * j)) - ((i / j) * x)

        //     // # only one case shown here
        //     z = Math.sqrt(Math.pow(DistA, 2) - Math.pow(x, 2) - Math.pow(y, 2))

        //     // #triPt is an array with ECEF x,y,z of trilateration point
        //     triPt = math.add(math.add(math.add(P1, (math.cross(x, ex)), math.cross(y, ey)), math.cross(z, ez)))


        //     // #convert back to lat/long from ECEF
        //     // #convert to degrees
        //     lat = degrees(math.asin(math.subset(triPt, math.index(2)) / earthR))
        //     lon = degrees(math.atan2(math.subset(triPt, math.index(1)), math.subset(triPt, math.index(0))))
        //     return { latitude: lat, longitude: lon };
        // }


        return {
            beacons: beacons,
            position: position
        }

    }])
},{"../../node_modules/trilateration/index.js":3,"circular-buffer":1,"stats-analysis":2}]},{},[4]);
