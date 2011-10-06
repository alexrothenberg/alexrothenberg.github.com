---
layout: post
title: Upgrading An Old Rails Rails 2.1.1 to 3.1 on Heroku
---

I recently had to upgrade an old app and it went pretty smoothly so I thought I'd share how I did it.

I thought about two approaches to this upgrade

1. I could slowly add modernity to the existing app by adding bundler, upgrading rails, upgrading rspec, etc.
2. I could create a new Rails 3.1 project and copy the code and specs into this new project.


I downloaded the old code and immediately remembered the pain of getting an app up and running without bundler.  This convinced me that #1 would be harder than it needed to
be so I decided to go with approach #2.  It worked out pretty well so I'm going to share exactly what I did.

## Create a new Rails 3.1 project

{% highlight console %}
$ rails new waywework
      create
      create  README
      create  Rakefile
      # and a lot more...
         run  bundle install
Fetching source index for http://rubygems.org/
Using rake (0.9.2)
# and a lot more...
Your bundle is complete! Use `bundle show [gemname]` to see where a bundled gem is installed.
{% endhighlight %}

## Add gems from my app

Because the old app comes from the days before bundler I had to look in `config/environment.rb` for lines like `config.gem 'atom'` and guess what else I needed (I knew I was using rspec).

{% highlight ruby %}
#Gemfile
gem 'atom'
group :development, :test do
  gem "rspec-rails"
  gem "factory_girl_rails"
  gem "haml-rails"
  gem 'faker'
end
{% endhighlight %}

Now we can make sure our empty app works (even though it does nothing)

{% highlight console %}
$ cd waywework
$ rails g rspec:install
      create  .rspec
      create  spec
      create  spec/spec_helper.rb
$ rake db:migrate
$ rake
No examples matching ./spec/**/*_spec.rb could be found
{% endhighlight %}

## Add our existing code and specs

