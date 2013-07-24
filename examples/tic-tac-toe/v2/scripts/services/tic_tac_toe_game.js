angular.module('ticTacToeApp').factory('TicTacToeGame', function () {
  var board = [
      '', '', '',
      '', '', '',
      '', '', ''
  ];

  return {
    markAt: function(position) {
      return board[position-1];
    },

    playAt: function(player, position) {
      board[position-1] = player;
    }
  };
});

