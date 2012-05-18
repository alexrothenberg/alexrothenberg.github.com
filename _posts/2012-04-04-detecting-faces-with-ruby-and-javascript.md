---
layout: post
tags: ruby,javascript
title: Detecting Faces with Ruby and Javascript
---

<img src="http://www.alexrothenberg.com/images/2012-04-04-detecting-faces-with-ruby-and-javascript/alex_mustache.png" class="heading_image">

I am amazed when Facebook, Picasa or iPhoto "finds" my face in a photo.  This is ninja computer science and we're all using it.
What's even cooler than using it in someone else's app is to add it to your own.  Its remarkably easy with the libraries out there to do this even if you're not a computer vision expert and have no idea about the sophisticated algorithms that make it work.

Today I'll look at three approaches we can take to detect a face and to make it more fun we'll then copy an idea from [mustachify.me](http://mustachify.me) and draw a silly mustache in the right place.

1. Using a cloud based service
2. Using a gem with native (ie. C) code
3. Pure Javascript

# Using a cloud based service face.com

We'll start with the simplest approach ... let someone else do the work.  There's a free service at [face.com](http://face.com) that can detect faces and if you train it can recognize whose face it is finding.  They have a nice [page of working examples](http://developers.face.com/tools/#faces/detect) that shows how to use the api.

First we need to [create a face.com account](http://developers.face.com/account/) then create an "application" to get your `API Key` and `API Secret`.  I store them as shell environment variables

{% highlight bash %}
export FACE_API_KEY=abc1234567890
export FACE_API_SECRET=xyz0987654321
{% endhighlight %}

We add the "face" gem to our `Gemfile`

{% highlight ruby %}
gem 'face'
{% endhighlight %}

And it only takes 2 lines to tell the api to find the faces for us.

{% highlight ruby %}
def find_face(file_name)
  face_client = Face.get_client(:api_key => ENV['FACE_API_KEY'], :api_secret => ENV['FACE_API_SECRET'])
  face_client.faces_detect(:file => File.new(file_name, 'rb'))
end
{% endhighlight %}

That's it. 

{% highlight ruby %}
[{"url"=>"http://face.com/images/ph/bb8959bac2805d1584399273d241f4f8.jpg", 
  # lots of other stuff
  "tags"=>[{
    # even more stuff
    "width"=>51.67, "height"=>51.67, 
    "center"=>{"x"=>69.83, "y"=>46.5}, 
    "eye_left"=>{"x"=>63.92, "y"=>35.08}, 
    "eye_right"=>{"x"=>86.34, "y"=>33.95}, 
    "mouth_left"=>{"x"=>65.73, "y"=>59.01}, 
    "mouth_center"=>{"x"=>79.73, "y"=>60.55}, 
    "mouth_right"=>{"x"=>88.83, "y"=>57.73}, 
    "nose"=>{"x"=>82.96, "y"=>48.67}, 
  }]
}]
{% endhighlight %}


# Running locally

brew install opencv
https://github.com/ryanfb/ruby-opencv

# JS

https://github.com/liuliu/ccv
