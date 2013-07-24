angular.module('ticTacToeApp', [])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'TicTacToeCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });