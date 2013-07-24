angular.module('ticTacToeApp')
  .controller('TicTacToeCtrl', function($scope, TicTacToeGame, OtherPlayer) {

    $scope.play = function(position) {
      TicTacToeGame.playAt('X', position)
      TicTacToeGame.playAt('O', OtherPlayer.selectMove())
    }

    $scope.markAt = function(position) {
      return TicTacToeGame.markAt(position);
    }

  });
