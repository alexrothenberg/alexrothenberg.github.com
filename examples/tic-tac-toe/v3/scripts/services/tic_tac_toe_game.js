angular.module('ticTacToeApp').factory('TicTacToeGame', function () {
  var newBoard = function() {
    return [
       '', '', '',
       '', '', '',
       '', '', ''
    ];
  };
  var board = newBoard();

  var markAt = function(position) {
    return board[position-1];
  };

  var winningLine = function(positions) {
    return markAt(positions[0]) == markAt(positions[1]) &&
           markAt(positions[1]) == markAt(positions[2]) &&
           markAt(positions[0]) != ''
  };

  return {
    markAt: markAt,

    playAt: function(player, position) {
      board[position-1] = player;
    },

    newGame: function() {
      board = newBoard();
    },

    gameOver: function() {
      var possibleThreeInARow = [
        [1, 2, 3], [4, 5, 6], [7, 8, 9], // rows
        [1, 4, 7], [2, 5, 8], [3, 6, 9], // columns
        [1, 5, 9], [3, 5, 7]             // diagonals
      ]
      for (var i=0; i<possibleThreeInARow.length; i++) {
        if (winningLine(possibleThreeInARow[i])) {
          return true;
        }
      }
      return false;
    }

  };
});

