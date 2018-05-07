angular.module('angularApp.controllers', [])
  // This is the controller of the side menu
  .controller('AppController', function (UserService, $ionicModal, $rootScope, UserService, $scope, $timeout, $ionicLoading, ServerInterfaceService) {

    $scope.registerData={};
  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/register.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });
  // Open the login modal
  $scope.register = function() {
    $scope.modal.show();
  };
    // Triggered in the login modal to close it
    $scope.closeRegister = function() {
      $scope.modal.hide();
    };
    $scope.doRegister = function() {
      console.log('Doing registration', $scope.registerData);
      ServerInterfaceService.serverRegister($scope.registerData.username, $scope.registerData.password, $scope.registerData.email)
      // Simulate a login delay. Remove this and replace with your login
      // code if using a login system
    };

    $scope.$on('server-register-success', function(event, args){
      UserService.initiateLogin($scope.registerData.username, $scope.registerData.password);
      $scope.closeRegister();
    })
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


  .controller('LandingController', function ($scope, $stateParams) {
  })

  .controller('SubmitController', function ($scope, $stateParams, UserService) {
    $scope.username = UserService.username;
  })

  .controller('CanvasCtrl', function ($scope) {
    var counter = 0;
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');
    var background = new Image();
    background.src = 'http://10.25.156.58:8080/public/img/maps/2';


    var location;
    var destination;

    $scope.$on('change-destination', function (event, args) {
      console.log('changing destination')
      destination = args;
      draw();
    });

    $scope.$on('change-location', function (event, args) {
      console.log('changing location')
      location = args;
      draw();
    })


    // var addData = function (center, locationFlag, title, radius) {
    //   var p = { id: title, x: center.x, y: center.y, amount: radius, location:locationFlag };
    //   $scope.data.push(p);
    //   draw($scope.data);
    // };

    // $scope.removePoint = function (point) {
    //   console.log(point);
    //   for (var i = 0; i < $scope.data.length; i++) {
    //     if ($scope.data[i].id === point.id) {
    //       console.log("removing item at position: " + i);
    //       $scope.data.splice(i, 1);
    //     }
    //   }

    //   draw($scope.data);
    //   console.log($scope.data);
    // }

    function draw() {
      context.clearRect(0, 0, 600, 400);
      context.drawImage(background, 0, 0);
      console.log('Begin drawing');
      var lineFlag = true
      if (location != null) drawLocation();
      else lineFlag = false;
      if (destination != null) drawDestination();
      else lineFlag = false
      if (lineFlag) drawLine();
    }

    const radiusOfDestination = 3;
    function drawDestination() {
      console.log('Drawing destination')
      context.beginPath();
      context.arc(destination.position.x * 20, destination.position.y * 20, radiusOfDestination * 5, 0, 2 * Math.PI, false);
      context.fillStyle = "#ccddff";
      context.fill();
      context.lineWidth = 1;
      context.strokeStyle = "#666666";
      context.stroke();
    }

    function drawLocation() {
      console.log('drawing location')
      context.beginPath();
      context.arc(location.position.x * 30, location.position.y * 30, location.radius * 20, 0, 2 * Math.PI, false);
      context.fillStyle = "#cc1a14";
      context.fill();
      context.lineWidth = 1;
      context.strokeStyle = "#511311";
      context.stroke();
    }

    function drawLine() {
      console.log('drawing line');
      context.beginPath();
      context.moveTo(destination.position.x, location.position.y);
      context.lineTo(destination.position.x, location.position.y);
      context.strokeStyle = "black";
      context.stroke();
    }

    // setup
    canvas.width = 400;
    canvas.height = 400;
    context.globalAlpha = 1.0;
    context.beginPath();

    background.onload = function () {
      context.drawImage(background, 0, 0);
    }

    draw($scope.data);
  })

  // Controller of the explore page. This page will have all nearby beacon data available at all times as well as the maps and the 
  // Functionalities:
  // - Draw room images on the map
  // - Place projects on correct positions
  // - Place user marker on correct position
  // - allow user to click projects
  // - fetch route to project and show it on screen
  // - move user marker dynamically with user movements
  .controller('ExploreController', function ($rootScope, $timeout, $scope, ServerInterfaceService, TriangulationService, ProjectsService, RoomService) {
    console.log('explorer controller is on')
    function log(message) {
      console.log('EXPLORE CONTROLLER: ' + message);
    }
    $scope.URL = 'http://10.25.156.58:8080';
    TriangulationService.init('b9407f30-f5f8-466e-aff9-25556b57fe6d');
    ProjectsService.init();
    ProjectsService.requestAllProjects();
    RoomService.init();
    $scope.rooms = RoomService.getRooms();
    $scope.position = { x: 0, y: 0, radius: 0 };
    $scope.projects = ProjectsService.getProjects();


    $scope.routeUser = function (title) {
      $scope.projects.forEach(element => {
        if (title == element.title) {
          log('Finding route to project: ' + title);

          $rootScope.$broadcast('change-destination', { position: element.position });
          // drawRoute('');
        }
      })
    }

    function drawRoute(destination) {
      log('Drawing route to destination ....');
    }

    $scope.$on('calculated-new-position', function (event, args) {
      log('recieved \'calculated-new-position\' broadcast');
      $rootScope.$broadcast('change-location', { position: args.center, radius: args.radius })
      $scope.position.x = args.center.x;
      $scope.position.y = args.center.y;
      $scope.position.radius = args.radius;
    })
    var updateTimer = function () {

      $scope.projects = ProjectsService.getProjects();
      $timeout(updateTimer, 5000);
    };

    updateTimer();
  })

  .controller('RegisterController', function ($ionicHistory, $rootScope, $window, $scope, ServerInterfaceService) {
    $scope.$on('server-register-success', function(event, args){
      $rootScope.$broadcast('login-succeeded', {username: args.username});
      window.history.back();
    })
    $scope.doRegister = function () {
      console.log('REGISTRATION FORM: start registration')
      ServerInterfaceService.serverRegister($scope.username, $scope.password, $scope.email);
    }
  });