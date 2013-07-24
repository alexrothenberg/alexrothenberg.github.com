angular.module('ticTacToeApp')
  .controller('TicTacToeCtrl', function($scope, TicTacToeGame) {

    $scope.play = function(position) {
      TicTacToeGame.playAt('X', position)
    }

    $scope.markAt = function(position) {
      return TicTacToeGame.markAt(position);
    }

  });
