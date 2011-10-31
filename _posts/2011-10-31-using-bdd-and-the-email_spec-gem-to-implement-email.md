---
layout: post
title: Using BDD and the email_spec gem to implement Email
---

When implementing email functionality, the [email_spec gem](https://github.com/bmabey/email-spec) is something I've decided I can't live without.
It makes it so easy to write RSpec specs and Cucumber features around your email that you have no excuse not to.
Today I'm going to go through an example how I recently used BDD to send an email in an app I was working on.

When I think about email and my Rails environments this is how I typically want them to behave.

* __test__        should not send emails and allow us to write specs or features against them
* __development__ should not send emails but provide a UI to view what would be sent on localhost
* __staging__     should not send emails but provide a UI to view what would be sent on a server
* __production__  should send real emails to real people

Last week I wrote about
[using letter opener to View Sent Email on a Server (without actually sending anything)](http://www.alexrothenberg.com/2011/10/24/using-letter-opener-to-view-sent-email-on-a-server.html)
describing how the `letter_opener gem` helps us in the *development* and *staging* environments.
This article focuses on using `email_spec gem` in the *test* environment.

## Our Sample Project

Let's imagine we are working on a new startup in stealth mode.  We want to generate buzz and prepare for a beta launch.
We're hiding the fact its all vaporware with a splashy homepage where people can request an invitation to the beta and
records their email in our database. This is the same example as my article last week and there's a
live demo at [http://awesome-site-staging.heroku.com/](http://awesome-site-staging.heroku.com/).

What we'll do today is not just record the email address but also send a "thanks for your interest" email to the user.
We're going to do this in BDD fashion bouncing back and forth between `Cucumber Scenarios` and `RSpec Unit Tests`

1. Writing a cucumber scenario
2. While the scenario fails
    1. Write a failing rspec spec
    2. Write code to make it pass

The Cucumber scenario tells us what should be accomplished and when it fails it we use that to tell us what unit test we should write.

## Adding the *email_spec* gem

We add it to our `Gemfile`
{% highlight ruby %}
group :test do
  gem 'email_spec'
end
{% endhighlight %}

We bundle and use the email_spec generator to let it initialize itself.
{% highlight console %}
$ bundle
$ rails g email_spec:steps
{% endhighlight %}

There's also a manual step to get cucumber to load the email_spec gem.  We need to create a file `features/support/email_spec.rb`

{% highlight ruby %}
require 'email_spec/cucumber'
{% endhighlight %}

## Our first Cucumber Scenario

We know that when a user requests an invitation they should get an email so we write that requirement as a Cucumber Scenario.
`features/request_an_invitation.feature`

{% highlight gherkin %}
Feature: Build excitement for this vaporware
  In order to drum up interest
  As a user
  I will receive an exciting email when I request an invitation

  Scenario: Someone requests an invitation and receives an email
    Given I am on the home page
     When I request an invitation for "gullible@lemmings.com"
     Then "gullible@lemmings.com" should receive 1 email
      And they open the email
      And they should see the email delivered from "alex@awesome-startup.com"
      And they should see "Invitation request for Awesome New Startup received" in the email subject
      And they should see "Dear gullible@lemmings.com," in the email text part body
      And they should see "We have received your request " in the email text part body
      And they should see "Please check back at http://awesome-site-staging.heroku.com" in the email text part body
{% endhighlight %}

We run it and it tells us we have a couple of missing steps.

{% highlight console %}

1 scenario (1 undefined)
9 steps (7 skipped, 2 undefined)
0m0.006s

You can implement step definitions for undefined steps with these snippets:

Given /^I am on the home page$/ do
  pending # express the regexp above with the code you wish you had
end

When /^I request an invitation for "([^"]*)"$/ do |arg1|
  pending # express the regexp above with the code you wish you had
end
{% endhighlight %}

Oh right, [the training wheels came off](http://aslakhellesoy.com/post/11055981222/the-training-wheels-came-off) in `cucumber-rails v1.1.1`
and we don't have `web_steps.rb` anymore. Let's write these steps using *capybara* in `features/step_definitions/invite_steps.rb`

{% highlight ruby %}
Given /^I am on the home page$/ do
  visit root_path
end

When /^I request an invitation for "([^"]*)"$/ do |email|
  visit root_path
  fill_in 'email', :with => email
  click_button 'Request Invitation'
end
{% endhighlight %}

We run one more time and get a failure we expect.  Its telling us we haven't written any code to implement the scenario yet!

{% highlight console %}
  Then "gullible@lemmings.com" should receive 1 email
  expected: 1
       got: 0 (using ==) (RSpec::Expectations::ExpectationNotMetError)
  ./features/step_definitions/email_steps.rb:52:in `/^(?:I|they|"([^"]*?)") should receive (an|no|\d+) emails?$/'
  features/request_an_invitation.feature:9:in `Then "gullible@lemmings.com" should receive 1 email'
{% endhighlight %}

## Dropping into RSpec unit tests

Our failing feature tells us what we need to implement so we drop down to the unit test level and start implementing it with TDD.
The feature tells us an email should be be generated so let's go.
We'll add to our `invites_controller_spec` specifying that it should create and deliver an `InviteMailer`.
`spec/controllers/invites_controller_spec.rb`

{% highlight ruby %}
require 'spec_helper'

