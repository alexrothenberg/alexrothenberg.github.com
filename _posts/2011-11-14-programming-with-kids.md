---
layout: post
title: Programming With Kids
---

I've started to teach my kids to program. I figured I build websites professionally and it'd be a fun way for me to share what I do and help supplement their learning. And it was something they expressed interest in not something I was pushing.  I suggested we build our own small version of facebook or twitter.  Very quickly I learned two truths

1. websites are boring
2. games are fun

Okay.  I've never built a game before after a little digging there are plenty of tools in the open source world and many built on Ruby. We're currently experimenting with three different tools/technologies.

## Shoes

I first came across [Shoes](http://shoesrb.com/) several years ago and was blown away. It was originally written by *why* and is now maintained by Team Shoes [on github](https://github.com/shoes/shoes).
"Shoes is the best little DSL for cross-platform GUI programming there is. It feels like real Ruby, rather than just another C++ library wrapper"

Writing a Shoes app feels just like writing a Ruby app (it is Ruby!). The best analogy I can use is that what Rails does for websites, Shoes does for GUI apps.

If you want to create a blue rectangle on a page, here's your app

{% highlight ruby %}
Shoes.app do
  fill blue
  rect :top => 25, :left => 50, :height => 75, :width => 150
end
{% endhighlight %}

![A blue rectangle](http://www.alexrothenberg.com/images/2011-11-14-programming-with-kids/shoes_a_blue_rectangle.png)

We can make it a bit more interactive and allow the user to move our rectangle around with the arrow keys and display the current coordinates

{% highlight ruby %}
Shoes.app do
  fill blue
  @player = rect :top => 25, :left => 50, :height => 75, :width => 150
  @current_coordinates = para "(#{@player.left}, #{@player.top})"

  keypress do |key|
    @player.left += 10 if key == :right
    @player.left -= 10 if key == :left
    @player.top  += 10 if key == :down
    @player.top  -= 10 if key == :up
    @current_coordinates.replace "(#{@player.left}, #{@player.top})"
  end
end
{% endhighlight %}

![The Blue Rectangle Moves](http://www.alexrothenberg.com/images/2011-11-14-programming-with-kids/shoes_the_blue_rectangle_moves.png)

We're not limited to blue rectangles. We can replace it with an image

{% highlight ruby %}
Shoes.app do
  @player = image 'images/Starfighter.png', :top => 25, :left => 50
  @current_coordinates = para "(#{@player.left}, #{@player.top})"

  keypress do |key|
    @player.left += 10 if key == :right
    @player.left -= 10 if key == :left
    @player.top  += 10 if key == :down
    @player.top  -= 10 if key == :up
    @current_coordinates.replace "(#{@player.left}, #{@player.top})"
  end
end
{% endhighlight %}

![The Player is a Starship](http://www.alexrothenberg.com/images/2011-11-14-programming-with-kids/shoes_starfighter_player.png)

We're writing Ruby in a fairly natural way.  Shoes just gives us GUI methods like `rect` to create a rectangle or `para` to create a paragraph.
Because this is Ruby, as your Shoes app gets more complex you can create classes and methods to organize and keep it manageable just as you would in any other app.

There are all sorts of great resources out there including

* [The Shoes Manual](http://shoesrb.com/manual) which includes a reference for all [the elements](http://shoesrb.com/manual/Elements.html) you may use (like rect or para)
* [why's tutorial](https://github.com/ashbb/shoes_tutorial_walkthrough/blob/master/README.md) - the original introduction to Shoes
* [sample apps](https://github.com/shoes/shoes/tree/develop/samples) - there are some really good ones here!
* [Teaching Ruby to High School Girls](http://teachingkids.railsbridge.org/2009/08/15/teaching-ruby-to-high-school-girls.html) (using Shoes) article by Sarah Mei

## Gosu

[Gosu](http://libgosu.org/) is a gaming library so while Shoes lets us build any sort of GUI apps this is seemed like it might be a better fit since we're interested in gaming.
Luckily there's a gem that wraps up the Ruby interface (Gosu can be used from C++ or Ruby).

{% highlight console %}
gem install gosu
{% endhighlight %}

If we want to build a similar game to what we did in Shoes with a play we move around via the arrow keys we need to subclass the `Gosu::Window` class.

{% highlight ruby %}
require 'rubygems'
require 'gosu'

class Player
  def initialize(window)
    @image = Gosu::Image.new(window, "media/Starfighter.png", false)
    @x, @y = 125, 50
    @angle = 0.0
  end

  def draw
    @image.draw_rot(@x, @y, 0, @angle)
  end
end

class GameWindow < Gosu::Window
  def initialize
    super(640, 480, false)
    self.caption = "Gosu Tutorial Game"
    @player = Player.new(self)
  end

  def draw
    @player.draw
  end
end

window = GameWindow.new
window.show
{% endhighlight %}

And we see a window with a player that looks like a starship

![Starship player](http://www.alexrothenberg.com/images/2011-11-14-programming-with-kids/gosu_starfighter.png)

Its not too hard to make it move by overriding the `update` method in our window class

{% highlight ruby %}
require 'rubygems'
require 'gosu'

class Player
  attr_accessor :x, :y

  def initialize(window)
    @image = Gosu::Image.new(window, "media/Starfighter.bmp", false)
    @x, @y = 75, 50
    @angle = 0.0
  end

  def draw
    @image.draw_rot(@x, @y, 0, @angle)
  end
end

class GameWindow < Gosu::Window
  def initialize
    super(400, 300, false)
    self.caption = "Our Game"
    @player = Player.new(self)
    @current_coordinates = Gosu::Font.new(self, Gosu::default_font_name, 20)
  end

  def update
    @player.x -= 10 if button_down? Gosu::KbLeft
    @player.x += 10 if button_down? Gosu::KbRight
    @player.y += 10 if button_down? Gosu::KbDown
    @player.y -= 10 if button_down? Gosu::KbUp
  end

  def draw
    @player.draw
    @current_coordinates.draw("(#{@player.x}, #{@player.y})", 10, 10, 0, 1.0, 1.0, 0xffffff00)
  end
end

window = GameWindow.new
window.show
{% endhighlight %}

![Starship player moves](http://www.alexrothenberg.com/images/2011-11-14-programming-with-kids/gosu_starfighter_moves.png)

This example can be extended into a full Asteroids like like game where your ship has inertia. You should look at the [source](https://github.com/jlnr/gosu/blob/master/examples/Tutorial.rb) or an [explanation](https://github.com/jlnr/gosu/wiki/Ruby-Tutorial) on the gosu site.

There are all sorts of great resources out there including

* Samples from the [Gosu Showcase](http://www.libgosu.org/cgi-bin/mwf/board_show.pl?bid=2) or
<table>
  <tr>
    <td style="text-align: center;"><a href="https://github.com/PhilCK/Falling-Blocks">Falling Blocks</a>             </td>
    <td style="text-align: center;"> or            </td>
    <td style="text-align: center;"><a href="https://github.com/jlnr/gosu/blob/master/examples/CptnRuby.rb">CptnRuby</a></td>
  </tr>
  <tr>
    <td><img src="http://www.alexrothenberg.com/images/2011-11-14-programming-with-kids/falling_blocks.png" alt="Falling Blocks (tetris)"></td>
    <td>&nbsp;</td>
    <td><img src="http://www.alexrothenberg.com/images/2011-11-14-programming-with-kids/cptn_ruby.png" alt="Captain Ruby"></td>
  </tr>
</table>
* [Chingu](https://github.com/ippa/chingu) an extension that seems to let us avoid re-writing common tasks
![Robot](http://www.alexrothenberg.com/images/2011-11-14-programming-with-kids/robot.png)
* [Chipmunk](https://github.com/beoran/chipmunk) a physics library that makes it easy to do things like collision detection, gravity, etc
![Gravity and Collisions demo](http://www.alexrothenberg.com/images/2011-11-14-programming-with-kids/gosu_chipmunk.png)

Even though we're still writing Ruby, Gosu feels more like C++ Windows development I used to do long long time ago.  I'm not sure if that's inevitable and need to keep using Gosu to find out.

## gamesalad

The last framework we've been working with is pretty different. [GameSalad](http://gamesalad.com/) advertises it lets you
"Create games for iPhone, iPad, Android, Mac, and HTML5. No coding required."

It follows a model similar to what Adobe Flash uses where you have `Scenes` containing `Actors`. You write your programs in a visual editor by dragging and dropping Actors onto Scenes, Rules onto Actors and Behavior onto Rules.  For instance if we have a starship actor and we drop these rules onto it

![Starfighter rules](http://www.alexrothenberg.com/images/2011-11-14-programming-with-kids/gamesalad_starfighter_movement_rules.png)

We will get our familiar spaceship that can move left and right

![Starfighter Moving](http://www.alexrothenberg.com/images/2011-11-14-programming-with-kids/gamesalad_starfighter_movement.png)

GameSalad is the least familiar to me but seems to be easiest for my kids to start working on. Not having to write any "code" or "do programming" makes it much easier to get started.
It also can create iPhone or iPad games and I would never dream of exposing my kids to Objective-C.


## What's next?

We've started experimenting with all three of these tools and so far are having fun with all three.  Hopefully we'll figure out what works for us and perhaps try to write about it again in a few months.

After writing this I came across a recent NY Times article [Programming for Children, Minus Cryptic Syntax](http://www.nytimes.com/2011/11/10/technology/personaltech/computer-programming-for-children-minus-cryptic-syntax.html) and [Scratch](http://scratch.mit.edu/)
also sounds interesting so I may have to look into that sometime too.

