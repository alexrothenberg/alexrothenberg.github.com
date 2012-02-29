---
layout: post
title: Building a Browser IDE
---

Its become so easy to share code examples as [gists](https://gist.github.com/gists) but once you start sharing html, css or javascript
you can do so much more than share static code.  Browsers can run html, css and javascript so we can actually run the code we're sharing.
Let's look at how we could build a simple IDE in your browser like [jsfiddle](http://jsfiddle.net/) where
where you can  experiment with your HTML, CSS and Javascript.

# HTML IDE

First we're going to build an `HTML` editor. Try it out...I'll wait.

<style>
  .demo { width:80%; margin:auto; margin-bottom:1em; }
  .demo iframe  { width: 100%; border: 5px inset; }
</style>
<script type="text/javascript">
  $(function() {
    $('#html_ide iframe').contents().find('.link_back').hide()
    $('#html_css_ide iframe').contents().find('.link_back').hide()
    $('#html_css_js_ide iframe').contents().find('.link_back').hide()
    $('#complete_ide iframe').contents().find('.link_back').hide()
  })
</script>

<div id="html_ide" class="demo">
  <iframe src="/examples/browser_ide/html_ide.html" style="height:325px;">
  </iframe>
</div>

How does it work? We need three things.

1 - A `textarea` where you can type in the html
  {% highlight html %}
  <textarea id="html" class="content">
    Hi there this is some <b>bold</b> content
    and this is <i>italic</i>.
    <p>Pretty cool huh!</p>
    <p>What else can you type?</p>
  </textarea>
  {% endhighlight %}

2 - An `iframe` to preview the page
{% highlight html %}
<iframe id="preview" class="content"></iframe>
{% endhighlight %}

3 - Some javascript to copy the html from the text area into the div
{% highlight javascript %}
$('#html').keypress(function() {
  $('#preview').contents().find('html').html($(this).val())
})
{% endhighlight %}

After we add some formatting and put it all together we get a page like this.

<div class="github_link"><a href="http://www.alexrothenberg.com/examples/browser_ide/html_ide.html">http://www.alexrothenberg.com/examples/browser_ide/html_ide.html</a></div>
{% highlight html %}
<html>
  <head>
    <meta charset=utf-8>
    <title>Browser IDE</title>
    <link rel="stylesheet" href="./styles.css" type="text/css" charset="utf-8">
    <script src="jquery.min.js"></script>
    <script type='text/javascript'>
      $(function() {
        $('#html').keyup(function() {
          $('#preview').contents().find('body').html($(this).val())
        })
        $('#html').keyup() // Initialize
      })
    </script>
  </head>
  <body>
    <h1>Edit the HTML and see it in the Preview</h1>
    <div class="box">
      <div class="label">HTML</div>
      <textarea id="html" class="content">
Hi there this is some <b>bold</b> content
and this is <i>italic</i>.
<p>Pretty cool huh!</p>
<p>What else can you type?</p>
      </textarea>
    </div>
    <div class="box">
      <div class="label">Preview</div>
      <iframe id="preview" class="content"></iframe>
    </div>
  </body>
</html>
{% endhighlight %}

# HTML and CSS IDE

HTML is good but any self respecting webpage will also have a `CSS` file.  We can add that too.

<div id="html_css_ide" class="demo">
  <iframe src="/examples/browser_ide/html_css_ide.html" style="height:550px;">
  </iframe>
</div>

To get this working we added 

1 - A new `textarea` where you can type in the css
  {% highlight html %}
  <textarea id="css" class="content">
    .warning { color: red; }
  </textarea>
  {% endhighlight %}

2 - Some javascript to copy the css from the text area into the div
  {% highlight javascript %}
  $('#css').keypress(function() {
    preview_contents.find('head style').remove()
    preview_contents.find('head').append("<style>" + $(this).val() + "</style>")
  })
  {% endhighlight %}

All put together it looks like this.

<div class="github_link"><a href="http://www.alexrothenberg.com/examples/browser_ide/html_css_ide.html">http://www.alexrothenberg.com/examples/browser_ide/html_css_ide.html</a></div>
{% highlight html %}
<html>
  <head>
    <meta charset=utf-8>
    <title>Browser IDE</title>
    <link rel="stylesheet" href="./styles.css" type="text/css" charset="utf-8">
    <script src="jquery.min.js"></script>
    <script type='text/javascript'>
      $(function() {
        var preview_contents = $('#preview').contents()
        $('#html').keyup(function() {
          preview_contents.find('body').html($(this).val())
        })
        $('#css').keyup(function() {
          preview_contents.find('head style').remove()
          preview_contents.find('head').append("<style>" + $(this).val() + "</style>")
        })
        $('#html').keyup() // Initialize
        $('#css').keyup() // Initialize
      })
    </script>
  </head>
  <body>
    <h1>Edit HTML and CSS</h1>
    <div class="box">
      <div class="label">HTML</div>
      <textarea id="html" class="content">
<div class="warning">This is a warning!</div>
<div class="message">This is a message.</div>
      </textarea>
    </div>
    <div class="box">
      <div class="label">CSS</div>
      <textarea id="css" class="content">
.warning { color: red; }
/* Try adding a .message style.  Make it bold. */
      </textarea>
    </div>
    <div class="box">
      <div class="label">Preview</div>
      <iframe id="preview" class="content"></iframe>
    </div>
  </body>
</html>
{% endhighlight %}

# HTML, CSS and Javascript IDE

So the last part of the page we want to edit is `javascript`.

<div id="html_css_js_ide" class="demo">
  <iframe src="/examples/browser_ide/html_css_js_ide.html"  style="height:550px;">
  </iframe>
</div>

We implement this following the same pattern we've been using.

1 - A new `textarea` where you can type in the javascript
  {% highlight html %}
  <textarea id="javascript" class="content">
    // Change the next line and watch the preview change
    var new_text = 'This text was added by js'

    var js_element = document.getElementById('js_content')
    js_element.innerHTML = new_text
  </textarea>
  {% endhighlight %}

2 - Some javascript to copy the css from the text area into the div
  {% highlight javascript %}
  $('#javascript').keypress(function() {
    preview_contents.find('head script').remove()
    var created_script = preview_contents[0].createElement('script');
    created_script.text = $(this).val()
    preview_contents.find('head')[0].appendChild(created_script)
  })
  {% endhighlight %}

Here's the complete page.

<div class="github_link"><a href="http://www.alexrothenberg.com/examples/browser_ide/html_css_js_ide.html">http://www.alexrothenberg.com/examples/browser_ide/html_css_js_ide.html</a></div>
{% highlight html %}
<html>
  <head>
    <meta charset=utf-8>
    <title>Browser IDE</title>
    <link rel="stylesheet" href="./styles.css" type="text/css" charset="utf-8">
    <script src="jquery.min.js"></script>
    <script type='text/javascript'>
      $(function() {
        var preview_contents = $('#preview').contents()
        $('#html').keyup(function() {
          preview_contents.find('body').html($(this).val())
          $('#javascript').keyup()   // let the javascript change the page 
        })
        $('#css').keyup(function() {
          preview_contents.find('head style').remove()
          preview_contents.find('head').append("<style>" + $(this).val() + "</style>")
        })
        $('#javascript').keyup(function() {
          preview_contents.find('head script').remove()
          var created_script = preview_contents[0].createElement('script');
          created_script.text = $(this).val()
          preview_contents.find('head')[0].appendChild(created_script)
        })
        $('#html').keyup() // Initialize
        $('#css').keyup() // Initialize
        $('#javascript').keyup() // Initialize
      })
    </script>
  </head>
  <body>
    <h1>Edit HTML, CSS and Javascript</h1>
    <div class="box">
      <div class="label">HTML</div>
      <textarea id="html" class="content">
<div class="warning">This is a warning!</div>
<div class="message">This is a message</div>
<div id="js_content"></div>
      </textarea>
    </div>
    <div class="box">
      <div class="label">CSS</div>
      <textarea id="css" class="content">
.warning { color: red; }
      </textarea>
    </div>
    <div class="box">
      <div class="label">Javascript</div>
      <textarea id="javascript" class="content">
// Change the next line and watch the preview change
var new_text = 'This text was added by js'

var js_element = document.getElementById('js_content')
js_element.innerHTML = new_text
      </textarea>
    </div>
    <div class="box">
      <div class="label">Preview</div>
      <iframe id="preview" class="content"></iframe>
    </div>
  </body>
</html>
{% endhighlight %}


# Syntax highlighting

We now have a very simple IDE but its missing something all code editors have.  No I don't mean "save", although that is important I'm going to ignore it.  When I'm typing text it all starts to run together and become really hard to read.  It would be so much easier if we had some `syntax highlighting`.  We're going to use a javascript library called [CodeMirror](http://codemirror.net) which knows how to syntax highlight `html`, `css`, `javascript` and a ton of other languages.

When we're done it will be much easier to read our code

<div id="complete_ide" class="demo">
  <iframe src="/examples/browser_ide/index.html"  style="height:550px;">
  </iframe>
</div>

We'll add CodeMirror in these 3 steps.

1 - First we [download CodeMirror](http://codemirror.net/codemirror.zip) and save it along with our files.

2 - Now we need to add it to our page 
  {% highlight html %}
  <link rel="stylesheet" href="./codemirror/codemirror.css">
  <script src="./codemirror/mode/javascript/javascript.js"></script>
  <script src="./codemirror/mode/css/css.js"></script>
  <script src="./codemirror/mode/xml/xml.js"></script>
  <script src="./codemirror/mode/htmlmixed/htmlmixed.js"></script>
  {% endhighlight %}

3 - Finally some javascript that enables CodeMirror on our three textareas.  Here's the code for the `html` pane.
  {% highlight javascript %}
  CodeMirror.fromTextArea($('#html')[0], {
    mode:  "htmlmixed", 
    matchBrackets: true,
    onChange: function(editor) { copyHTML(editor.getValue()) }
  })
  var copyHTML = function(html_text) {
    preview_contents.find('html').html(html_text)
    copyJavascript($('#javascript').val())  // let the javascript change the page
  }
  copyHTML($('#html').val())             // Initialize
  {% endhighlight %}

CodeMirror actually offers a ton more functionality than just syntax highlighting like emacs or vim keybinding, matching parentheses, undo, and more that you can investigate if you're interested.  When we're done with all that we have this single page app.

<div class="github_link"><a href="http://www.alexrothenberg.com/examples/browser_ide/index.html">http://www.alexrothenberg.com/examples/browser_ide/index.html</a></div>
{% highlight html %}
<html>
  <head>
    <meta charset=utf-8>
    <title>Browser IDE</title>
    <link rel="stylesheet" href="./styles.css" type="text/css" charset="utf-8">
    <script src="jquery.min.js"></script>
    <script src="./codemirror/codemirror.js"></script>
    <link rel="stylesheet" href="./codemirror/codemirror.css">
    <script src="./codemirror/mode/javascript/javascript.js"></script>
    <script src="./codemirror/mode/css/css.js"></script>
    <script src="./codemirror/mode/xml/xml.js"></script>
    <script src="./codemirror/mode/htmlmixed/htmlmixed.js"></script>
    <script type='text/javascript'>
      $(function() {
        var preview_contents = $('#preview').contents()
        CodeMirror.fromTextArea($('#html')[0], {
          mode:  "htmlmixed", 
          matchBrackets: true,
          onChange: function(editor) { copyHTML(editor.getValue()) }
        })
        CodeMirror.fromTextArea($('#css')[0], {
          mode:  "css", 
          matchBrackets: true,
          onChange: function(editor) { copyCSS(editor.getValue()) }
        })
        CodeMirror.fromTextArea($('#javascript')[0], {
          mode:  "javascript", 
          matchBrackets: true,
          onChange: function(editor) { copyJavascript(editor.getValue()) }
        })
        var copyHTML = function(html_text) {
          preview_contents.find('body').html(html_text)
          copyJavascript($('#javascript').val())  // let the javascript change the page
        }
        var copyCSS =function(css_text) {
          preview_contents.find('head style').remove()
          preview_contents.find('head').append("<style>" + css_text + "</style>")
        }
        var copyJavascript =function(javascript_text) {
          preview_contents.find('head script').remove()
          var created_script = preview_contents[0].createElement('script');
          created_script.text = javascript_text
          preview_contents.find('head')[0].appendChild(created_script)
        }
        copyHTML($('#html').val())             // Initialize
        copyCSS($('#css').val())               // Initialize
        copyJavascript($('#javascript').val()) // Initialize
      })
    </script>
  </head>
  <body>
    <h1>Edit HTML, CSS and Javascript with Syntax Highlighting</h1>
    <div class="box">
      <div class="label">HTML</div>
      <textarea id="html" class="content">
<div class="warning">This is a warning!</div>
<div class="message">This is a message</div>
<div id="js_content"></div>
      </textarea>
    </div>
    <div class="box">
      <div class="label">CSS</div>
      <textarea id="css" class="content">
.warning { color: red; }
      </textarea>
    </div>
    <div class="box">
      <div class="label">Javascript</div>
      <textarea id="javascript" class="content">
// Change the next line and watch the preview change
var new_text = 'This text was added by js'

var js_element = document.getElementById('js_content')
js_element.innerHTML = new_text
      </textarea>
    </div>
    <div class="box">
      <div class="label">Preview</div>
      <iframe id="preview" class="content"></iframe>
    </div>
  </body>
</html>
{% endhighlight %}

This entire sample we've built is on github at [https://github.com/alexrothenberg/alexrothenberg.github.com/tree/master/examples/browser_ide](https://github.com/alexrothenberg/alexrothenberg.github.com/tree/master/examples/browser_ide).