describe InvitesController do
  describe 'PUT #update' do
    let(:invite) { mock(:email => 'someone@someco.com', :save => true) }
    let(:invite_mailer) { mock }
    before do
      InviteMailer.should_receive(:invite_requested).with(invite).and_return(invite_mailer)
      invite_mailer.should_receive(:deliver)
      Invite.should_receive(:new).with('email' => 'someone@someco.com').and_return(invite)
      post :create, :invite => { :email => 'someone@someco.com' }
    end
    it { should redirect_to root_url }
    it { should set_the_flash.to("Thanks for your interest someone@someco.com.  You will hear from us soon.") }
  end
end
{% endhighlight %}

Of course we get an error `uninitialized constant InviteMailer`.  We fix that by creating the mailer (it doesn't do anything yet)
`app/mailers/invite_mailer.rb`

{% highlight ruby %}
class InviteMailer < ActionMailer::Base
end
{% endhighlight %}

The error changes

{% highlight console %}
Failure/Error: InviteMailer.should_receive(:invite_requested).with(invite).and_return(invite_mailer)
  (<InviteMailer (class)>).invite_requested(#<RSpec::Mocks::Mock:0x82c96210 @name=nil>)
      expected: 1 time
      received: 0 times
{% endhighlight %}

We add the code to our controller to create and deliver the email in `app/controllers/invites_controller.rb`

{% highlight ruby %}
class InvitesController < ApplicationController
  def create
    @invite = Invite.new(params[:invite])
    if @invite.save
      InviteMailer.invite_requested(@invite).deliver
      redirect_to root_path, :notice => "Thanks for your interest #{@invite.email}.  You will hear from us soon."
    else
      render :action => "new"
    end
  end
end
{% endhighlight %}

Are we done?

## Checking the Cucumber Scenario...

The RSpec unit tests pass now but the Cucumber features are still failing.

{% highlight console %}
When I request an invitation for "gullible@lemmings.com"            # features/step_definitions/invite_steps.rb:5
  undefined method `invite_requested' for InviteMailer:Class (NoMethodError)
  ./app/controllers/invites_controller.rb:10:in `create'
  (eval):2:in `send'
  (eval):2:in `click_button'
  ./features/step_definitions/invite_steps.rb:8:in `/^I request an invitation for "([^"]*)"$/'
  features/request_an_invitation.feature:8:in `When I request an invitation for "gullible@lemmings.com"'
{% endhighlight %}

Duh our `InviteMailer` doesn't do anything.

## Back down to the unit tests

We write our `spec/mailers/invite_mailer_spec.rb`.  We need to include some *EmailSpec* modules so we have access to its matchers.

{% highlight ruby %}
require 'spec_helper'

describe InviteMailer do
  include EmailSpec::Helpers
  include EmailSpec::Matchers

  describe '.invite_requested' do
    let(:invite) { Factory.build :invite, :email => 'someone@someco.com' }

    describe 'one email to one user' do
      subject { InviteMailer.invite_requested(invite) }
      it { should deliver_to     invite.email                                                  }
      it { should deliver_from   'alex@awesome-startup.com'                                    }
      it { should have_subject   "Invitation request for Awesome New Startup received"         }
      it { should have_body_text "Dear someone@someco.com,"                                    }
      it { should have_body_text "We have received your request"                               }
      it { should have_body_text "Please check back at http://awesome-site-staging.heroku.com" }
    end
  end
end
{% endhighlight %}

Of course it fails because we still haven't implemented anything.  Let's add some code to `app/mailers/invite_mailer.rb`

{% highlight ruby %}
class InviteMailer < ActionMailer::Base
  def invite_requested(invite)
    @invite = invite
    mail :to      => invite.email,
         :from    => 'alex@awesome-startup.com',
         :subject => 'Invitation request for Awesome New Startup received'
  end
end
{% endhighlight %}

and we can use haml to format the body in `app/views/invite_mailer/invite_requested.text.haml`

{% highlight erb %}
== Dear #{@invite.email},
We have received your request to be invited into our awesome site. We'll let you know as soon as its available.
Please check back at http://awesome-site-staging.heroku.com
You must be very excited!
Thanks
An Awesome New Startup
{% endhighlight %}

We run the `rake` one more time and ...

## We're Done

Everything passes - the specs _and_ the features!

{% highlight console %}
$ rake
ruby -S rspec <a long list of _spec.rb files>
............

Finished in 2.64 seconds
12 examples, 0 failures

ruby -S bundle exec cucumber  --profile default
Using the default profile...
Feature: Build excitement for this vaporware
  In order to drum up interest
  As a user
  I will receive an exciting email

  Scenario: Someone requests an invitation and receives an email
    Given I am on the home page
    When I request an invitation for "gullible@lemmings.com"
    Then "gullible@lemmings.com" should receive 1 email
    And they open the email
    And they should see the email delivered from "alex@awesome-startup.com"
    And they should see "Invitation request for Awesome New Startup received" in the email subject
    And they should see "Dear gullible@lemmings.com," in the email body
    And they should see "We have received your request" in the email body
    And they should see "Please check back at http://awesome-site-staging.heroku.com" in the email body

1 scenario (1 passed)
9 steps (9 passed)
0m0.293s
{% endhighlight %}

I hope you'll consider using the `email_spec gem` and `BDD` the next time you have to add email to your app.
