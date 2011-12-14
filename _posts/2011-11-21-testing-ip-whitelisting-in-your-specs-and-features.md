---
layout: post
title: Testing IP Whitelisting in your Specs and Features
---

Rails has so much support for testing built into itself that its rare I come up with something that's *hard to test* but HTTP headers is not easy.
Normally you don't have to worry about HTTP headers as they're set by the browser and you don't do much with them.
Recently I was working on an application where each user has an IP whitelist and they are only allowed to come from their whitelisted IP addresses.
This isn't as crazy as it sounds since the app is in a corporate environment and the users will all be coming from their corporate networks.

Basically this means our authentication method needs 3 pieces of information

1. username
2. password
3. remote ip address

What makes this interesting is that the first two are input by the user but the ip address comes from the browser and network.
Writing an RSpec unit test or Cucumber scenario to test user parameters (username and password) is something we've all done before
but today I'm going to talk about how you can also test the IP address in a header.

## Implementation

Before we look at how to test this let's take a look at the implementation of our `SessionController`.

<div class="github_link">app/controllers/sessions_controller.rb</div>
{% highlight ruby %}
class SessionsController < ApplicationController
  def new
    @session = Session.new
  end

  def create
    remote_ip_address = request.headers['X-Forwarded-For'] || request.headers['REMOTE_ADDR']
    @session = Session.create(params[:username], params[:password], remote_ip_address)

    if @session.valid?
      session[:current_user] = @session.user
      redirect_to root_url
    else
      flash.now[:error] = 'Unable to authenticate. Please try again'
      render :new
    end
  end

  def destroy
    session[:current_user] = nil
    redirect_to session
  end
end
{% endhighlight %}

These three actions provide login and logout.

* `new` displays the login form with username & password fields
* `create` uses the username and password from the form as well as the ip address to create a session (i.e. authenticate).
   In case the request hops through some proxy servers we use the [X-Forwarded-For](http://en.wikipedia.org/wiki/X-Forwarded-For) header
   to get the source IP and not the proxy's IP.
* `destroy` users need to log out (but we wont talk about that anymore here)

This works, but you shouldn't trust me. We need tests around the `create` action!

## Unit Testing the IP Whitelist with RSpec

Our Controller Spec needs to pass all 3 pieces of information (username, password & ip address) to the controller.
Passing the username and password is pretty standard and something I'm sure you've done before.
They come from a form so we pass them as a hash in the second argument to post.

<div class="github_link">spec/controllers/sessions_controller_spec.rb</div>
{% highlight ruby %}
post :create, {:username => 'alex', :password => 'secret'}
{% endhighlight %}

Unfortunately we can't pass the IP the same way because the post method in ActionController::TestCase
doesn't support passing headers in (but it does take the *session* or *flash* - that's interesting to remember for some other time).

<div class="github_link"><a href="https://github.com/rails/rails/blob/v3.1.2/actionpack/lib/action_controller/test_case.rb#L368-371">actionpack/lib/action_controller/test_case.rb</a></div>
{% highlight ruby %}
def post(action, parameters = nil, session = nil, flash = nil)
  process(action, parameters, session, flash, "POST")
end
{% endhighlight %}

If we keep looking around it turns out the ActionDispatch::TestRequest object has a nice convenience method that lets us specify the remote_addr directly.

<div class="github_link"><a href="https://github.com/rails/rails/blob/v3.1.2/actionpack/lib/action_dispatch/testing/test_request.rb#L61-63">actionpack/lib/action_dispatch/testing/test_request.rb</a></div>
{% highlight ruby %}
def remote_addr=(addr)
  @env['REMOTE_ADDR'] = addr
end
{% endhighlight %}

If we add a line to our spec we can handle the case where the IP comes in the *REMOTE_ADDR* HTTP header.

<div class="github_link">spec/controllers/sessions_controller_spec.rb</div>
{% highlight ruby %}
request.remote_addr = '192.168.1.100'
post :create, {:username => 'alex', :password => 'secret'}
{% endhighlight %}

We still need to deal with the X-Forwarded-For case.  While Rails doesn't give us a convenience method, by looking at the implementation of the remote_addr= method we can see
how to set this header ourselves.

<div class="github_link">spec/controllers/sessions_controller_spec.rb</div>
{% highlight ruby %}
request.env['X-Forwarded-For'] = '192.168.1.100'
post :create, {:username => 'alex', :password => 'secret'}
{% endhighlight %}

Putting it all together we end up with a controller spec that looks like this.

