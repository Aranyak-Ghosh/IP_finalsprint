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
require('./services/triangulation/BeaconPositionsFactory.js');
require('./services/triangulation/CenterlizationService');
require('./services/triangulation/RealtimeBeaconDistancesService');
require('./services/triangulation/TriangulationService');
require('./services/NavigationService.js');
require('./services/ProjectsService.js');
require('./services/RoomInfoFactory.js');
require('./services/ServerInterfaceService.js');
require('./services/TriangulationLocationService.js');
require('./services/UserService.js');
},{"./services/NavigationService.js":5,"./services/ProjectsService.js":6,"./services/RoomInfoFactory.js":7,"./services/ServerInterfaceService.js":8,"./services/TriangulationLocationService.js":9,"./services/UserService.js":10,"./services/triangulation/BeaconPositionsFactory.js":11,"./services/triangulation/CenterlizationService":12,"./services/triangulation/RealtimeBeaconDistancesService":13,"./services/triangulation/TriangulationService":14}],5:[function(require,module,exports){
angular.module('angularApp').service('NavigationService', function () {

})
},{}],6:[function(require,module,exports){
// Will contain the paths of all the projects of this deployment
angular.module('angularApp').factory('ProjectsService', function ($rootScope, ServerInterfaceService) {
    var projectsLog = 'PROJECTS SERVICE: ';
    var projectsKey = 'PROJECTS';
    var storage = window.localStorage;

    var projects = [];
    var log = function (message) {
        console.log(projectsLog + message);
    }

    // retrieves projects which are saved in the local storage
    var fetchProjectsFromStorage = function () {
        log('fetching projects data from local storage')
        var p = JSON.parse(storage.getItem(projectsKey));
        if (p) {
            tempArray = [];
            log('Fetched projects from local storage ');
            p.forEach(element => {
                tempArray.push(element);
                log('Found in storage: ' + JSON.stringify(element));
            });
            projects = tempArray;

        } else {
            log('There are no projects stored in local storage');
        }
    }

    // updates the local storage with new project object
    var updateLocalStorage = function () {
        console.log('storing project data in local storage');
        storage.setItem(projectsKey, JSON.stringify(projects));
    }
    var log = function (message) {
        console.log(projectsLog + message);
    }
    // called when new projects are recieved from server
    $rootScope.$on('server-recieved-projects', function (event, args) {
        log('recieved all projects');
        addNewProjects(args.projects);
    })

    // $rootScope.$on('saved-image', function(event,args){
    //     log('an image was saved in local storage for '+args.route);
    //     $rootScope.$broadcast('show-image', {route:route});
    // })

    function addNewProjects(newProjects) {
        log('Overwriting old projects');
        projects = newProjects;
        projects.forEach(element => {
            log('recieved project:' + JSON.stringify(element));
            // ServerInterfaceService.requestOneProjectImage(element.route);
        });
        updateLocalStorage();
    }

    var init = function () {
        log('initializing ProjectsService');
        fetchProjectsFromStorage();
    }

    // should become an ID
    var requestOneProjectImage = function (title) {
        log('Attempting to fetch image of project' + title);
        if (projects.length > 0) {
            projects.forEach((element) => {
                if (element.title === title) {
                    log('Project ' + title + ' loaded. requesting image ...');
                    ServerInterfaceService.requestOneProjectImage(element.route);
                    return;
                }
            })
            log('Could not find project ' + title + ' in storage')
        }
        else {
            log('Project: ' + title + ' is not store');
        }
    }

    var requestAllProjects = function () {
        log('requesting all projects from server');
        ServerInterfaceService.requestProjects();
    }

    var returnProjectArray = function () {
        return projects;
    }

    return {
        returnProjectArray:returnProjectArray,
        init: init,
        requestAllProjects: requestAllProjects
    }

})

},{}],7:[function(require,module,exports){

    angular.module('angularApp').factory('RoomInfoFactory', function (ServerInterfaceService) {
        var roomImages
    })

},{}],8:[function(require,module,exports){
angular.module('angularApp')
    /*
    * Application to server interface
    * requests all projects
    * requests a route with a project ID and user location
    * requests a route using a destination coordinate and user location
    */
    .service('ServerInterfaceService', function ($rootScope, $http) {
        var URL = 'http://10.25.156.58:8080';
        var serverLogKey = 'SERVER INTERFACE: ';
        function log(message) {
            console.log(serverLogKey + message);
        }

        /*
        * Sends a login request to the server
        */
        this.serverLogin = function (un, pw) {
            log('username: ' + un + ', pw: ' + pw);
            // HTTP options
            var options = {
                method: 'POST',
                url: URL + '/attemptLogin',
                data: { username: un, password: pw }
            }
            log('options: ' + JSON.stringify(options));
            // Sends http post request
            $http(options).then(function (resp) {
              // checks the response to determine the action
                if (!(resp.data === 'Incorrect Password')) {
                    log('Server request to login succeeded')
                    token = resp.data;
                    log('Token: ' + token);
                    // Since the request is async, the UI thread does not wait for the completion of the requests
                    // Instead, once the request is over, it will send a broadcast with the token
                    $rootScope.$broadcast('server-login-success', { username: un, token: token });
                }
                else {
                    loginFailed('wrong password');
                }
            })
                .catch(function (error) {
                    loginFailed('server error')
                });


            function loginFailed(message) {
                console.log('Server request to login failed: '+message)
                $rootScope.$broadcast('server-login-failed', {message:message});
            }

        }

        /*
        * Sends a logout request to the server
        */
        this.serverLogout = function (token) {
            var options = {
                method: 'POST',
                url: URL + '/logout',
                data: { token: token }
            };
            $http(options).then(function (res) {
                log('logout response: '+res.data);
                if (res.data === 'logged out') {
                    console.log('Server request to logout succeeded');
                    $rootScope.$broadcast('server-logout-succeeded');
                }
                else {
                    console.log('Server request to logout succeeded but user is already logged out');
                    $rootScope.$broadcast('server-logout-failed', { message: 'already logged out' });
                }
            })
                .catch(function (error) {
                    console.log('Server request to log out failed');
                    $rootScope.$broadcast('server-logout-failed', { message: 'server error' });
                })
        }

        /*
        * sends a registration request to the server
        */
        this.serverRegister = function (username, password, email) {
            var options = {
                method: 'POST',
                url: URL + '/attemptRegister',
                data: { username: username, password: password, email: email }
            }
            $http(options).then(function () {
                console.log('Server request to register succeeded')
                $rootScope.$broadcast('server-register-success', { username: un });
            })
                .catch(function (error) {
                    console.log('Server request to register failed')
                    $rootScope.$broadcast('server-register-failed');
                })
        }

        // caching image - won't do it
        
        // // request a project's image and store the file in storage based on the key
        // this.requestOneProjectImage = function(route){
        //     var options = {
        //         method: 'GET',
        //         url: URL + route,
        //     }
        //     $http(options).then(function(response){
        //         log('recieved the image from route '+route);
        //         window.localStorage.setItem(route, response.data);
        //         $rootScope.$broadcast('saved-image', {route: route});
        //         //log(data.data);
        //     })
        //     .catch(function(error){
        //         log('Could not fetch image from route: '+route+' error: '+ JSON.stringify(error));
        //     })
        // }

        /*
        * returns a list of all projects or null if there's an error
        */
        this.requestProjects = function () {
            log('requisting all projects')
            var options = {
                method: 'GET',
                url: URL+'/listallprojects',
            }
            $http(options)
                .then(function (res) {
                    console.log('Recieved a response to project request');
                    var projects = res.data.payload;
                    $rootScope.$broadcast('server-recieved-projects', {projects: projects})
                    // log(JSON.stringify(projects));
                })
                .catch(function (error) {
                    console.log('Error while requesting projects: ' + JSON.stringify(error));
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

        this.requestARoomWithMajor = function (uuid, major) {
            var options = {
                method: 'POST',
                url: URL + '/requestARoom',
                data: { uuid: uuid, major: major }
            }
            $http(options).then(function (res) {
                console.log('Server requested room major: ' + major)
                var response = {
                    major: major,
                    minors: []
                };
                for (var i = 0; i < res.minors.length; i++) {
                    response.minors.push(res.minors[i]);
                }

                $rootScope.$broadcast('received-a-room', response);
            })
                .catch(function (error) {
                    console.log('Server request for room major: ' + major);
                })
        }
    })

},{}],9:[function(require,module,exports){

    // Factory to monitor the location of the user
    angular.module('angularApp').factory('TriangulationLocationServicesFactory', function ($rootScope) {
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
},{}],10:[function(require,module,exports){
// Exposes: 
    // loggedIn: boolean - Indicates whether user is logged in or not 
    // initiateLogin(username, password): void - starts login process
    // initiateLogout(): void - Initiates logout process
    angular.module('angularApp').service('UserService', function ($rootScope, ServerInterfaceService) {
        // This service keeps track of all user related info, including login status,
        // encrypted token (for persistancy), and all the functions required
          var storage = window.localStorage; // local storage reference
          var tokenKey = 'TOKEN';
          var userKey = 'USER';
          var token = storage.getItem(tokenKey); // fetches token from local storage
          var username = storage.getItem(userKey);
          this.loggedIn = false;
          if (token) // if the token exists in local memory, it will set the loggedIn to true
              this.loggedIn = true;
  
  
          /*
          * Starts the log in process by sending a login request to the ServerInterface
          */
          this.initiateLogin = function (username, password) {
              console.log('Attempting login with UN: ' + username + ' PW: ' + password);
              // This will send the log in request to the ServerInterfaceService, which is an
              // HTTP client that communicates with the cloud service
              ServerInterfaceService.serverLogin(username, password);
          }
  
          /*
          * Starts the log out process by sending a logout request to the ServerInterface
          */
          this.initiateLogout = function () {
              console.log('Attempting logout of UN: ' + username);
              ServerInterfaceService.serverLogout(token);
          }
  
          /*
          * Broadcast listener to successful login from ServerInterface
          */
          $rootScope.$on('server-login-success', function (event, args) {
              this.loggedIn = true;
              token = args.token;
              username = args.username;
              storage.setItem(tokenKey, token);
              storage.setItem(userKey, username);
              // Sends a boradcast to the UI to inform it of succesful login
              $rootScope.$broadcast('login-succeeded', { username: username });
          })
  
          /*
          * Broadcast listener to failed login from ServerInterface
          */
          $rootScope.$on('server-login-failed', function (event, args) {
              $rootScope.$broadcast('login-failed', {message:args.message});
          })
  
          /*
          * Broadcast listener to successful logout from ServerInterface
          */
          $rootScope.$on('server-logout-succeeded', function (event) {
              this.loggedIn = false;
              token = null;
              storage.removeItem(tokenKey);
              $rootScope.$broadcast('logout-succeeded')
              console.log('Logged out');
          })
  
          /*
          * Broadcast listener to failed logout from ServerInterface
          */
          $rootScope.$on('server-logout-failed', function (event, args) {
              $rootScope.$broadcast('logout-failed', { message: args.message });
          })
  
      })
  
},{}],11:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){
angular.module('angularApp').factory('CenterlizationService', function ($rootScope, ServerInterfaceService) {
return{};
})
},{}],13:[function(require,module,exports){
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

},{"circular-buffer":1,"stats-analysis":2}],14:[function(require,module,exports){
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
},{"../../../../node_modules/trilateration/index.js":3}]},{},[4]);
