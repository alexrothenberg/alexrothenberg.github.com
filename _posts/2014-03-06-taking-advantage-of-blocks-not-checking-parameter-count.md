---
layout: post
tags:
title: Taking Advantage of Blocks not Checking Parameter Count
---

As Ruby programmers we don't write for loops instead we iterate over enumerables. We've got a rich library of methods like `each`, `map`, `select` or `detect` to choose from and they all take a `block` that lets us do something as each element passes by. It leads to a functional style of programming. As I was talking with Pat Shaughnessy about his recent article [Use An Ask, Don’t Tell Policy With Ruby](http://patshaughnessy.net/2014/2/10/use-an-ask-dont-tell-policy-with-ruby) I realized when I chain these methods together sometimes the blocks take different numbers of parameters.

For example if we want to find the first 3-letter word in a wordlist we can use the `detect` method

{% highlight ruby %}
%w(Hi there how are you).detect do |word|
  word.length == 3
end
# => "how"
{% endhighlight %}

Here's where it gets a little weird. If we are looking for the index of the first 3-letter word we chain the same `detect` method after `each_with_index`. `each_with_index` yields the element and index and somehow those 2 parameters are passed all the way through to the `detect` block.

{% highlight ruby %}
%w(Hi there how are you).each_with_index.detect do |word, index|
  word.length == 3
end
# => ["how", 2]
{% endhighlight %}

That seems strange! How can the `detect` method block sometimes accept 1 parameter and at other times accept 2?

## Blocks don't check their arity

It turns out that in Ruby blocks don't check how many parameters they are passed. [Arity](http://en.wikipedia.org/wiki/Arity) is the formal word for "the number of arguments passed to a function". This means you can pass 3 arguments to a block expecting 1 and the extra ones will be ignored. You can also pass 1 to a block expecting 3 and the extra parameters will be nil.

{% highlight ruby %}
def test
  yield :a
  yield :a, :b, :c
end

test {|x| puts x.inspect}
# :a
# :a

test {|x, y, z| puts [x, y, z].inspect}
# [:a, nil, nil]
# [:a, :b, :c]
{% endhighlight %}

Its interesting that we can be so flexible when writing blocks and that got me thinking about two other Ruby concepts closely related to blocks - `procs` and `lambdas`. Can we do something similar with them?

## The same trick with lambdas and procs?

Blocks are closures that functions can yield to and there are two other types of clojures you can use programmatically in Ruby `lambdas` and `procs`. They are almost the same as each other and both report themselves as instances of the Proc class. They differ in what happens if you `return` from inside one and whether they enforce arity. Lambdas enforce arity while procs do not. Both lambdas and procs are objects you can assign and pass around while blocks can only be created as syntax when calling a method.

First we'll try our example with a `proc` and see it continue to work whether we yield 1 or 2 parameters. Proc behave just like a block and we get the same results we did with blocks before.

{% highlight ruby %}
proc = Proc.new {|word, index| word.length == 3 }
# => #<Proc:0x007fdae31547d8@(irb):88>

%w(Hi there how are you).each_with_index.detect &proc
# => ["how", 2]

%w(Hi there how are you).detect &proc
# => "how"
{% endhighlight %}

When we try with a `lambda` we see the difference. Lambdas enforce arity and we get an error when we try to call the lambda expecting 2 parameters with only 1.

{% highlight ruby %}
lambda = ->(word, index) { word.length == 3 }
# => #<Proc:0x007fdae302b7d0@(irb):74 (lambda)>

%w(Hi there how are you).each_with_index.detect &lambda
# ArgumentError: wrong number of arguments (1 for 2)
#   from (irb):156:in `block in irb_binding'
#   from (irb):158:in `each'
#   from (irb):158:in `detect'
#   from (irb):158
#   from /Users/alex/.rvm/rubies/ruby-2.1.1/bin/irb:11:in `<main>'

%w(Hi there how are you).detect &lambda
# ArgumentError: wrong number of arguments (1 for 2)
#   from (irb):156:in `block in irb_binding'
#   from (irb):160:in `each'
#   from (irb):160:in `each_with_index'
#   from (irb):160:in `each'
#   from (irb):160:in `detect'
#   from (irb):160
#   from /Users/alex/.rvm/rubies/ruby-2.1.1/bin/irb:11:in `<main>'
{% endhighlight %}

This is even more surprising than I expected. I expected the last one to fail as it is only passing 1 parameter to a lambda expecting 2 but why did the `.each_with_index.detect &lambda` give an error?  A bit more testing shows that `map` works.

{% highlight ruby %}
lambda = ->(word, index) { word.length == 3 }
# => #<Proc:0x007fdae302b7d0@(irb):74 (lambda)>

%w(Hi there how are you).each_with_index.map &lambda
# => [false, false, true, true, true]
{% endhighlight %}

Is this a bug in MRI? In both JRuby and Rubinius `detect` and `map` work the same. I'm not sure but am wondering whether I've uncovered a bug in MRI (that would be exciting!) I'll have to ask my friend Pat Shaughnessy for help spelunking into the MRI source.

Putting this aside for a moment we'll switch to the `map` version and think about how to overcome the arity checking in lambdas. We can force our code around it by using the `splat` operator. Instead of defining the lambda with specific arguments we tell it to expect an array of whatever arguments it gets.

{% highlight ruby %}
lambda = ->(*args) { args.first.length == 3 }
# => #<Proc:0x007fdae313f270@(irb):85 (lambda)>

%w(Hi there how are you).each_with_index.map &lambda
# => [false, false, true, true, true]

%w(Hi there how are you).map &lambda
# => [false, false, true, true, true]
{% endhighlight %}

Would you ever create a lambda like this? Probably not, but its kinda fun to know you can.

This is also the first time I've had to think deeply about blocks, procs and lambdas and dig into their differences.
