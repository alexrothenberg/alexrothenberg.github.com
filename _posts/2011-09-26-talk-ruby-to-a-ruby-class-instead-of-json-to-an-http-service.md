---
layout: post
title: Talk Ruby to a Ruby Class instead of JSON to an HTTP Service
---

Software as a service ([SaaS](http://en.wikipedia.org/wiki/Software_as_a_service)) is a great thing.
I love that other people are providing services and I don't have to implement them myself. I can use
[Airbrake](http://airbrakeapp.com) for error notifications and even [Twitter](https://twitter.com/) for communication. It frees me to focus on what's unique about my app.
Its great that they all work with open standards like HTTP, JSON and XML.
But what I like even more is **not having to think about HTTP, JSON or XML**!
When writing a Ruby application I want to think about Ruby.
The services I really like provide a gem that hides the transport api details and lets me write plain ruby.

* The [Airbrake gem](https://github.com/thoughtbot/airbrake) lets me write `Airbrake.notify(ex)`
* The [Twitter gem](https://github.com/jnunemaker/twitter) lets me write `Twitter.user_timeline("sferik")`

If you are creating a service yourself or even using someone else's service it's not too hard to create your own client gem.  Let's look at an example how we can do that.

# An Example: User Directory Service

Imagine you're building a user directory that lets you list users, create users, update users, show users, delete users, you know, the standard RESTFUL actions.
For instance we could create a user and list all users like this

{% highlight console %}
[~]$ curl -F 'user[name]'='Mickey Mouse' http://user-directory.example.com/users.json
{"user":{"name":"Mickey Mouse","id":1001}}

[~]$ curl http://user-directory.example.com/users.json
[{"user":{"name":"Mickey Mouse","id":1001}}]
{% endhighlight %}

This is great to use from CURL but writing the code to talk http form fields and parse json will get pretty tiring.
I'd much rather have a `UserDirectory::User` object that behaved similarly to an ActiveRecord model.
When we're done we want to be able to have it work this

{% highlight ruby %}
user = UserDirectory::User.create(:name => 'Jenny', :phone => '867-5309')
# => #<UserDirectory::User:0x10239b0b8 @name="Jenny", @phone="867-5309", @id=1001>
user.name
# => 'Jenny'
user.id
# => 1001

UserDirectory::User.all
# => [ #<UserDirectory::User:0x102375638 @name="Jenny", @phone="867-5309", @id=1001>  ]
{% endhighlight %}

# Building our client gem

We'll want to wrap this client into a gem so it can be reused by many applications.
I prefer to use bundler and its `bundle gem` command to start my gem.  I'll assume you know how to do that -
check out this [railscast](http://railscasts.com/episodes/245-new-gem-with-bundler) if you've never done it before.

We're going to get started by building a model class to represent the user without actually connecting it to our service yet.

{% highlight ruby %}
module UserDirectory
  class User
    include ActiveModel::Validations
    validates_presence_of :name

    attr_accessor :name, :phone
    def initialize(attributes={})
      attributes.each do |name, value|
        send("#{name}=", value)
      end
    end
  end
end
{% endhighlight %}

I hope you didn't think all model classes had to subclass `ActiveRecord::Base`!  For me a model represents a concept in the application domain and does not have to map to a database table!

The magic in here is that we're mixing in the `ActiveModel::Validations` module.
This lets us add the same validations we would to a "regular" ActiveRecord model - in this case `validates_presence_of :name`.
When Rails 3.0 came along much of the functionality of ActiveRecord was extracted into ActiveModel which lets you
[make any ruby object feel like ActiveRecord](http://yehudakatz.com/2010/01/10/activemodel-make-any-ruby-object-feel-like-activerecord/)
and as with most other topics Ryan Bates has put together a great [railscast](http://railscasts.com/episodes/219-active-model).

When we try it out it behaves as we expect.

{% highlight ruby %}
# A valid user
user = UserDirectory::User.new(:name => 'alex')
# => #<UserDirectory::User:0x12b79fff0 @name="alex">
user.valid?
# => true

# an invalid user
user = UserDirectory::User.new(:phone => '555-1212')
# => #<UserDirectory::User:0x12b78ecf0 @phone="555-1212">
user.valid?
# => false
user.errors
# => #<ActiveModel::Errors:0x12b788f80 @base=#<UserDirectory::User:0x12b78ecf0
#      @errors=#<ActiveModel::Errors:0x12b788f80 ...>, @validation_context=nil, @phone="555-1212">,
#      @messages=#<OrderedHash {:name=>["can't be blank"]}>>
{% endhighlight %}

The next step is to make our model interact with the service using HTTP and JSON.  I'm going to be using the [HTTParty gem](https://github.com/jnunemaker/httparty).
It is much easier to use than net/http and automatically parses json or xml into a ruby hash for us.

First, we'll add a `create` method that tells the service to create a new user as long as we pass our validations and then returns a `User` instance.

{% highlight ruby %}
module UserDirectory
  class User
    # all the existing code and...

    def attributes
      { :name => name, :phone => phone }
    end

    include HTTParty
    base_uri 'http://user-directory.example.com'

    def self.create attributes
      user = new(attributes)
      return user unless user.valid?

      response = post('/users.json', :body => user.attributes)
      raise "#{response.code}: Better error handling please" unless response.success?
      self.new(response.parsed_response)
    end
  end
end
{% endhighlight %}

We can do the same for an `all` method that returns an array of all users stored in the service.

{% highlight ruby %}
module UserDirectory
  class User
    # all the existing code and...

    def self.all
      response = get('/users.json')
      raise "#{response.code}: Better error handling please" unless response.success?
      response.parsed_response.map do |user_attributes|
        self.new user_attributes
      end
    end
  end
end
{% endhighlight %}

Let's try it out.

{% highlight ruby %}
# No users yet
UserDirectory::User.all
# => []

# Create a user
UserDirectory::User.create(:name => 'alex', :phone => '555-1212')
# => #<UserDirectory::User:0x12c52f0a8 @name="alex", @phone="555-1212">

# Now ask the service again
UserDirectory::User.all
# => [#<UserDirectory::User:0x12b8890d8 @name="alex", @phone="555-1212">]
{% endhighlight %}

This is great!  We have a class that's easy to use, behaves like a normal model but actually talks JSON and HTTP to a remote service.
We could continue along the same lines to implement the other methods we need like `find` & `destroy` but I'm not going to bore you with that here.
Instead I'll switch gears and talk about building a fake service to eliminate the need to have the actual service running during development and testing.

# Building a fake service

There are a few reasons we want to build a fake service.

1. It'll be faster to not make any network calls
2. It's a lot of overhead to start a local copy of the service during development
3. It'll be easier to test various failures (500 errors and the like)
4. It allows us to setup and clear the data any way we want

How do we create a fake service?  Luckily there's a gem for that!
The [ShamRack gem](https://github.com/mdub/sham_rack) intercepts http calls before they leave our app and redirects them to a local Rack App we'll create.
We'll create a simple sinatra app that implements the `UserDirectory Service API` and embed it in our gem.

First things first, add the gem to our gem's `user_directory_client.gemspec`

{% highlight ruby %}
gem.add_dependency "sham_rack"
{% endhighlight %}

Now we can

{% highlight ruby %}
require 'sinatra'
require 'sham_rack'

module UserDirectory
  class FakeService < Sinatra::Base

    ###################
    # ShamRack methods
    def self.activate!
      ShamRack.mount(self, "user-directory.example.com", 80)
    end
    def self.deactivate!
      ShamRack.unmount_all
    end


    ###################
    # Sinatra methods
    configure do
      set :raise_errors, true
      set :show_exceptions, false
    end

    USER_JSON = {:name=>'Jenny', :phone=>'867-5309'}.to_json

    get '/users.json' do
      content_type 'text/json'
      [USER_JSON] # :hardcoded list of 1 user
    end

    # :create new user
    post '/users.json' do
      content_type 'text/json'
      USER_JSON # pretend to create and return hardcoded user
    end
  end
end
{% endhighlight %}

Its very simple and will always return the same hardcoded user but that might be enough.  We turn the fake service on and off with calls to `UserDirectory::FakeService.activate!`
and `UserDirectory::FakeService.deactivate!`.  Let's take a look.

{% highlight ruby %}
UserDirectory::FakeService.activate!
# => PeopleServices::FakePeopleService

UserDirectory::User.all
# => [#<UserDirectory::User:0x12c52f0a8 @name="jenny", @phone="867-5309">]

UserDirectory::User.create(:name => 'alex', :phone => '555-1212')
# => #<UserDirectory::User:0x12b8731e8 @name="jenny", @phone="867-5309">
UserDirectory::User.create(:name => 'pat')
# => #<UserDirectory::User:0x12b86cc58 @name="jenny", @phone="867-5309">

UserDirectory::User.all
# => [#<UserDirectory::User:0x12b865cf0 @name="jenny", @phone="867-5309">]
{% endhighlight %}

This is interesting. Its fast and eliminates the dependency, but its all hardcoded!  When we created 2 users we still got the same "Jenny" user every time.
The good news is the fake service is just a class we wrote so we can make is as complex as we need.
Perhaps what we have here is enough for you and you're all done but we'll assume you want something a bit more realistic.

We're going to create a quick array to simulate persisting our users.

{% highlight ruby %}
require 'sinatra'
require 'sham_rack'

module UserDirectory
  class FakeService < Sinatra::Base

    # ShamRack methods ... remain unchanged

    # Sinatra methods ... changed to use our new "business logic"
    get '/users.json' do
      self.class.users.to_json
    end

    post '/users.json' do
      create_user(params)
    end

    ###################
    # Some "business logic"
    # the worlds simplest db :)
    def self.users
      @users ||= []
    end
    def create_user attributes
      attributes['id'] = rand(10000)
      self.class.users << attributes.dup
      attributes.to_json
    end
  end
end
{% endhighlight %}

One last time we're going to try it out.

{% highlight ruby %}
UserDirectory::FakeService.activate!
# => PeopleServices::FakePeopleService

# We start off empty
UserDirectory::User.all
# => []

# Create some users - the attributes correctly change
UserDirectory::User.create(:name => 'alex', :phone => '555-1212')
# => #<UserDirectory::User:0x12b85f300 @name="alex", @phone="555-1212">
UserDirectory::User.create(:name => 'pat')
# => #<UserDirectory::User:0x12b857880 @name="pat">

# Now we have our 2 users
UserDirectory::User.all
# => [#<UserDirectory::User:0x12b851318 @name="alex", @phone="555-1212">, #<UserDirectory::User:0x12b84adb0 @name="pat">]
{% endhighlight %}

This is now looking almost like a real service and will be very useful as we do our development.  One last enhancement is that it'll be nice to test what happens when the service has errors.

{% highlight ruby %}
require 'sinatra'
require 'sham_rack'

module UserDirectory
  class FakeService < Sinatra::Base
    # Everything else unchanged...

    def self.fail_next_request!
      @fail_next_request = true
    end
    def self.should_fail_request?
      should_fail = @fail_next_request
      @fail_next_request = false
      should_fail
    end

    # Sinatra before filter
    before do
      halt 500, 'We were told to fail!' if self.class.should_fail_request?
    end
  end
end
{% endhighlight %}

One last time we'll try it out.

{% highlight ruby %}
UserDirectory::FakeService.activate!
# => true
UserDirectory::FakeService.fail_next_request!
# => true
 
UserDirectory::User.create :name => 'Alex'
RuntimeError: 500: We were told to fail!
	from /Users/alex/user_directory_client/lib/user_directory/user.rb:25:in `create'
	from (irb):56
{% endhighlight %}

Now go off and create a client for any service you create and be sure to include a fake service!