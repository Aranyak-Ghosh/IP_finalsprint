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
    this.username = storage.getItem(userKey);
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
        this.username = args.username;
        storage.setItem(tokenKey, token);
        storage.setItem(userKey, username);
        // Sends a boradcast to the UI to inform it of succesful login
        $rootScope.$broadcast('login-succeeded', { username: username });
    })

    /*
    * Broadcast listener to failed login from ServerInterface
    */
    $rootScope.$on('server-login-failed', function (event, args) {
        $rootScope.$broadcast('login-failed', { message: args.message });
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