<div class="github_link">spec/controllers/sessions_controller_spec.rb</div>
{% highlight ruby %}
require 'spec_helper'

describe SessionsController do
  describe '#create' do
    describe 'successfully' do
      let(:alex) { mock }
      let(:valid_session) { mock(:valid? => true, :user => alex )}
      before do
        Session.should_receive(:create).with('alex', 'secret', '192.168.1.100').and_return(valid_session)
      end
      describe 'using REMOTE_ADDR' do
        before do
          request.remote_addr = '192.168.1.100'
          post :create, {:username => 'alex', :password => 'secret'}
        end
        it { should redirect_to root_path }
        it { should set_session(:current_user).to(alex)}
      end
      describe 'using X-Forwarded-For' do
        before do
          request.remote_addr = '172.16.254.1'
          request.env['X-Forwarded-For'] = '192.168.1.100'
          post :create, {:username => 'alex', :password => 'secret'}
        end
        it { should redirect_to root_path }
        it { should set_session(:current_user).to(alex)}
      end
    end

    describe 'unsuccessfully' do
      let(:invalid_session) { mock(:valid? => false) }
      before do
        Session.should_receive(:create).with('alex', 'secret', '192.168.1.100').and_return(invalid_session)
      end
      describe 'using REMOTE_ADDR' do
        before do
          request.remote_addr = '192.168.1.100'
          post :create, {:username => 'alex', :password => 'secret'}
        end
        it { should render_template :new }
      end
      describe 'using X-Forwarded-For' do
        before do
          request.remote_addr = '172.16.254.1'
          request.env['X-Forwarded-For'] = '192.168.1.100'
          post :create, {:username => 'alex', :password => 'secret'}
        end
        it { should render_template :new }
      end
    end
  end
end
{% endhighlight %}

To sum up we can

* pass parameters as a hash in the post method

  `post :create, {:username => 'alex', :password => 'secret'}`

* set the remote_addr on the request with a convenience method

  `request.remote_addr = '192.168.1.100'`

* et the X-Forwarded-For directly on the requests's environment hash

  `request.env['X-Forwarded-For'] = '192.168.1.100'`

## Integration Testing the IP Whitelist in a Cucumber Feature

We face a similar issue when writing our cucumber scenarios - its easy to pass the username and password but harder to pass the IP address.
The solution turns out to be similar but not quite exactly the because our Cucumber steps will use Capybara instead of ActionController::TestCase directly.
Before we look into how to implement the steps, let's write the feature we want which will help us define the steps we need.

<div class="github_link">features/authentication.feature</div>
{% highlight gherkin %}
Feature: Authentication of a user
  In order to ensure a really secure application
  As a user
  I want my IP address to be validated during login

  Background:
    Given the following user exists:
      | username | password | company                   |
      | alex     | secret   | ip_address: 192.168.1.100 |

  Scenario: Successful log in
    Given I am connecting from ip "192.168.1.100"
     When I log in as "alex" with password "secret"
     Then I should be on the home page

  Scenario: Successful log in with X-Forwarded-For header
    Given I am connecting from ip "192.168.1.100" behind a proxy
     When I log in as "alex" with password "secret"
     Then I should be on the home page

  Scenario: Failed log in from wrong IP
    Given I am connecting from ip "172.16.254.1"
     When I log in as "alex" with password "secret"
     Then authentication should have failed

  Scenario: Failed log in from wrong IP behind a proxy
    Given I am connecting from ip "172.16.254.1" behind a proxy
     When I log in as "alex" with password "secret"
     Then authentication should have failed
{% endhighlight %}

We immediately realize we don't know how to write the first step

<div class="github_link">features/step_definitions/authentication_steps.rb</div>
{% highlight ruby %}
Given /^I am connecting from ip "([^"]*)"$/ do |ip_address|
  pending # How do we set the IP Address???
end
{% endhighlight %}

To figure this out we need to dig into how capybara works.

We don't call `post` in  ActionController::TestCase directly instead letting capybara do it for us.
To see what capybara is doing we can skip that step and implement the login step

<div class="github_link">features/step_definitions/authentication_steps.rb</div>
{% highlight ruby %}
Given /^I am connecting from ip "([^"]*)"$/ do |ip_address|
  # do nothing for now
end

