---
layout: post
title: Moved Blog to Jekyll and GitHub Pages
---

I just moved my blog to [Jekyll](http://jekyllrb.com) and [Github Pages](http://pages.github.com) which I hope will help me get back into the rhythm of posting regularly.

## Why did I switch?

There were several things I wanted to change 
* _Syntax highlighting for my code_ &mdash; Jekyll uses [pygments](http://pygments.org/) which supports about a bazillion [languages](http://pygments.org/languages/) including "Gherkin" (cucumber) and blogger had nothing.
* _Authoring tools I wanted_ &mdash; The blogger wysiwyg editor never really worked for me and I'd prefer to use [TextMate](http://macromates.com) and  [markdown](http://en.wikipedia.org/wiki/Markdown) or [textile](http://en.wikipedia.org/wiki/Textile_%28markup_language%29) anyway.
* _New site design_ &mdash; Making the move gave me a chance to redo my design.  The old one felt cluttered and dated and I hope this new one is not.
* _Geek street cred_ &mdash; I like having everything on [github](https://github.com/alexrothenberg/alexrothenberg.github.com) and besides all the cool kids are doing it :)

*Jekyll* is a gem that converts a structured directory of pages and posts written in markdown, textile or html into static html files that can be served by apache or nginx.  Of course there's an [official definition](https://github.com/mojombo/jekyll/wiki) that explains it in more detail.

With *Github Pages* I just have to create a git repository [alexrothenberg.github.com](https://github.com/alexrothenberg/alexrothenberg.github.com) and with each push github runs jekyll to generate a static site it serves up at [http://alexrothenberg.github.com](http://alexrothenberg.github.com)


## How did I create this new site?

### 1. Create an empty site
There are lots of [sites](https://github.com/mojombo/jekyll/wiki/Sites) others have created with jekyll to peruse for design ideas.  I spent some time looking through them and eventually picked one to use as a template.  I copied one and pushed it to a new project on github called [alexrothenberg.github.com](https://github.com/alexrothenberg/alexrothenberg.github.com).


### 2. Get my existing content
First I had to get my old content out of blogger into a Jekyll site.  There are instructions for [migrating](https://github.com/mojombo/jekyll/wiki/Blog-Migrations) from many different platforms (including [from blogger to jekyll](http://coolaj86.info/articles/migrate-from-blogger-to-jekyll.html)).  I followed the instructions to "import with vilcans' Jekyll rss_importer" and just had to change the rss url to http://www.alexrothenberg.com/feeds/posts/full?alt=rss&max-results=1000 since I had more than 25 posts.  

I now had my posts in the _\_posts_ folder.  I copied these posts into my _alexrothenberg.github.com/\_posts_ and had a version of my blog with all my old posts.


### 3. Syntax highlighting code
I next did some experimentation with the old posts to see how the code highlighting worked.  It's very natural and in-the-flow.  

While writing my article I just add a block like

    { % highlight ruby %}
    class User
      def name
        [first, last].join(' ') 
      end
    end
    { % endhighlight %}

and get this fantastic output
    
{% highlight ruby %}
class User
  def name
    [first, last].join(' ') 
  end
end
{% endhighlight %}

Well not quite... It generated html with all sorts of css classes but I couldn't find css stylesheets out there with the [Vibrant Ink](http://alternateidea.com/blog/articles/2006/01/03/textmate-vibrant-ink-theme-and-prototype-bundle) theme I like.  
Through some trial and error I created my own [vibrant_ink.css](https://github.com/alexrothenberg/alexrothenberg.github.com/blob/master/stylesheets/vibrant_ink.css)

### 4. Disqus comments
Because Jekyll generates static pages it has no commenting engine so I have to integrate with an external service.  I decided to go with [disqus](http://disqus.com).  
Adding it into my site was simple but getting my old comments in turned out to be much harder than it should have been.

First I went to disqus.com, signed up for an account and used their admin too to create a site for www.alexrothenberg.com.  They give you a bit of javascript to add to your page. I added this to my [\_layouts/post.html](https://github.com/alexrothenberg/alexrothenberg.github.com/blob/master/_layouts/post.html#L12-14) and I was done.

It looked like it would be just as easy to import my comments from blogger as they have a big _import from blogger_ button on their admin site under Tools->Import/Export.  I ran it and I suddenly had all my old comments.  But this is where things started to break down.  Blogger ties the comments to  [blogger profiles](http://www.blogger.com/profile/18273757675203348828) instead of an email address so none of my comments had avatar pictures next to them.  

What followed was a frustrating journey to try and edit the comments using their admin tool.  The first thing I tried was using their admin tool but it doesn't let you edit a commenter's email or url so I couldn't stick email addresses in when I knew them (for example I know my own email).  My next approach was to export the comments in disqus, edit the xml file it gave me and re-upload.  The problem here is that the exported xml uses a different format than the import accepts although they don't tell you that when you try importing the file you exported it just tells you 0 items imported - how annoying?!?  

After a lot of trial and error I wound up with all my comments in an xml file that disqus could import.  In case you want to do something similar here are the steps I followed

1. Create a temp site in disqus (I called mine alexrothenberg1)
2. Import the comments from blogger using the Disqus import tool
3. Export those comments to an xml file - I saved mine in 
   [alexrothenberg.github.com/\_disqus_import/exported\_comments.xml](https://github.com/alexrothenberg/alexrothenberg.github.com/blob/master/_disqus_import/exported_comments.xml) 
4. Run my script
   [alexrothenberg.github.com/\_disqus_import/exported2import](https://github.com/alexrothenberg/alexrothenberg.github.com/blob/master/_disqus_import/export2import) 
   to migrate the format to a Word Press XFR and change the timestamp format.
5. Hand edit    
   [alexrothenberg.github.com/\_disqus_import/import\_comments.xml](https://github.com/alexrothenberg/alexrothenberg.github.com/blob/master/_disqus_import/import_comments.xml) 
   to update the emails and urls for each comment (luckily I didn't have that many old comments)
6. Delete the temp discus site and create a new one
7. Import my XFR file to the new site
8. Jekyll and Blogger use different formats for post urls (jekyll includes year/month/date while blogger is year/month) so we need to run the
   disqus Migrate Threads->Upload a URL Map tool to upload a file like 
   [alexrothenberg.github.com/\_disqus_import/url.map](https://github.com/alexrothenberg/alexrothenberg.github.com/blob/master/_disqus_import/url.map) 


### 5. Mapping my domain name
At this point I have a blog site up at http://alexrothenberg.github.com and its only a quick step to start serving it at [http://www.alexrothenberg.com](http://www.alexrothenberg.com).

1. Create a [CNAME](https://github.com/alexrothenberg/alexrothenberg.github.com/blob/master/CNAME) containing ``www.alexrothenberg.com`` in my project
2. Update the dns entry in my domain to create a CNAME record aliasing ``www`` to ``alexrothenberg.github.com``

## Authoring and Publishing
Now that the site is up and running it was time to write my first article (this one). 

1. `jekyll --auto --server`
   
   Starts the jekyll server running at http://localhost:4000 and monitors the files so it regenerates each time I save an edit
2. `newpost Moved Blog to Jekyll and GitHub Pages`

   Creates a new empty post using a script I stuck in my project [\_bin](https://github.com/alexrothenberg/alexrothenberg.github.com/blob/master/_bin/newpost) 
   (thanks [al3x](https://github.com/al3x) for this [gist](https://gist.github.com/100171/26dfa6f55f442c223c8491fb2bfaea15bda7351a))
3. Start writing content in [\_posts/2011-01-27-moved-blog-to-jekyll-and-github-pages.md](https://github.com/alexrothenberg/alexrothenberg.github.com/blob/master/_posts/2011-01-27-moved-blog-to-jekyll-and-github-pages.md)

   Each time I hit save I can preview in a few seconds at http://localhost:4000
4. `git commit -am 'wrote the article'`
5. `git push origin master`

In a few seconds github processes the site into static files and its published for all the world to see.
