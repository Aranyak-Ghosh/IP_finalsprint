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







    // this factory will continiously return the beacons near it and the distances from these beacons
    // Calculating the distances from each beacon will take into account the proximity factor and RSSI  
    // After getting each beacon's distance and, having their absolute position, the absolute position 
    // of the user is returned.
    .factory('TriangulationBeaconsService', function ($rootScope) {
    // location shit

    var domData = {message:''};

    var logToDom = function(message){
        domData.message+=message+'\n';
    }

    try { //iBeacon Initializtation

        try { // bluetooth is bound and ON
          // check to see if Bluetooth is ON, if not turn it ON
          cordova.plugins.locationManager.isBluetoothEnabled()
            .then(function (isEnabled) {
              logToDom("BLE isEnabled: " + isEnabled);
              if (isEnabled) {
                //cordova.plugins.locationManager.disableBluetooth();
              } else {
                cordova.plugins.locationManager.enableBluetooth();
              }
            })
            .fail(function (e) {
              //console.error(e);
            //   logToError("isBluetoothEnabled failed because: " + e);
            })
            .done();
        }
        catch (err) {
  
        //   logToError("ERROR Bluetooth:" + err.name + "->" + err.message);
        }
  
        // alert("cordova.plugins.locationManager" + cordova.plugins.locationManager);
  
        // create a delegate
        var delegate = new cordova.plugins.locationManager.Delegate();
  
        // // alert('$scope.delegate' + $scope.delegate);
  
        // // // called when user enters or exits a region
        delegate.didDetermineStateForRegion = function (pluginResult) {
  
         logToDom('[DOM] didDetermineStateForRegion: ' + JSON.stringify(pluginResult));
          cordova.plugins.locationManager.requestAlwaysAuthorization();
          cordova.plugins.locationManager.appendToDeviceLog('[DOM] didDetermineStateForRegion: '
            + JSON.stringify(pluginResult));
        };
  
        // // called when the monitoring starts
        var positionalVariables={beaconData:[]}; 
        // called every second, there is a list of beacons inside data.beacons
        // will get called even if there are 0 beacons in the list
        delegate.didRangeBeaconsInRegion = function (pluginResult) {
          logToDom('[DOM] didRangeBeaconsInRegion: ' + JSON.stringify(pluginResult));
  
          var distane = calculateDistanceFromBeacon(pluginResult.beacons[0].tx, pluginResult.beacons[0].rssi);
          for (var i =0; i< pluginResult.beacons.length; i++){
              beaconsAndDistances.beaconData.push({major: pluginResult.beacons[i].major, minor:pluginResult.beacons[i].minor,
                 proximity:pluginResult.beacons[i].proximity, distance: calculateDistanceFromBeacon(pluginResult.beacons[i].tx,pluginResult.beacons[i].rssi)});
          }
          logToDom('distance: '+ distane);
  
          $rootScope.$apply();
  
  
        };
        function calculateDistanceFromBeacon(tx, rssi) {
          return Math.pow(10, (tx - rssi) / 10 * 2.25);
        }
  
        //set the delegate
        cordova.plugins.locationManager.setDelegate($scope.delegate);
  
        // does not work - $scope.uuid = cordova.plugins.locationManager.BeaconRegion.WILDCARD_UUID;
        var uuid = "b9407f30-f5f8-466e-aff9-25556b57fe6d";
        var identifier = "c3b74ba25c022e0bb33aa2e2e0004728"; //"bfb7d7eb384e6f18469c02836cd41813";
        var minor = 1; //45968;
        var major = 1;//33300;
  
        var beaconRegion;
        //create a Region to monitor
        try {
  
          beaconRegion = new cordova.plugins.locationManager.BeaconRegion($scope.identifier, $scope.uuid, $scope.major, $scope.minor);
        }
        catch (err) {
  
        //   logToError("ERROR from cordova.plugins.locationManager.BeaconRegion:" + err.name + "->" + err.message);
        }
  
        // alert("beaconRegion:" + $scope.beaconRegion);
  
        // // required in iOS 8+
        // //cordova.plugins.locationManager.requestWhenInUseAuthorization(); 
        // // or cordova.plugins.locationManager.requestAlwaysAuthorization()
  
        cordova.plugins.locationManager.startRangingBeaconsInRegion(beaconRegion)
          .fail(function (e) {
            console.error(e);
        //   logToError("Fail: startMonitoringForRegion > " + e);
          })
          .done();
  
        // $scope.logToDom("Monitoring Started ....");
  
      }
      catch (err) { // try failed in iBeacon
  
        var vDebug = "";
        for (var prop in err) {
          vDebug += "property: " + prop + " value: [" + err[prop] + "]\n";
        }
        vDebug += "toString(): " + " value: [" + err.toString() + "]";
  
        // $scope.logToError("ERROR:" + err.name + "->" + err.message + " details:" + vDebug);
  
      }
        
        function triangulate(a, b, c) { // each object is {lat, long, distance}
            var math = require('mathjs');
            // #assuming elevation = 0
            earthR = 6371
            LatA = a.lat;
            LonA = a.long
            DistA = a.distance
            LatB = b.lat
            LonB = b.long
            DistB = b.distance
            LatC = c.lat
            LonC = c.long
            DistC = c.distance

            // #using authalic sphere
            // #if using an ellipsoid this step is slightly different
            // #Convert geodetic Lat/Long to ECEF xyz
            // #   1. Convert Lat/Long to radians
            // #   2. Convert Lat/Long(radians) to ECEF

            function radians(number) { return number * 3.1456 / 180; }
            function degrees(number) { return number * 180 / 3.1456; }
            xA = earthR * (Math.cos(radians(LatA)) * Math.cos(radians(LonA)))
            yA = earthR * (Math.cos(radians(LatA)) * Math.sin(radians(LonA)))
            zA = earthR * (Math.sin(radians(LatA)))

            xB = earthR * (Math.cos(radians(LatB)) * Math.cos(radians(LonB)))
            yB = earthR * (Math.cos(radians(LatB)) * Math.sin(radians(LonB)))
            zB = earthR * (Math.sin(radians(LatB)))

            xC = earthR * (Math.cos(radians(LatC)) * Math.cos(radians(LonC)))
            yC = earthR * (Math.cos(radians(LatC)) * Math.sin(radians(LonC)))
            zC = earthR * (Math.sin(radians(LatC)))

            P1 = math.matrix([xA, yA, zA])
            P2 = math.matrix([xB, yB, zB])
            P3 = math.matrix([xC, yC, zC])

            // #from wikipedia
            // #transform to get circle 1 at origin
            // #transform to get circle 2 on x axis
            ex = math.divide(math.subtract(P2, P1), math.norm(math.subtract(P2, P1)))
            i = math.dot(ex, math.subtract(P3, P1))
            ey = math.divide(math.subtract(math.subtract(P3, P1), i) * ex), (numpy.linalg.norm(P3 - P1 - i * ex))
            ez = math.cross(ex, ey)
            d = math.norm(math.subtract(P2, P1))
            j = math.dot(ey, math.subtract(P3 - P1))

            // #from wikipedia
            // #plug and chug using above values
            x = (Math.pow(DistA, 2) - Math.pow(DistB, 2) + Math.pow(d, 2)) / (2 * d)
            y = ((Math.pow(DistA, 2) - Math.pow(DistC, 2) + Math.pow(i, 2) + Math.pow(j, 2)) / (2 * j)) - ((i / j) * x)

            // # only one case shown here
            z = Math.sqrt(pow(DistA, 2) - Math.pow(x, 2) - Math.pow(y, 2))

            // #triPt is an array with ECEF x,y,z of trilateration point
            triPt = P1 + x * ex + y * ey + z * ez


            // #convert back to lat/long from ECEF
            // #convert to degrees
            lat = degrees(math.asin(triPt[2] / earthR))
            lon = degrees(math.atan2(triPt[1], triPt[0]))
            return { latitude: lat, longitude: lon };
        }


        return {
            dom: domData,
            distances: positionalVariables
        }

    })