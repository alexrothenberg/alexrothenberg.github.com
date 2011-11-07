---
layout: post
title: Twitter is the new RSS Reader
---

In 2008 I thought RSS was an awesome way to stay abreast of what's going on, but now its 2011
and I find myself using Twitter more often than Google Reader to find new and interesting articles people have written.
Readers tweet and retweet articles they find interesting which seems a lower barrier than leaving an "I like this" comment.
As an author Twitter also gives you some idea of who is reading your posts and a way to connect with them.

Back in 2008 I created a blog aggregator site [http://waywework.it](http://waywework.it) to group the all the people I work with
and promote others to share their thoughts.
I was so excited I even wrote [an article](http://www.alexrothenberg.com/2008/11/09/blog-aggregator-wayweworkit.html) about it.

Now that its 2011, I've been asking myself how could I update [http://waywework.it](http://waywework.it) for the twitter world of today?

I decide that if we're going to follow people on twitter that's what my site should facilitate.
When new posts come in it should tweet them letting you see them if you follow [@WayWeWorkIT](https://twitter.com/#!/WayWeWorkIT).

## Enabling API access to twitter

Once I had this I added the [twitter gem](https://github.com/jnunemaker/twitter) to my application.
I have to give a shout out John Nunemaker for writing this fantastic gem which made my task so simple.

In the `Gemfile`
{% highlight ruby %}
gem 'twitter'
{% endhighlight %}

I created a new twitter account [@WayWeWorkIT](http://twitter.com/WayWeWorkIT) and
registered an application at [https://dev.twitter.com/apps](https://dev.twitter.com/apps)
so I had my OAuth and access tokens.

The only trick was I had to go `Application Settings` tab and configure it for `Read and Write` access
then regenerate the tokens.

Now that I had the keys and tokens from twitter I had to tell my application to use them without hardcoding them in my code.
This took two steps.
First, configuring the app to read the tokens from the environment in `config/initializers/twitter.rb`.
Yes I am somewhat paranoid about accidentally tweeting from development but that `if Rails.env.production?` should save me.

{% highlight ruby %}
if Rails.env.production?
  Twitter.configure do |config|
    config.consumer_key       = ENV['TWITTER_CONSUMER_KEY']
    config.consumer_secret    = ENV['TWITTER_CONSUMER_SECRET']
    config.oauth_token        = ENV['TWITTER_OAUTH_TOKEN']
    config.oauth_token_secret = ENV['TWITTER_OAUTH_TOKEN_SECRET']
  end
end
{% endhighlight %}

Secondly, setting the tokens on the heroku environment (I typed the real tokens instead of the XXXXXXXX's).

{% highlight console %}
$ heroku config:add TWITTER_CONSUMER_KEY=XXXXXXXX
$ heroku config:add TWITTER_CONSUMER_SECRET=XXXXXXXX
$ heroku config:add TWITTER_OAUTH_TOKEN=XXXXXXXX
$ heroku config:add TWITTER_OAUTH_TOKEN_SECRET=XXXXXXXX
{% endhighlight %}

We can test it out (after deploying with `git push heroku`)

{% highlight ruby %}
$ heroku console
>> Twitter.tweet('http://waywework.it aggregates blog articles')
=> # some big object returned
>> Twitter.user_timeline('wayweworkit').first.text
=> "http://t.co/FCmUQdc3 aggregates blog articles"
{% endhighlight %}

Great we just tweeted our first tweet for the world to see.

## Updating WayWeWork.IT to tweet new posts

The app periodically scans the rss feeds it tracks and when it sees a new post it creates it in the app's database.

First we add a twitter_username to each feed we're tracking

{% highlight ruby %}
class AddTwitterUsernameToFeeds < ActiveRecord::Migration
  def change
    add_column :feeds, :twitter_username, :string
  end
end
{% endhighlight %}

Then, add an `after_create` callback to tweet each time we create a new post.

{% highlight ruby %}
class Post < ActiveRecord::Base
  after_create :tweet

  delegate :twitter_username, :to => :feed

  def twitter_username_with_at_sign
    "@#{feed_twitter_username || 'WayWeWorkIT'}
  end

  # See https://dev.twitter.com/docs/tco-link-wrapper/faq#Will_t.co-wrapped_links_always_be_the_same_length
  # We should query instead of hardcoding 20
  def short_url_length
    20
  end

  def tweet
    if Rails.env.production?
      non_title_part_of_tweet = " #{'x'*short_url_length} via #{twitter_username_with_at_sign}"
      max_title_length = 140 - non_title_part_of_tweet.length

      tweet = "#{title.truncate(max_title_length)} #{url} via #{twitter_username_with_at_sign}"
      Twitter.update(tweet)
    end
  end
end
{% endhighlight %}

Again with the "if Rails.env.production?" paranoia? You do know that you can never be too paranoid :)

With the twitter gem its one line to tweet `Twitter.update(tweet)`.
The rest of it is to shorten the title so twitter's 140 character limit wont cut off the url or the author's name.

Once this is in we'll start seeing tweets like

[![Using BDD and the email_spec gem to implement Email www.alexrothenberg.com/2011/10/31/usi… via @alexrothenberg](http://www.alexrothenberg.com/images/2011-11-07-twitter-is-the-new-rss-reader/using_bdd_and_email_spec_gem.png)](https://twitter.com/#!/WayWeWorkIT/status/131380463301427200)


[![Twitter is the new RSS Reader http://www.alexrothenberg.com/2011/11/07/twitter-is-the-new-rss-reader.html via @alexrothenberg](http://www.alexrothenberg.com/images/2011-11-07-twitter-is-the-new-rss-reader/twitter_is_the_new_rss_reader.png)](https://twitter.com/#!/WayWeWorkIT/status/133556175563259904)

Go ahead and follow [@WayWeWorkIT](https://twitter.com/#!/WayWeWorkIT) on twitter and you'll start seeing these blog posts.
