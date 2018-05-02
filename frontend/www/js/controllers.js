angular.module('angularApp.controllers', [])
  // This is the controller of the side menu
  .controller('AppController', function (BeaconPositionsFactory, $rootScope, TriangulationLocationServicesFactory, UserService, $scope, $timeout, $ionicLoading) {

    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
    //$scope.$on('$ionicView.enter', function(e) {
    //});

    // Perform the login action when the user submits the login form

    // Log in form inputs
    $scope.credentials = {};

    // variables indicating currently logged in user information
    $scope.loggedIn = false;
    $scope.username = null;
    $scope.loadingLogin = false;
    $scope.model = { position: 0 };
    // var updateTimer = function(){
    //   console.log('updating time')
    //   $timeout(updateTimer, 5000);
    // }
    // updateTimer();
    // Broadcast listener to when user is finally Logged in
    $scope.$on('login-succeeded', function (event, args) {
      applyLogin(args.username);
    })

    // Broadcast listener to when log in fails
    $scope.$on('login-failed', function (event, args) {
      failedLogin();
    })

    // Broadcast listener to when user is logged out
    $scope.$on('logout-succeeded', function (event) {
      applyLogout();
    })

    // Broadcast listener to whe user logout fails
    $scope.$on('logout-failed', function (event) {
      failedLogout();
    })

    // Action when logout succeeds
    function applyLogout() {
      $scope.username = null;
      $scope.loggedIn = false;
    }

    // Action when logout fails
    function failedLogout() {
      $scope.error = 'Failed to log out';
    }

    // listener to logout button press
    $scope.pressLogout = function () {
      UserService.initiateLogout();
    }

    // might need?
    $scope.safeApply = function (fn) {
      var phase = this.$root.$$phase;
      if (phase == '$apply' || phase == '$digest') {
        if (fn && (typeof (fn) === 'function')) {
          fn();
        }
      } else {
        this.$apply(fn);
      }
    };

    // responds to succesful login
    function applyLogin(username) {
      // $scope.loadingLogin =false;
      // $scope.safeApply();
      $scope.username = username;
      $scope.loggedIn = true;
    }

    // responds to failed login
    function failedLogin(username) {
      // $scope.loadingLogin = false;
      $scope.error = 'Login failed';
      $scope.loggedIn = false;
    }

    // event at clicking login button
    $scope.pressLogin = function () {
      console.log('Pressed \'Login\'; UN: ' + $scope.credentials.username + ' PW: ' + $scope.credentials.password);
      if (!$scope.credentials.username)
        $scope.error = "Username field is empty";
      else if (!$scope.credentials.password)
        $scope.error = "Password field is empty";
      else {
        UserService.initiateLogin($scope.credentials.username, $scope.credentials.password);
        $scope.loadingLogin = true;
      }
    }

  })


  .controller('LandingController', function ($scope, BeaconPositionsFactory) {
    
  })

  // Controller of the explore page. This page will have all nearby beacon data available at all times as well as the maps and the 
  .controller('ExploreController', function ($timeout, $scope, ServerInterfaceService, TriangulationBeaconsService) {
    // $scope.rssi = { RSSI: TriangulationBeaconsService.rssi };
    console.log('explorer controller is on')
    $scope.dists = { distances: TriangulationBeaconsService.distances };

    $scope.beacons = { beacons: TriangulationBeaconsService.beacons };
    $scope.position = {pos: TriangulationBeaconsService.position};
    function logToDom(message) {
      $scope.dom += message + '\n';
    }
    var updateTimer = function () {
      console.log($scope.position.pos);
      $timeout(updateTimer, 5000);
    };
    updateTimer();
  });
