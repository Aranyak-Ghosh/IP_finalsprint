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
                $rootScope.$broadcast('server-register-success', { username: username });
            })
                .catch(function (error) {
                    console.log('Server request to register failed')
                    $rootScope.$broadcast('server-register-failed');
                })
        }

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
                url: URL + '/get-room',
                data: { /*uuid: uuid,*/ major: major }
            }
            $http(options).then(function (res) {
                console.log('Server requested room major: ' + major)
                var response = {
                    major: major,
                    beacons: [],
                    size:res.data.size
                    // position:{
                    //     x:res.position.x,
                    //     y:res.position.y
                    // }
                };
                if (res.data==null) return;
                for (var i = 0; i < res.data.beacons.length; i++) {
                    response.beacons.push(res.data.beacons[i]);
                }
                $rootScope.$broadcast('received-a-room', response);
            })
                .catch(function (error) {
                    console.log('Server request for room major: ' + major);
                })
        }
    })
