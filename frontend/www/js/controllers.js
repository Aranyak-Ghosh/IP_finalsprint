angular.module('angularApp.controllers', [])
  // This is the controller of the side menu
  .controller('AppController', function (TriangulationLocationServicesFactory, UserService, $scope, $timeout, $ionicLoading, TriangulationBeaconsService) {
    $scope.logToDom = function (message) {
			// var e = document.createElement('div');
      // e.innerText = message;
      console.log(message);
			$scope.error+=message;
			// window.scrollTo(0, window.document.height);
		};

		$scope.logToError = function (message) {
			// var e = document.getElementById("error");
      // e.innerText = message;
      console.log(message);
      $scope.error+= message; 
			//e.appendChild(e);
			//window.scrollTo(0, window.docsument.height);
		};



    // location shit
    
		try { //iBeacon Initializtation

			try { // bluetooth is bound and ON
				// check to see if Bluetooth is ON, if not turn it ON
				cordova.plugins.locationManager.isBluetoothEnabled()
					.then(function (isEnabled) {
						$scope.logToDom("BLE isEnabled: " + isEnabled);
						if (isEnabled) {
							//cordova.plugins.locationManager.disableBluetooth();
						} else {
							cordova.plugins.locationManager.enableBluetooth();
						}
					})
					.fail(function (e) {
						//console.error(e);
						$scope.logToError("isBluetoothEnabled failed because: " + e);
					})
					.done();
			}
			catch (err) {

				$scope.logToError("ERROR Bluetooth:" + err.name + "->" + err.message);
			}

			// alert("cordova.plugins.locationManager" + cordova.plugins.locationManager);

			// create a delegate
			$scope.delegate = new cordova.plugins.locationManager.Delegate();

			// // alert('$scope.delegate' + $scope.delegate);

			// // called when user enters or exits a region
			$scope.delegate.didDetermineStateForRegion = function (pluginResult) {

				$scope.logToDom('[DOM] didDetermineStateForRegion: ' + JSON.stringify(pluginResult));

				cordova.plugins.locationManager.appendToDeviceLog('[DOM] didDetermineStateForRegion: '
					+ JSON.stringify(pluginResult));
			};

			// // called when the monitoring starts
			$scope.delegate.didStartMonitoringForRegion = function (pluginResult) {
				console.log('didStartMonitoringForRegion:', pluginResult);

				$scope.logToDom('didStartMonitoringForRegion:' + JSON.stringify(pluginResult));
			};

			// called every second, there is a list of beacons inside data.beacons
			// will get called even if there are 0 beacons in the list
			$scope.delegate.didRangeBeaconsInRegion = function (pluginResult) {
				$scope.logToDom('[DOM] didRangeBeaconsInRegion: ' + JSON.stringify(pluginResult));
			};

			// called if anything fails
			$scope.delegate.monitoringDidFailForRegionWithError = function (error) {
				$scope.logToError(JSON.stringify(error));
			};

			//set the delegate
			cordova.plugins.locationManager.setDelegate($scope.delegate);

			// does not work - $scope.uuid = cordova.plugins.locationManager.BeaconRegion.WILDCARD_UUID;
			$scope.uuid = "b9407f30-f5f8-466e-aff9-25556b57fed6";
			$scope.identifier = "bf21a232f6e4a3d1"; //"bfb7d7eb384e6f18469c02836cd41813";
			$scope.minor = 0; //45968;
			$scope.major = 0;//33300;

			//create a Region to monitor
			try {

				$scope.beaconRegion = new cordova.plugins.locationManager.BeaconRegion($scope.identifier, $scope.uuid, $scope.major, $scope.minor);
			}
			catch (err) {

				$scope.logToError("ERROR from cordova.plugins.locationManager.BeaconRegion:" + err.name + "->" + err.message);
			}

			// alert("beaconRegion:" + $scope.beaconRegion);

			// // required in iOS 8+
			// //cordova.plugins.locationManager.requestWhenInUseAuthorization(); 
			// // or cordova.plugins.locationManager.requestAlwaysAuthorization()

			// cordova.plugins.locationManager.startMonitoringForRegion($scope.beaconRegion)
			// 	.fail(function (e) {
			// 		console.error(e);
			// 		$scope.logToError("Fail: startMonitoringForRegion > " + e);
			// 	})
			// 	.done();

			// $scope.logToDom("Monitoring Started ....");

		}
		catch (err) { // try failed in iBeacon

			var vDebug = "";
			for (var prop in err) {
				vDebug += "property: " + prop + " value: [" + err[prop] + "]\n";
			}
			vDebug += "toString(): " + " value: [" + err.toString() + "]";

			$scope.logToError("ERROR:" + err.name + "->" + err.message + " details:" + vDebug);

		}

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
    $scope.loadingLogin =false;
    $scope.model ={position: 0};
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
    $scope.$on('login-failed', function(event, args){
      failedLogin();
    })

    // Broadcast listener to when user is logged out
    $scope.$on('logout-succeeded', function(event){
      applyLogout();
    })

    // Broadcast listener to whe user logout fails
    $scope.$on('logout-failed', function(event){
      failedLogout();
    })

    // Action when logout succeeds
    function applyLogout(){
      $scope.username = null;
      $scope.loggedIn = false;
    }

    // Action when logout fails
    function failedLogout(){
      $scope.error = 'Failed to log out';
    }

    // listener to logout button press
    $scope.pressLogout = function(){
      UserService.initiateLogout();
    }

    // might need?
    $scope.safeApply = function(fn) {
      var phase = this.$root.$$phase;
      if(phase == '$apply' || phase == '$digest') {
        if(fn && (typeof(fn) === 'function')) {
          fn();
        }
      } else {
        this.$apply(fn);
      }
    };
    
    // responds to succesful login
    function applyLogin(username){
      // $scope.loadingLogin =false;
      // $scope.safeApply();
      $scope.username = username;
      $scope.loggedIn = true;
    }

    // responds to failed login
    function failedLogin(username){
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
      else{
        UserService.initiateLogin($scope.credentials.username, $scope.credentials.password);
        $scope.loadingLogin=true;
      }
    }



  })


  .controller('LandingController', function ($scope, $stateParams) {
  })

  .controller('ExploreController', function ($scope, ServerInterfaceService) {
    $scope.doStuff = function () {
      console.log(ServerInterfaceService.req());
    }
  })
  ;
