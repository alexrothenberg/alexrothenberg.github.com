---
layout: post
title: Using Letter Opener to View Sent Email on a Server (without actually sending anything)
---

When developing email functionality you don't want to send real emails to real people before in production.
At the same time you need to send them to ensure they are formatted correctly and contain the proper information.
You can (and should) write integration tests to verify this but that helps developers gain confidence,
what can we do to show non-technical stakeholders that it all works?

Today I'm going to show you how to use Ryan Bates' [letter_opener](https://github.com/ryanb/letter_opener) gem
to let you preview your emails without actually sending them.
Ryan of course does the always awesome [RailsCasts](http://railscasts.com).

Let's think about the different Rails environments and how we want them to behave with email.

* __test__        should not send emails and allow us to write specs or features against them
* __development__ should not send emails but provide a UI to view what would be sent
* __staging__     should not send emails but provide a UI to view what would be sent
* __production__  should send real emails to real people

Looking at this, Rails works really well for *test* with ActionMailer's :test delivery method that stores the emails in the
ActionMailer::Base.deliveries array so you can then use [email_spec](https://github.com/bmabey/email-spec) to write your specs.
*Production* is also covered as long as you give it your mail server configuration.
That leaves *development* and *staging* which look identical but we'll see that they are slightly different.
I'll spend the rest of this article talking about how *letter_opener* lets us do what we want in these environments.

## An example

Let's imagine we are working on a new startup in stealth mode.  We want to generate buzz and prepare for a beta launch.
We're hiding the fact its all vaporware with a splashy homepage where people can request an invitation to the beta and
it sends a "thanks for your interest" email. Lastly, we want to test it in *development* and *staging*.

Here's a [live demo at http://awesome-site-staging.heroku.com/](http://awesome-site-staging.heroku.com/) if you want to dive in and start clicking.

After you request an invitation it shows a page like this

![Vaporware Homepage](http://www.alexrothenberg.com/images/2011-10-24-previewing-email-instead-of-sending-prior-to-production/home_page.png)

## Logfile testing (we can do better)

When you fill in your email and click the `Request Invitation` button, our controller uses a mailer to create and deliver the email.

{% highlight ruby %}
class InvitesController < ApplicationController
  def create
    @invite = Invite.new(params[:invite])
    @invite.save
    InviteMailer.invite_requested(@invite).deliver
    redirect_to root_path, :notice => "Thanks for your interest #{@invite.email}.  You will hear from us soon."
  end
end
{% endhighlight %}

The only way to tell whether the email worked is to scroll through the development.log until you see something like this

{% highlight console %}
Sent mail to alex@alexrothenberg.com (20ms)
Date: Fri, 21 Oct 2011 15:09:16 -0400
From: admin@newstartup.com
To: alex@alexrothenberg.com
Message-ID: <4ea1c35cc3d5b_6693830916bc43754@Alex-Rothenbergs-MacBook-Pro.local.mail>
Subject: Invite requested
...
We have received your request to be invited into our awesome site. We'll let you know as soon as its available.
Please check back at http://awesome-site.heroku.com
You must be very excited!
Thanks
An Awesome New Startup
{% endhighlight %}

Ok if you're a developer and you enjoy reading log files but *letter_opener* lets us do better.

## Using *letter_opener* in development

*Letter_opener* provides us with a UI so we can view the emails right in our browser.
It's super easy to add this gem and I'll just copy the instructions from its [README](https://github.com/ryanb/letter_opener/blob/master/README.rdoc)

>  Preview email in the browser instead of sending it. This means you do not need to set up email delivery in your development environment,
>  and you no longer need to worry about accidentally sending a test email to someone else’s address
>
>  **Rails Setup**
>
>  First add the gem to your development environment and run the bundle command to install it.
>
>  `gem "letter_opener", :group => :development`
>
>  Then set the delivery method in config/environments/development.rb
>
>  `config.action_mailer.delivery_method = :letter_opener`
>
>  Now any email will pop up in your browser instead of being sent. The messages are stored in tmp/letter_opener.

Once we've done that what happens when we use the site to request an invitation?
A new tab opens up with the email right there. 
Now as a user we can tell it's correct and any non-technical people on the team can feel their confidence rise.

![Previewing an Email with Letter Opener in Development](http://www.alexrothenberg.com/images/2011-10-24-previewing-email-instead-of-sending-prior-to-production/development_letter_opener.png)


###How does letter_opener actually work?

Rails goes through the standard flow to create the mail object and when it's ready to deliver the message it calls letter_opener's `deliver!` method because we 
registered letter_opener as the *action_mailer.delivery_method*.  Letter_opener saves the email to your file system as an html file
then uses [launchy](https://github.com/copiousfreetime/launchy) to open it in a browser using the file:// protocol.

There will be a couple of problems once we move onto a server which brings us to *staging*.

## Using *letter_opener* on staging

If you're like me you probably have a staging environment where you or your stakeholders can validate your app before releasing it to production and your end users.
There are two aspects of this environment that wont work with letter_opener the way it did in development

* We need to use http:// not file:// to preview the emails because the browser is not on the same file system where the emails are written 
* We may not be able to write to the file system. For example if we have deployed to heroku.

I had to make some changes to *letter_opener* to support this kind of server environment. 
The fork is available at [https://github.com/alexrothenberg/letter_opener/tree/on_a_server](https://github.com/alexrothenberg/letter_opener/tree/on_a_server)
and I'll update the article if my pull requests are merged back in.

We need to make a few changes to our application.

1 - Update our `Gemfile` to use the fork from github
  {% highlight ruby %}
  gem 'letter_opener',  :git => "git://github.com/alexrothenberg/letter_opener.git", :branch => "on_a_server"
  {% endhighlight %}

2 -  Add a debugging UI link so users can get to the "preview emails" page in something like `layouts/application.html.haml`
  {% highlight ruby %}
  = link_to 'Preview Emails', letter_opener_letters_path if Rails.env.staging?
  {% endhighlight %}

3 - If you cannot write to the filesystem let letter_opener know in your `config/environments/staging.rb`
  {% highlight ruby %}
  config.action_mailer.delivery_method = :letter_opener
  LetterOpener.cannot_write_to_file_system!
  {% endhighlight %}

Now we can see it all in action.

First, we request an invite.

![Previewing an Email with Letter Opener in Development](http://www.alexrothenberg.com/images/2011-10-24-previewing-email-instead-of-sending-prior-to-production/invite_requested_on_server.png)

Then, we click the link "view the Emails that users would have received" link at the bottom and see an "inbox" of everything the app sent.

![Previewing an Email with Letter Opener in Development](http://www.alexrothenberg.com/images/2011-10-24-previewing-email-instead-of-sending-prior-to-production/preview_inbox_on_server.png)

Fincally clicking one message lets us preview it just as we did in devellopment

![Previewing an Email with Letter Opener in Development](http://www.alexrothenberg.com/images/2011-10-24-previewing-email-instead-of-sending-prior-to-production/preview_email_on_server.png)

We are able to run on heroku without writing to the file system by using the [FakeFS gem](https://github.com/defunkt/fakefs) which simulates the filesystem in memory.
FakeFS is designed to be used for testing and one caveat to be aware of is that your old emails will disappear if heroku recycles your dyno due to inactivity. 

I hope you think *letter_opener* is useful and give it a try the next time you need to send email.
Remember here's a [live demo at http://awesome-site-staging.heroku.com/](http://awesome-site-staging.heroku.com/) of the site we've been talking about here.



 



