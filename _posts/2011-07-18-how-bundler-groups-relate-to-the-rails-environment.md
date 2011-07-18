---
layout: post
title: How Bundler Groups relate to the Rails Environment
---

Recently I've seen more and more Gemfiles that organize gems into groups and it got me wondering how bundler knows which groups to load.  For the most part two things happen

1. At install time   - Bundler includes a capistrano task that installs all gems except those only in the development or test groups on your server
2. At execution time - Rails tells bundler to load the default gems and those specific to your environment (development, staging or production)

## How Bundler installs gems into your bundle

To tell bundler to use bundler on the server all you need to do is add the one line below to your Capfile

{% highlight ruby %}
require 'bundler/capistrano'
{% endhighlight %}

This creates a capistrano task `bundle:install` that ultimately runs something like the command below on your server

{% highlight bash %}
bundle install --gemfile /srv/my_app/releases/20110715204318/Gemfile --path /srv/my_app/shared/bundle
               --deployment --quiet --without development test
{% endhighlight %}

Okay so it ran a `bundle install` but what really happened?  Let's take that command one piece at a time.

*   `--gemfile /srv/my_app/releases/20110715204318/Gemfile`
    tells it to use our Gemfile, that makes sense.
*   `--path /srv/my_app/shared/bundle` tells it where to put the bundle.
    Let's see what that means.

    It looks like it created all the `rubygems` directories for to isolate the gems for this project
    (very similarly to [rvm gemsets](http://beginrescueend.com/gemsets))

    {% highlight bash %}
    $ ls /srv/my_app/shared/bundle/
    ruby
    $ ls /srv/my_app/shared/bundle/ruby/
    1.8
    $ ls /srv/my_app/shared/bundle/ruby/1.8/
    bin  cache  doc  gems  specifications
    {% endhighlight %}


*   `--quiet`
    hmm what else can I say

*   `--without development test`
    Aha so here's where it tells bundler to skip the `development` and `test` groups.
    so allall gems outside a group or in a group other than `development` or `test` are installed.

How does Bundler remember these settings when it loads Rails and tries to load the bundle?
It saves them away in a `.bundle` directory `cat .bundle/config` shows us

{% highlight yaml %}
---
BUNDLE_FROZEN: "1"
BUNDLE_DISABLE_SHARED_GEMS: "1"
BUNDLE_WITHOUT: development:test
BUNDLE_PATH: /srv/my_app/shared/bundle
{% endhighlight %}

Now we understand how Bundler and Capistrano work together during a deployment to setup the bundle and install gems on the server.
Let's take a look at what happens when our app starts up.



## How Rails and Bundler load your gems according to the Rails Environment

In your `config/application.rb`, right near the top, you have a line like this.

{% highlight yaml %}
# If you have a Gemfile, require the gems listed there, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(:default, Rails.env) if defined?(Bundler)
{% endhighlight %}

Rails tells bundler to require all the gems in the `:default` group and also the current `Rails.env` group.
It uses the `.bundle/config` file to know where the gems are installed and find them.
So that's how the gems appropriate for your environment get automatically loaded when Rails starts.

## What if you create a gem group that doesn't correspond to any Rails env?

This is the problem that started me down this investigation.  I came across a `Gemfile` with a group called `cruise` like this

{% highlight ruby %}
group :cruise do
  gem 'metric_fu'
end
{% endhighlight %}

It was working meaning our cruise server ran [metric_fu](http://metric-fu.rubyforge.org/) but why?

1. We weren't using capistrano to run bundle install and instead just checked whether we were on our cruise server and ran the command `bundle install` in our Rakefile.
   _Aside: We are looking into [Jenkins](http://jenkins-ci.org/) as a continuous integration server that supports bundler_
   This explains why the `metric_fu` was installed into our bundle (there was no `--without` so all gems are installed)

2. When our Rails app starts it would not load metric_fu becuase `Rails.env` will never be `cruise` when the `application.rb` line `Bundler.require(:default, Rails.env)` runs.
   We had worked around that by doing the require ourselves.

   {% highlight ruby %}
   require 'metric_fu'
   {% endhighlight %}

While this does work in that our cruise build works it has the downside of installing `metric_fu` (and all the gems it depends on) on our production server!
That's because the `bundler/capistrano` task installs all gems not marked `development` or `test` and since `metric_fu` is marked `cruise` it gets installed.
Now Rails will not load it so its not that bad but its still not good.
We can take a quick look on our server to verify

{% highlight bash %}
$ ls /srv/my_app/shared/bundle/ruby/1.8/specifications/metric_fu-2.0.1.gemspec
shared/bundle/ruby/1.8/specifications/metric_fu-2.0.1.gemspec
$ ls /srv/my_app/shared/bundle/ruby/1.8/gems/metric_fu-2.0.1
HISTORY  lib  MIT-LICENSE  Rakefile  README  spec  tasks  TODO
{% endhighlight %}

Fortunately this is really simple to fix, we just need to change our `Gemfile` and move `metric_fu` into the `test` group

{% highlight ruby %}
group :test do
  gem 'metric_fu'
end
{% endhighlight %}

My advice it **do not** create any gem groups that do not correspond to your Rails environments as that seems to be what the bundler-capistrano and bundler-rails integrations expect.