When /^I log in as "([^"]*)" with password "([^"]*)"$/ do |name, password|
  visit(new_session_path)
  fill_in('User name', :with => name)
  fill_in('Password', :with => password)
  click_button('Log In')
end
{% endhighlight %}

and edit the *SessionsController* to show us the stack trace.

<div class="github_link">app/controllers/sessions_controller.rb</div>
{% highlight ruby %}
class SessionsController < ApplicationController
  def create
    raise caller.inspect
  end
end
{% endhighlight %}

The stack trace is very big but if we look closely, somewhere in the middle of it we see lines below that show how capybara uses
the [rack-test gem](https://github.com/brynary/rack-test) to submit our form.

{% highlight console %}
~/.rvm/gems/ruby-1.8.7-p334/gems/rack-test-0.6.1/lib/rack/test.rb:66:in `post'
~/.rvm/gems/ruby-1.8.7-p334/gems/capybara-1.1.2/lib/capybara/rack_test/browser.rb:62:in `send'
~/.rvm/gems/ruby-1.8.7-p334/gems/capybara-1.1.2/lib/capybara/rack_test/browser.rb:62:in `process'
~/.rvm/gems/ruby-1.8.7-p334/gems/capybara-1.1.2/lib/capybara/rack_test/browser.rb:27:in `submit'
~/.rvm/gems/ruby-1.8.7-p334/gems/capybara-1.1.2/lib/capybara/rack_test/form.rb:64:in `submit'
... more lines omitted...
~/.rvm/gems/ruby-1.8.7-p334/gems/capybara-1.1.2/lib/capybara/node/actions.rb:38:in `click_button'
{% endhighlight %}

Looking at the Rack::Test#post method we see something similar to what we saw before in
[ActionController::TestCase](https://github.com/rails/rails/blob/v3.1.2/actionpack/lib/action_controller/test_case.rb#L368-371)
but its not quite identical.  It takes the *env* as a parameter so we need to figure out how to inject our header in there.

<div class="github_link"><a href="https://github.com/brynary/rack-test/blob/v0.6.1/lib/rack/test.rb#L60-67">rack-test - lib/rack/test.rb</a></div>
{% highlight ruby %}
def post(uri, params = {}, env = {}, &block)
  env = env_for(uri, env.merge(:method => "POST", :params => params))
  process_request(uri, env, &block)
end
{% endhighlight %}

Following the stack trace up we see the `env` passed into `Rack::Test::Session.post` comes from `Capybara::RackTest::Browser` and it turns out that env is
computed in the Capybara::RackTest::Browser#env method.

<div class="github_link"><a href="https://github.com/jnicklas/capybara/blob/1.1.2/lib/capybara/rack_test/browser.rb#L110-119">capybara - lib/capybara/rack_test/browser.rb</a></div>
{% highlight ruby %}
def options
  driver.options
end

def env
  env = {}
  begin
    env["HTTP_REFERER"] = last_request.url
  rescue Rack::Test::Error
    # no request yet
  end
  env.merge!(options[:headers]) if options[:headers]
  env
end
{% endhighlight %}

The key is in the line `env.merge!(options[:headers]) if options[:headers]` and those options are delegated to the driver.
Now we know how to inject our IP address onto the driver's options.

<div class="github_link">features/step_definitions/authentication_steps.rb</div>
{% highlight ruby %}
Given /^I am connecting from ip "([^"]*)"$/ do |ip_address|
  page.driver.options[:headers] = {'REMOTE_ADDR' => ip_address}
end
{% endhighlight %}

Putting it all together we can write all our steps

<div class="github_link">features/step_definitions/authentication_steps.rb</div>
{% highlight ruby %}
Given /^I am connecting from ip "([^"]*)"$/ do |ip_address|
  page.driver.options[:headers] = {'REMOTE_ADDR' => ip_address}
end

Given /^I am connecting from ip "([^"]*)" behind a proxy$/ do |ip_address|
  page.driver.options[:headers] = {'X-Forwarded-For' => ip_address}
end

When /^I log in as "([^"]*)" with password "([^"]*)"$/ do |name, password|
  visit(new_session_path)
  fill_in('User name', :with => name)
  fill_in('Password', :with => password)
  click_button('Log In')
end

Then /^I should be on the home page$/ do
  URI.parse(current_url).path.should == root_path
end

Then /^authentication should have failed$/ do
  page.text.should include 'Unable to authenticate. Please try again'
end
{% endhighlight %}

Now the scenarios we wrote before all pass.

To sum up

* capybara handles form submission superbly with

  `fill_in('User name', :with => name)`

  `click_button('Log In')`

* we can set any HTTP header in capybara with

  `page.driver.options[:headers] = {'REMOTE_ADDR' => ip_address}`

## Testing is good

Since we're testing the IP logic at both the unit level with RSpec and integration level with Cucumber and Capybara we can be pretty sure it's all going to work correctly.
