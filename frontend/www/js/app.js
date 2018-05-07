// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('angularApp', ['ionic', 'angularApp.controllers'])

  .run(function ($ionicPlatform) {
    $ionicPlatform.ready(function () {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      if (window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(true);

      }
      if (window.StatusBar) {
        // org.apache.cordova.statusbar required
        StatusBar.styleDefault();
      }
    });
  })

  .config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider

      .state('app', {
        url: '/app',
        abstract: true,
        templateUrl: 'templates/menu.html',
        controller: 'AppController'
      })

      .state('app.landing', {
        url: '/landing',
        views: {
          'menuContent': {
            templateUrl: 'templates/landing.html',
            controller: 'LandingController'
          }
        }
      })
      .state('app.register', {
        url: '/register',
        views: {
          'menuContent':{
            templateUrl: 'templates/register.html',
            controller: 'RegisterController'
          }
        }
      })

      .state('app.findProjectOrEvent', {
        url: '/findProjectOrEvent',
        views:{
          'menuContent':{
            templateUrl: 'templates/findProjectOrEvent.html'
          }
        }
      })

      .state('app.findProject', {
        url: '/findProject',
        views: {
          'menuContent': {
            templateUrl: 'templates/findProject.html'
            // controller:'FindAProjectController'
          }
        }
      })
      

      .state('app.explore', {
        url: '/explore',
        views: {
          'menuContent': {
            templateUrl: 'templates/explore.html',
            controller: 'ExploreController'
          }
        }
      })

      .state('app.place', {
        url:'/findPlace',
        views:{
          menuContent:{
            templateUrl: 'templates/findAPlace.html'
          }
        }
      })

      .state('app.submit', {
        url: '/submit',
        views:{
          'menuContent':{
            templateUrl: 'templates/submit.html',
            controller: 'SubmitController'
          }
        }
      })
      ;
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/app/landing');
  });