{% highlight console %}
$ cp -r ~/old_waywework/app/controllers/* app/controllers
$ cp -r ~/old_waywework/app/models/* app/models
$ cp -r ~/old_waywework/app/helpers/* app/helpers
$ cp -r ~/old_waywework/app/views/* app/views
$ cp -r ~/old_waywework/db/migrate db
$ mv spec/spec_helper.rb new_spec_helper.rb
$ cp -r ~/old_waywework/spec/* spec
$ mv new_spec_helper.rb spec/spec_helper.rb
{% endhighlight %}

Now when we try to run the specs it tells us we have pending migrations so we run them

{% highlight console %}
$ rake
You have 5 pending migrations:
  20081022162743 CreateFeeds
  20081022162832 CreatePosts
  20081031025747 IndexPublishedInPosts
  20081031143453 IndexFeedAuthor
  20081103143931 PublishedAsDatetime
$ rake db:migrate
==  CreateFeeds: migrating ====================================================
-- create_table(:feeds)
   -> 0.0025s
==  CreateFeeds: migrated (0.0026s) ===========================================

==  CreatePosts: migrating ====================================================
-- create_table(:posts)
   -> 0.0021s
==  CreatePosts: migrated (0.0023s) ===========================================

==  IndexPublishedInPosts: migrating ==========================================
-- add_index(:posts, [:published, :feed_id])
   -> 0.0015s
==  IndexPublishedInPosts: migrated (0.0017s) =================================

==  IndexFeedAuthor: migrating ================================================
-- add_index(:feeds, :author)
   -> 0.0007s
==  IndexFeedAuthor: migrated (0.0008s) =======================================

==  PublishedAsDatetime: migrating ============================================
-- change_column(:posts, :published, :datetime)
   -> 0.0086s
-- add_column(:posts, :updated, :datetime)
   -> 0.0006s
==  PublishedAsDatetime: migrated (0.0094s) ===================================
$ rake
...LOTS OF ERRORS...
activerecord-3.1.0/lib/active_record/base.rb:1083:
    in `method_missing': undefined method `named_scope' for #<Class:0x103875b28> (NoMethodError)
{% endhighlight %}

Now we're getting some errors and are ready to get to work.

## Update our code

Of course it doesn't just work and we need to make a number of changes.  The guides include an [upgrade process](https://github.com/jm/rails_upgrade) section 
and the [rails_upgrade plugin](https://github.com/jm/rails_upgrade) can help identify problems.  Here are the ones I found.

### Changing `named_scope` to `scope`
With Rails 3 the syntax for scopes changed from `named_scope` to `scope`.  So we search-and-replace in our models.
Once we do this the specs run, but many are failing.  A lot are failing because the `routes.rb` syntax changed in Rails 3.

### RAILS_ROOT => Rails.root

The constant RAILS_ROOT no longer exists so we need to search-and-replace that with Rails.root.

### Routes.rb

{% highlight ruby %}
# OLD config/routes.rb
ActionController::Routing::Routes.draw do |map|
  map.posts_by_author 'author/:id', :controller=>'posts', :action=>'by_author'
  map.posts_by_month 'month/:year/:month', :controller=>'posts', :action=>'by_month'
  map.atom_feed '/atom', :controller => "posts", :action=>'index', :format=>'atom'

  map.resources :feeds
  map.root :controller => "posts"
end
{% endhighlight %}

We change it to:

{% highlight ruby %}
# NEW config/routes.rb
WayWeWork::Application.routes.draw do
  match 'author/:id' =>'posts#by_author', :as => :posts_by_author
  match 'month/:year/:month' =>'posts#by_month', :as => :posts_by_month
  match '/atom' => 'posts#index', :as => :atom_feed, :format => :atom

  resources :feeds

  root :to => 'posts#index'
end
{% endhighlight %}

### RSpec Routing Specs

We have a bunch of routing specs that are failing because RSpec changed the syntax around routing specs.

{% highlight ruby %}
# OLD spec/controllers/feeds_routing_spec.rb
it "should map #index" do
  route_for(:controller => "feeds", :action => "index").should == "/feeds"
end
it "should generate params for #index" do
  params_from(:get, "/feeds").should == {:controller => "feeds", :action => "index"}
end
{% endhighlight %}

The routing spec must be in folder called `routing`
{% highlight ruby %}
# NEW spec/feeds_routing_spec.rb
it "should generate params for #index" do
  get("/feeds").should route_to('feeds#index')
end
{% endhighlight %}

### RSpec `stub!`

Another syntax change in RSpec from using `stubs` to `stub!`
{% highlight ruby %}
# OLD
it 'should ...' do
  #...
  feed.stubs(:puts)
  feed.get_latest
end
{% endhighlight %}

We get an error `undefined method 'stubs' for \#<Feed:0x105d572e8>`

{% highlight ruby %}
# NEW
it 'should ...' do
  #...
  feed.stub!(:puts)
  feed.get_latest
end
{% endhighlight %}

### View Specs

Hmm I'm surprised I had written view specs. Nowadays I would write cucumber features and never write view specs.
That being said there were a few things I needed to change to get the view specs passing, all related to RSpec syntax changes.

I was passing @ variables to the view with `assigns[:feed] = @feed = stub_model(Feed)` and today you need to do that with `assign(:feed, @feed = stub_model(Feed)`.
Also when you call `render "/feeds/edit.html.erb"` it used to work but now tries to render a partial.  Plain old `render` will work as long as you've put
the filename in your describe like `describe "/feeds/edit.html.erb" do`


## Deploying to Heroku

The old app was deployed to a VPS using Capistrano.  Today I prefer to use Heroku and there were a few changes I had to make to get it working there.

* Add `pg` to my Gemfile to support Postgresql
* Configure assets (since we cannot write to the filesystem)
  ** Added `config.assets.compile = true` in my production.rb
  ** Added `therubyracer` to my Gemfile
* Delete my old `Capfile`

Now I was able to deploy to heroku and the new app is up and running.  All this done in less than a day!