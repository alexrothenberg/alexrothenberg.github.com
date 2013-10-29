---
layout: post
tags:
title:  "Lets Get Small: Why I Dislike the Module Include Pattern"
---

Like many others in the Ruby community I've read and been inspired by Sandi Metz's great book [Practical Object-Oriented Design in Ruby](http://www.poodr.com/).
If you haven't read it yet go out an buy it (right after you finish this article :)
There is a lot of information in there but the simple mantra I've taken from it is: **Smaller is better than Bigger**.

* Small classes
* Small methods
* Small number of responsibilities (single responsibility principle)
* Small files
* Small number of dependencies
* Small everything

[![Let's Get Small](http://upload.wikimedia.org/wikipedia/en/b/b7/Letsgetsmall.jpg)](http://en.wikipedia.org/wiki/Let's_Get_Small)

**Let's Get Small** - I try to keep repeating this mantra as I code and find that it results in better, more testable and easier to understand code.

We're going to look at an example that tries to DRY up some code by extracting it into a module that gets included in different classes. Even though it looks like this shrinks the classes we'll see that it actually doesn't and is a pattern to be avoided.

Let's imagine we need to record certain events in an audit log. Our application is running on many different places and the audit log lives on a remote server and we post our events using an http api.

## Simplest straw-man solution

The simplest solution is to just put the HTTP post code in each of our classes.

{% highlight ruby linenos%}
class MyClass
  def do_something
    HTTP.post 'http://api.example.com/audit/log', event: 'I did something'

    # actually do something
  end
end
{% endhighlight %}

Reading this you can see the audit trail code on line 3 but its not really clear that that is recording to an audit log.  Additionally a real implementation with error handling and additional logic would almost certainly be more than a single line causing a lot of duplication once we copy-and-paste into another class.

We need an `AuditLog` thing to DRY up the code and make the dependency more explicit.

## The module include anti-pattern

Our first refactor is to create an `AuditTrail` module and include it in many different classes.
I've seen this often (heck I've written it a lot) but my thinking has evolved and I now avoid it because it violates the **keep it small** rule.

{% highlight ruby linenos%}
class MyClass
  include AuditTrail

  def do_something
    record_in_audit_trail 'I did something'

    # actually do something
  end
end
{% endhighlight %}

You can see on line 2 we include the module and on line 5 we `record_in_audit_trail`.

The included module look like this:

{% highlight ruby linenos%}
module AuditTrail
  def record_in_audit_trail(message)
    HTTP.post 'http://api.example.com/audit/log', event: message
  end
end
{% endhighlight %}

The good things about this refactor are

* We now have an AuditTrail module that can be adapt as the implementation grows to more than a single line.
* Other classes besides `MyClass` can also use the `AuditTrail`.

So what's wrong with this design? Well, by including the AuditTrail:

* We increase the size of each of our classes. Each now responds to its methods *and* all the methods of the AuditTrail (I know its only 1 in this simple example).
* We had to adopt a naming convention `record_in_audit_trail` that hints at where the method is defined. This makes line 5 of `MyClass` easier to read but makes line 2 of `AuditTrail` more confusing and harder to read.

We've decreased the size of each class' file and extracted common code (both good things) but we haven't really made the surface area of the class smaller and the dependency on `AuditTrail` is explicit on line 2 but hidden on line 5.

The next refactor solves these problems to keep the surface area of each class small and also make explicit that AuditTrail stuff is the responsibility of the AuditTrail?

# Make AuditTrail a class

Since Ruby is all about classes and sending messages between objects so let's use create an `AuditTrail` class. Now our `MyClass` looks like this

{% highlight ruby linenos%}
class MyClass
  def do_something
    AuditTrail.record 'I did something'

    # actually do something
  end
end
{% endhighlight %}

Its really easy to see on line 3 where it _tells_ the AuditTrail to record the event and the rest of the code is 100% related to its responsibility (doing something).

On the `AuditTrail` side we simply change it from a module to a class and rename its method to `record`

{% highlight ruby linenos %}
class AuditTrail
  def self.record(message)
    HTTP.post 'http://api.example.com/audit/log', event: message
  end
end
{% endhighlight %}

Since it is a class we also have the opportunity to extend it as requirements change perhaps using [resque](https://github.com/resque/resque) or something else so we do our processing in the background.

{% highlight ruby linenos %}
class AuditTrail
  attr_reader :message
  def initialize(message)
    @message = message
  end

  def self.record(message)
    new(message).send
  end

  def send
    HTTP.post url, event: message
  end

  def url
    'http://api.example.com/audit/log'
  end
end
{% endhighlight %}

What are the advantages of this approach?

* Each class clearly defines its single responsibility without any pollution from the AuditTrail responsibility.
* The classes are easier to read as their dependency on AuditTrail is explicit as `AuditTrail.add` (I believe Sandi Metz would argue that this dependency should be extracted through dependency injection but I'm still struggling with that idea)
* The AuditTrail class also defines it's responibility and is free to name its method `add` instead of `add_to_audit_trail`.

In summary by using a class instead of including a module we **keep it small** and smaller is better.
