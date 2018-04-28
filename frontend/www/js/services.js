angular.module('hybrid')
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
                data: { username: un, password:pw }
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
        this.serverLogout = function(un){
            var options = {
                method: 'POST',
                url: URL+ '/logout',
                data:{ username:un}
            };
            $http(options).then(function(){
                console.log('Server request to logout succeeded');
                $rootScope.$broadcast('server-logout-succeeded');
            })
            .catch(function(error){
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
        this.initiateLogout = function(){
            console.log('Attempting logout of UN: '+ username);
            ServerInterfaceService.serverLogout(username);
        }

        /*
        * Broadcast listener to successful login from ServerInterface
        */
        $rootScope.$on('server-login-success',  function (event, args) {
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
        $rootScope.$on('server-login-failed', function(event){
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
        $rootScope.$on('server-logout-failed', function(event){
            $rootScope.$broadcast('logout-failed');
        })
        


    })