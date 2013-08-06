---
layout: post
tags:
title:  How To Unit Test An Angular App.
---

AngularJS has a great testing story -
it's all based on Dependency Injection,
the [Karma test runner](http://karma-runner.github.io/0.8/index.html) was written by one of its core developers [Vojta Jina](https://twitter.com/vojtajina)
and it ships with a variety of mocks like the [$httpBackend](http://docs.angularjs.org/api/ngMock.$httpBackend) for unit testing requests to remote services.

What I haven't been able to find much of are examples showing how to take advantage of these features when testing an application that does more than just expose objects connected via a rest api.

Today we're going to build a simple `Tic-Tac-Toe` game writing unit tests along the way.

<div class="demo" style="text-align:center; height:350px; width:80%;">
  <div class="github_link"><a href="/examples/tic-tac-toe/v3/index.html" target="_blank">http://alexrothenberg.github.com/examples/tic-tac-toe/v3/index.html</a></div>
  <iframe src="/examples/tic-tac-toe/v3/index.html" style="height:90%;width:100%">
  </iframe>
</div>

## Creating our new app

This is the boring but necessary part where we need to get all our scaffolding set-up before we can actually start to make our app play Tic Tac Toe.

We're going to use [yeoman](http://yeoman.io/) to create our project.

{% highlight bash %}
$ yo angular tic-tac-toe
{% endhighlight %}

After waiting a while for npm to install our modules we've got our basic app created and we can go in and run all 0 unit tests.

{% highlight bash %}
$ grunt test
Running "karma:unit" (karma) task
INFO [karma]: Karma server started at http://localhost:8080/
INFO [launcher]: Starting browser Chrome
WARN [watcher]: Pattern "/Users/alex/blog/test/mock/**/*.js" does not match any file.
INFO [Chrome 28.0 (Mac)]: Connected on socket id WfjkRe1_5u5QeZ8upOC2
Chrome 28.0 (Mac): Executed 1 of 1 SUCCESS (0.123 secs / 0.023 secs)

Done, without errors.
{% endhighlight %}

We're going to add a few testing libraries to our `bower.js` file in the `devDependencies` section

{% highlight bash %}
  "devDependencies": {
    "sinon": "~1.7.3",
    "chai": "~1.7.2",
    "sinon-chai": "~2.4.0"
  }
{% endhighlight %}

* [sinon.js](http://sinonjs.org/) so we can build our own mocks and stubs
* [chai](http://chaijs.com/) lets us use a really nice BDD style syntax for our assertions.
* [sinon-chai](https://github.com/domenic/sinon-chai) adds the chai syntax to our spies, mocks and stubs

After we tell `bower` to install these libraries.

{% highlight bash %}
$ bower install
{% endhighlight %}

And we tell karma to use them in our tests by adding these lines to our `karma.conf.js`

<div class="github_link">karma.conf.js</div>
{% highlight javascript %}
// list of files / patterns to load in the browser
files = [
  JASMINE, // & other existing files
  'app/bower_components/sinon/lib/sinon.js',
  'app/bower_components/sinon/lib/sinon/call.js',
  'app/bower_components/sinon/lib/sinon/spy.js',
  'app/bower_components/sinon/lib/sinon/stub.js',
  'app/bower_components/sinon/lib/sinon/match.js',
  'app/bower_components/chai/chai.js',
  'app/bower_components/sinon-chai/lib/sinon-chai.js',
  'test/chai-should.js'
];
{% endhighlight %}

One file we need to create ourselves is `test/chai-should.js` and it contains just 1 line

<div class="github_link">test/chai-should.js</div>
{% highlight javascript %}
chai.should();
{% endhighlight %}


We are finally ready to start building our app!

## Single player Tic-Tac-Toe

To get started we'll build the worlds most boring tic-tac-toe game. A one player game where you can put X's on the board until it fills up.

<div class="demo" style="text-align:center; height:300px; width:80%;">
  <div class="github_link"><a href="/examples/tic-tac-toe/v1/index.html" target="_blank">http://alexrothenberg.github.com/examples/tic-tac-toe/v1/index.html</a></div>
  <iframe src="/examples/tic-tac-toe/v1/index.html" style="height:90%;width:100%">
  </iframe>
</div>

To build this we need 1) the UI, 2) business logic and 3) a controller to glue them together.

For the UI we have a 3x3 html table with two angular bindings.

1. `{ {markAt(0)} }` will display the X or O in each space numbered 1-9.
2. `ng-click="play(0)"` lets us play an X in a space when we click it.

<div class="github_link">views/main.html</div>
{% highlight html linenos %}
<div class="hero-unit">
  <h1>One Player Tic Tac Toe</h1>

  <table id="board">
    <tr>
      <td class="top left"      ng-click="play(1)">{ {markAt(1)} }</td>
      <td class="top middle"    ng-click="play(2)">{ {markAt(2)} }</td>
      <td class="top right"     ng-click="play(3)">{ {markAt(3)} }</td>
    </tr>
    <tr>
      <td class="center left"   ng-click="play(4)">{ {markAt(4)} }</td>
      <td class="center middle" ng-click="play(5)">{ {markAt(5)} }</td>
      <td class="center right"  ng-click="play(6)">{ {markAt(6)} }</td>
    </tr>
    <tr>
      <td class="bottom left"   ng-click="play(7)">{ {markAt(7)} }</td>
      <td class="bottom middle" ng-click="play(8)">{ {markAt(8)} }</td>
      <td class="bottom right"  ng-click="play(9)">{ {markAt(9)} }</td>
    </tr>
  </table>
</div>
{% endhighlight %}

The next step is to build our controller that exposes `play` and `markAt` on the scope.
This controller delegates to a `TicTacToeGame` service and the only real logic it contains is that
we are playing 'X'. This is actually how I try to write my controllers in AngularJS, as skinny as I can so they serve mostly as a mapping between the UI and services which make up the business logic.

<div class="github_link">controllers/tic_tac_toe.js</div>
{% highlight javascript linenos %}
angular.module('ticTacToeApp')
  .controller('TicTacToeCtrl', function ($scope, TicTacToeGame) {

    $scope.play = function(position) {
      TicTacToeGame.playAt('X', position)
    }

    $scope.markAt = function(position) {
      return TicTacToeGame.markAt(position);
    }

  });
{% endhighlight %}

That leads us to the `TicTacToeGame` service which knows about the board and how to read and write to it.
The most interesting thing it does is map board positions 1-9 to array indices 0-8 since our array is 0-based.

<div class="github_link">services/tic_tac_toe_game.js</div>
{% highlight javascript linenos %}
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
{% endhighlight %}

Even though our controller and service are pretty simple its enough to see some interesting things as we write our first unit test.
Now we're just going to unit test the controller and have it interact with the service so we implicitly test that as well.

<div class="github_link">test/spec/controllers/tic_tac_toe.js</div>
{% highlight javascript linenos%}
describe('Controller: TicTacToeCtrl', function () {
  var scope;

  // load the controller's module
  beforeEach(module('ticTacToeApp'));

  // Initialize the controller and a mock scope
  beforeEach(inject(function($controller, $rootScope) {
    scope = $rootScope.$new();
    $controller('TicTacToeCtrl', { $scope: scope });
  }));

  it('plays my move', function() {
    scope.play(4);
    scope.markAt(4).should.eql('X');
  });

});
{% endhighlight %}

There's some angular magic with Dependency Injection going on here so let's dig through that.

* Line 5 - We tell angular about our app. This initializes Angular's dependency injector so it is later able to inject and use our services.
* Line 8 - Tell Angular's injector to give us its `$controller` service and `$rootScope`
* Line 9-10 - We create a scope and save it in a local variable for later. Then use the `$controller` service to create our TicTacToeCtrl controller.
* Line 13-16 - Finally our test! We call `play(4)` and ensure position 4 is now marked with an X.

At this point there's a lot of boilerplate to help us write one simple test but in a little bit we'll be able to take advantage of that Dependency Injection infrastructure to test write some good tests that isolate the services and controllers from each other.

## Adding the opposing player

Its a pretty boring game when you have no one to play against so the next step we'll take is to add an opposing player.

<div class="demo" style="text-align:center; height:300px; width:80%;">
  <div class="github_link"><a href="/examples/tic-tac-toe/v2/index.html" target="_blank">http://alexrothenberg.github.com/examples/tic-tac-toe/v2/index.html</a></div>
  <iframe src="/examples/tic-tac-toe/v2/index.html" style="height:90%;width:100%">
  </iframe>
</div>

In the controller we change it so that every time we play an X in some position we want to other player to play an O where they choose. There's some more Dependency Injection at work here as we're using the `OtherPlayer` service. On line 2 we tell angular we depend on it then on line 6 we let it decide where to move.

<div class="github_link">controllers/tic_tac_toe.js</div>
{% highlight javascript linenos%}
angular.module('ticTacToeApp')
  .controller('TicTacToeCtrl', function($scope, TicTacToeGame, OtherPlayer) {

    $scope.play = function(position) {
      TicTacToeGame.playAt('X', position)
      TicTacToeGame.playAt('O', OtherPlayer.selectMove())
    }

    // $scope.markAt is unchanged from before
  });
{% endhighlight %}

Now its time to write the `OtherPlayer` service and we have to decide how smart to make it. I'm going to go with not very smart so I can defeat it and enjoy the sweet taste of tic-tac-toe victory! It will find the first open space and go there - even a 4 year old could come up with a better strategy.

<div class="github_link">services/other_player.js</div>
{% highlight javascript linenos%}
angular.module('ticTacToeApp').factory('OtherPlayer', function (TicTacToeGame) {
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
{% endhighlight %}

When we think about how to test our controller we have a decision to make. We could write a test like

{% highlight javascript linenos%}
  it('plays my move in 4 then opponent in 1 since it is the first open square', function() {
    scope.play(4);
    scope.markAt(4).should.eql('X');
    scope.markAt(1).should.eql('O');
  });

  it('plays my move in 1 then opponent in 2 since it is the first open square', function() {
    scope.play(1);
    scope.markAt(1).should.eql('X');
    scope.markAt(2).should.eql('O');
  });
{% endhighlight %}

The problem with this approach is that this controller test now relies on a lot of internal knowledge of the `OtherPlayer` server and its game strategy. If we decide to change `OtherPlayer` to make it play a smarter game we'll have to change this test even though we wouldn't have changed this controller. To me that violates the "unit" part of a unit test. A test should test a single unit, in this case our controller *or* our service but not both so a change to one requires a change to only its unit test.

Let's take another approach where we stub out the `OtherPlayer` service so we can specify how it will behave for the purpose of our test.

<div class="github_link">test/spec/controllers/tic_tac_toe.js</div>
{% highlight javascript linenos%}
describe('Controller: TicTacToeCtrl', function () {
  var scope;
  var fakeOtherPlayer;

  // load the controller's module
  beforeEach(module('ticTacToeApp'));

  beforeEach(function() {
    var myMocks = angular.module('MyAppMocks',[])
    myMocks.factory('OtherPlayer', function() {
      return {
        selectMove: sinon.stub()
      }
    });
    module("MyAppMocks")
  });

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope, OtherPlayer) {
    fakeOtherPlayer = OtherPlayer;
    scope = $rootScope.$new();
    $controller('TicTacToeCtrl', { $scope: scope });
  }));

  it('plays my move', function() {
    fakeotherPlayer.selectMove.returns(5);
    scope.play(4);
    scope.markAt(4).should.eql('X');
    scope.markAt(5).should.eql('O');
  });

});
{% endhighlight %}

It looks like it got much longer and more complicated but there are really only 3 new elements. Its easiest to understand if we jump around out of order.

First the test (lines 25-30). This is our test where we control how the other play service behaves. `otherPlayer` is not the real service but just plain Javascript object that contains a sinon stub. For this test we are saying that if it decides to move in position 5 then there will be an 'O' in position 5. Now moving up we'll see how we setup this fake OtherPlayer service.
Sinon.JS is a very cool library and I've found its explanation of [spies](http://sinonjs.org/docs/#spies), [stubs](http://sinonjs.org/docs/#stubs) & [mocks](http://sinonjs.org/docs/#mocks) among the clearest anywhere.

Second, creating the fakeOtherPlayer service (lines 8-16). There are three steps here. To start we register a new module `MyAppMocks` with angular (line 9). Then we We define an `OtherPlayer` service whose `selectMove` method is just a sinon stub (lines 10-14). Finally we register `MyAppMocks` with angular so the dependency injector will find our fake service when we ask for `OtherPlayer`.

Lastly, let Angular's Dependency Injector use our fake OtherPlayer (lines 19-23). Explicitly we ask for `OtherPlayer` on line 19 and save it in a local variable on line 20. We also rely on an implicit step that happens on line 22 `$controller('TicTacToeCtrl', { $scope: scope });`. When angular creates our controller it will also inject the fake `OtherPlayer`. We cannot see that but this is the key step that ties it all together.

Angular's dependency injector works so that the most recent module takes precedence over older ones which is why the OtherPlayer in `MyAppMocks` will be found instead of the OtherPlayer in ticTacToeApp. For us this means the one added on line 15 came after the one added on line 6.

Since we have tested our controller in isolation from the real `OtherPlayer` service we have to separately write some tests for it. Here we will rely on the real `TicTacToeGame` service (since it is so simple) and our tests insure the "first open position" logic.

<div class="github_link">test/spec/services/other_player.js</div>
{% highlight javascript linenos%}
describe('Service: OtherPlayer', function () {

  // load the controller's module
  beforeEach(module('ticTacToeApp'));

  var otherPlayer;
  var ticTacToeGame;

  beforeEach(inject(function(OtherPlayer, TicTacToeGame) {
    otherPlayer = OtherPlayer;
    ticTacToeGame = TicTacToeGame;
  }));

  it('select the first space since it is empty', function() {
    ticTacToeGame.markAt(1).should.eql('');
    otherPlayer.selectMove().should.eql(1);
  });

  it('select the third space when first two are not empty', function() {
    ticTacToeGame.playAt('X', 1)
    ticTacToeGame.playAt('0', 2)
    ticTacToeGame.playAt('X', 4)
    otherPlayer.selectMove().should.eql(3);
  });
});
{% endhighlight %}

We almost have a game now all that's missing is the thrill of victory when we crush our computerized opponent.

## Winning and losing

<div class="demo" style="text-align:center; height:350px; width:80%;">
  <div class="github_link"><a href="/examples/tic-tac-toe/v3/index.html" target="_blank">http://alexrothenberg.github.com/examples/tic-tac-toe/v3/index.html</a></div>
  <iframe src="/examples/tic-tac-toe/v3/index.html" style="height:90%;width:100%">
  </iframe>
</div>

How do we build this? We'll just continue what we've built so far.

First we'll add our UI for declaring the winner and starting a new game to the html view.

<div class="github_link">views/main.html</div>
{% highlight html %}
  <h1>Tic Tac Toe</h1>
  <div>
    <button ng-click="newGame()">New Game</button>
    <span ng-show="winner">{ {winner} } has won!!</span>
  </div>
{% endhighlight %}

Then we update our controller to support the idea of winning. We've added the `$scope.newGame` function and also added a bunch of logic around playing. Before moving make sure no one has already won and after each move check if someone just won. In order to do that we extracted some helper functions we put inside the controller but do not expose on the scope. As my controllers and services get more complex this is a pattern I often repeat.

<div class="github_link">controllers/tic_tac_toe.js</div>
{% highlight javascript linenos %}
angular.module('ticTacToeApp')
  .controller('TicTacToeCtrl', function($scope, TicTacToeGame, OtherPlayer) {

    var checkForWinner = function(player) {
      if (TicTacToeGame.gameOver()) {
        $scope.winner = player;
      }
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

    $scope.newGame = function() {
      TicTacToeGame.newGame();
      $scope.winner = null
    }

    $scope.markAt = // still unchanged from the very beginning

  });
{% endhighlight %}

We relied on `TicTacToeGame.newGame()` and `TicTacToeGame.gameOver()` so now have to write them.
Again we refactored `markAt` into a helper function and created a few new ones like `newBoard` and `winningLine`.

<div class="github_link">services/tic_tac_toe_game.js</div>
{% highlight javascript linenos %}
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
{% endhighlight %}

Now we can write some new tests in the controller that verify the new behavior we've added

* a newGame clears the board
* cannot play in occupied position (thanks to my kids for noticing this bug :)
* knows when I have won
* does not let us make any moves when the game is over

<div class="github_link">test/spec/controllers/tic_tac_toe.js</div>
{% highlight javascript linenos %}
describe('Controller: TicTacToeCtrl', function () {
  // All the old beforeEach setup remains unchanged

  it('plays my move and clears board for new game', function() {
    fakeOtherPlayer.selectMove.returns(3);
    scope.play(4);
    scope.markAt(4).should.eql('X')
    scope.markAt(3).should.eql('O')
    scope.newGame();
    scope.markAt(4).should.eql('')
    scope.markAt(3).should.eql('')
  });

  it('cannot play over another player', function() {
    fakeOtherPlayer.selectMove.returns(3);
    scope.play(4);
    scope.play(3);
    scope.markAt(4).should.eql('X')
    scope.markAt(3).should.eql('O')
  });

  it('knows when I have won', function() {
    fakeOtherPlayer.selectMove.returns(4);
    scope.play(1);
    scope.play(2);
    scope.play(3);
    scope.winner.should.eql('X')
  });

  it('does not let us make any moves when the game is over', function() {
    scope.winner = 'X'
    scope.play(5);
    scope.markAt(5).should.eql('')
  });
});
{% endhighlight %}

We have also added some logic to our `TicTacToeGame` service so we should test that too.
What we'll test is the logic around winning since we had to write non-trivial logic to get that working.

<div class="github_link">test/spec/services/tic_tac_toe_game.js</div>
{% highlight javascript linenos %}
describe('Service: TicTacToeGame', function () {
  beforeEach(module('ticTacToeApp'));

  var ticTacToeGame;

  beforeEach(inject(function(TicTacToeGame) {
    ticTacToeGame = TicTacToeGame;
  }));

  describe('.gameOver', function(){
    it('knows top row is a winner', function() {
      ticTacToeGame.playAt('X', 1);
      ticTacToeGame.playAt('X', 2);
      ticTacToeGame.playAt('X', 3);
      ticTacToeGame.gameOver().should.be.true;
    });
    it('knows middle row is a winner', function() {
      ticTacToeGame.playAt('X', 4);
      ticTacToeGame.playAt('X', 5);
      ticTacToeGame.playAt('X', 6);
      ticTacToeGame.gameOver().should.be.true;
    });
    it('knows diagonal is a winner', function() {
      ticTacToeGame.playAt('X', 1);
      ticTacToeGame.playAt('X', 5);
      ticTacToeGame.playAt('X', 9);
      ticTacToeGame.gameOver().should.be.true;
    });
    it('knows a row with both players is not a winner', function() {
      ticTacToeGame.playAt('X', 1);
      ticTacToeGame.playAt('O', 2);
      ticTacToeGame.playAt('X', 3);
      ticTacToeGame.gameOver().should.be.false;
    });
  })
});{% endhighlight %}

If you want to look at the example we've built its all on github [alexrothenberg/angular-tic-tac-toe](https://github.com/alexrothenberg/angular-tic-tac-toe).

I hope you've found this journey useful and will make sure to test the next Angular app you write!