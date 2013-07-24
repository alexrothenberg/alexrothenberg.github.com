angular.module('ticTacToeApp')
  .controller('TicTacToeCtrl', function($scope, TicTacToeGame, OtherPlayer) {

    var checkForWinner = function(player) {
      if (TicTacToeGame.gameOver()) {
        $scope.winner = player;
      }
    }

    $scope.newGame = function() {
      TicTacToeGame.newGame();
      $scope.winner = null
    }

    var playAt = function(player, position) {
      if (!$scope.winner) {
        TicTacToeGame.playAt(player, position)
        checkForWinner(player);
      }
    }

    $scope.play = function(position) {
      if (TicTacToeGame.markAt(position) == '') {
        playAt('X', position)
        playAt('O', OtherPlayer.selectMove())
      }
    }

    $scope.markAt = function(position) {
      return TicTacToeGame.markAt(position);
    }

  });
