angular.module('ticTacToeApp').factory('OtherPlayer', function(TicTacToeGame) {
  return {
    selectMove: function() {
      for(var i=0; i<9; i++) {
        if (TicTacToeGame.markAt(i) == '') {
          return i;
        }
      }
    }
  }
});
