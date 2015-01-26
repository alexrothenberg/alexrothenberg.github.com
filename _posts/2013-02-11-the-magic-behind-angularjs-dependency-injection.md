---
layout: post
tags: angularjs,javascript
title: The "Magic" behind AngularJS Dependency Injection
---

If you've built anything with AngularJS you know there's a lot of "magic"
that you can usually ignore because it just works.  One of the most magical parts for me is
**dependency injection**. Just by adding a parameter to your controller function you suddenly get access
to a powerful Angular service.
It's really pretty amazing but you sorta just have to trust it ... until something goes wrong.

It turns out one easy way to break an AngularJS app is to minify your javascript. This happened to me when I deployed
my app to production. The Angular app was being served from a Rails application and Rails automatically minifies
javascript in prodution.
It turns out there's a simple and a [well documented fix](http://docs.angularjs.org/tutorial/step_05) in their tutorial
(search for "A Note on Minification") that boils down to "use an array of parameter names"
but it wasn't clear to me _why_ it worked.

In the rest of this article we're going to

1. Build a simple AngularJS application
2. See how magical dependency injection is
3. Investigate how dependency injection is implemented in AngularJS
4. Break our app by minifying the javascript
5. Understand how the fix works

## An AngularJS application using the GitHub API

We're going to build a simple AngularJS app that uses the GitHub API to find the most recent commits on the angular.js project.

<div class="demo" style="text-align:center; height:300px; width:80%;">
  <div class="github_link"><a href="/examples/angularjs_dependency_injection/index.html" target="_blank">http://alexrothenberg.github.com/examples/angularjs_dependency_injection/index.html</a></div>
  <iframe src="/examples/angularjs_dependency_injection/index.html" style="height:100%;width:100%">
  </iframe>
</div>


Here's the source for that page:

{% highlight html linenos=table %}
<html ng-app>
<head>
  <script src="http://ajax.googleapis.com/ajax/libs/angularjs/1.0.4/angular.js"></script>

  <script>
  var MyController = function($scope, $http) {
    $http.get('https://api.github.com/repos/angular/angular.js/commits')
      .success(function(commits) {
        $scope.commits = commits
      })
  }
  </script>
</head>

<body ng-controller="MyController">
  <h1>Recent commits to AngularJS</h1>
  <ul>
    <li ng-repeat="commit in commits">
      {% raw %}{{ commit.commit.committer.date | date }}{% endraw %}
      <a ng-href="https://github.com/angular/angular.js/commit/{% raw %}{{commit.sha}}{% endraw %}">{% raw %}{{ commit.sha }}{% endraw %}</a>
      {% raw %}{{ commit.commit.message }}{% endraw %}
    </li>
  </ul>
</body>
</html>
{% endhighlight %}

Let's walk through what's going on here:

* Line 1 - The `ng-app` attribute tells angular to treat this page as an angular app.
* Line 6-11 - Some JavaScript that defines the controller and tell angular to "inject" the `$scope` and `$http` services.
* Line 15 - The `ng-controller="MyController"` attribute tells angular the `body` tag will be scoped by the `MyController` controller.
* Line 18-22 - This section will be expanded to many `li` elements in the DOM, each containing information about one commit.

This is pretty cool. Of course not everyone is a fan, in
[Dependency injection is not a virtue](http://david.heinemeierhansson.com/2012/dependency-injection-is-not-a-virtue.html)
DHH argues that it is a legacy of the Java language that is unnecessary in Ruby (and I suspect he would argue JavaScript).
AngularJS is figuring out what the hash part of the url is and automatically inserting it in the page.

## Dependency Injection is magical

So where does dependency injection come in?  Here's where it gets weird... let's try reordering the arguments in the controller function.

{% highlight javascript %}
var MyController = function($http, $scope) {
  $http.get('https://api.github.com/repos/angular/angular.js/commits')
    .success(function(commits) {
      $scope.commits = commits
    })
}
{% endhighlight %}

We changed `function($scope, $http)` to `function($http, $scope)` and surprisingly it still works!

<div class="demo" style="text-align:center; height:300px; width:80%;">
  <div class="github_link"><a href="/examples/angularjs_dependency_injection/args_swapped.html" target="_blank">http://alexrothenberg.github.com/examples/angularjs_dependency_injection/args_swapped.html</a></div>
  <iframe src="/examples/angularjs_dependency_injection/args_swapped.html" style="height:100%;width:100%">
  </iframe>
</div>

What seems to be going on as it runs is AngularJS

1. Knows what services our controller function needs in each parameter slot (originally `$scope` first & `$http` second now `$http` first & `$scope` second).
2. Decides what object should "provide" each of the named services (eg. [$httpProvider](http://docs.angularjs.org/api/ng.$httpProvider) provides `$http`).
3. Calls our controller with the appropriate providers in each slot (either `MyController(scope, $httpProvider)` or `MyController($httpProvider, scope)`).

How does Angular do step #1?

In JavaScript the order of the parameters is important and the names do not matter to the caller
(see this [egghead.io video: $scope vs. scope](http://egghead.io/video/faq-scope-vs-scope/))

Let's take a look at some straight JavaScript and convince ourselves this is true. If we define a function divide that takes two arguments

{% highlight javascript %}
var divide = function(numerator, denominator) {
  return numerator / denominator;
}
{% endhighlight %}

As expected `divide(1, 2) == 0.5`.

<div class="demo" style="text-align:center; height:120px; width:80%;">
  <div class="github_link"><a href="/examples/angularjs_dependency_injection/divide.html" target="_blank">http://alexrothenberg.github.com/examples/angularjs_dependency_injection/divide.html</a></div>
  <iframe src="/examples/angularjs_dependency_injection/divide.html" style="height:100%;width:100%">
  </iframe>
</div>

When we change the order of the parameters, we also change the definition of the function.

{% highlight javascript %}
var divide = function(denominator, numerator) {
  return numerator / denominator;
}
{% endhighlight %}

Now the definition has changed and `divide(1, 2) == 2`

<div class="demo" style="text-align:center; height:120px; width:80%;">
  <div class="github_link"><a href="/examples/angularjs_dependency_injection/divide_args_swapped.html" target="_blank">http://alexrothenberg.github.com/examples/angularjs_dependency_injection/divide_args_swapped.html</a></div>
  <iframe src="/examples/angularjs_dependency_injection/divide_args_swapped.html" style="height:100%;width:100%">
  </iframe>
</div>

It seems Angular is going above and beyond what JavaScript the language supports.

## How Dependency Injection implements Named Parameters in JavaScript

We saw that Angular's dependency injection relies on the name of the parameters not their order which is a language feature called
[named parameters](http://en.wikipedia.org/wiki/Named_parameter) that does not exist in JavaScript.
How do they do it?

AngularJS makes clever use of the fact that every object in JavaScript has a `toString` function to parse and extract the names
of the parameters before deciding what arguments to call your controller function with.

Let's play around with `toString` and get a feel of how it works.
On function objects it returns the source code definition of the object,
including the function signature with the names of the parameters.

When we call it on our `divide` function we can see this in action,
`divide.toString() == "function (numerator, denominator) {
   return numerator / denominator;
}"
`

<div class="demo" style="text-align:center; height:120px; width:80%;">
  <div class="github_link"><a href="/examples/angularjs_dependency_injection/divide_toString.html" target="_blank">http://alexrothenberg.github.com/examples/angularjs_dependency_injection/divide_toString.html</a></div>
  <iframe src="/examples/angularjs_dependency_injection/divide_toString.html" style="height:100%;width:100%">
  </iframe>
</div>

Angular takes this to the next level in a function called `annotate` in
[injector.js](https://github.com/angular/angular.js/blob/master/src/auto/injector.js#L53-61)
that takes a function and returns the names of its parameters.

{% highlight javascript linenos=table %}
$inject = [];
fnText = fn.toString().replace(STRIP_COMMENTS, '');
argDecl = fnText.match(FN_ARGS);
forEach(argDecl[1].split(FN_ARG_SPLIT), function(arg){
  arg.replace(FN_ARG, function(all, underscore, name){
    $inject.push(name);
  });
});
fn.$inject = $inject;
// ...
return $inject;
{% endhighlight %}

* line 2 - use the `toString()` trick to get the function definition.
* line 3 - do regular expression pattern matching `FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m` to find the function signature.
* line 4-8 - loop through all the parameters and save their names in an array.
* line 11 - return the array or parameter names.

We can see this in action with our trusty `divide` function,
`angular.injector().annotate(divide) == ["numerator", "denominator"]`

<div class="demo" style="text-align:center; height:120px; width:80%;">
  <div class="github_link"><a href="/examples/angularjs_dependency_injection/divide_annotate.html" target="_blank">http://alexrothenberg.github.com/examples/angularjs_dependency_injection/divide_annotate.html</a></div>
  <iframe src="/examples/angularjs_dependency_injection/divide_annotate.html" style="height:100%;width:100%">
  </iframe>
</div>

## Minification breaks our App

The technique of using `toString` has a big problem. We often minify our javascript before sending it to the browser,
in my case the Rails asset pipeline was configured to automatically do this in the production environment.

{% highlight javascript %}
// whitespace re-added for readability
var MyController = function(e,t) {
  t.get("https://api.github.com/repos/angular/angular.js/commits")
    .success(function(t) {
      e.commits=t
    })
}
{% endhighlight %}

When minified the parameter names are mangled to `e` or `t` so cannot be mapped to service names by angular.
How can it know that `t` should be implemented by the `$httpProvider` or that `e` is the `$scope`?

<div class="demo" style="text-align:center; height:120px; width:80%;">
  <div class="github_link"><a href="/examples/angularjs_dependency_injection/minified_broken.html" target="_blank">http://alexrothenberg.github.com/examples/angularjs_dependency_injection/minified_broken.html</a></div>
  <iframe src="/examples/angularjs_dependency_injection/minified_broken.html" style="height:100%;width:100%">
  </iframe>
</div>

In fact if you open the [minified_broken.html](/examples/angularjs_dependency_injection/minified_broken.html) example and look at the console
you will see the error `Error: Unknown provider: eProvider <- e`.

Angular's `annotate` function is sophisticated enough to handle minification, in fact,
I only showed part of it before.
When we look at the whole thing, we see it can annotate a function _or_ an array of parameter name strings followed by a function.
In the array form, the first string names the first argument, the second string names the second, etc. and the actual names of the
parameters are unimportant.

{% highlight javascript %}
function annotate(fn) {
  var $inject,
      fnText,
      argDecl,
      last;

  if (typeof fn == 'function') {
    if (!($inject = fn.$inject)) {
      // omitting the code we saw before
    }
  } else if (isArray(fn)) {
    last = fn.length - 1;
    assertArgFn(fn[last], 'fn')
    $inject = fn.slice(0, last);
  } else {
    assertArgFn(fn, 'fn', true);
  }
  return $inject;
}
{% endhighlight %}

When we can now redefine our `MyController`

{% highlight javascript %}
var MyController = ['$scope', '$http', function($scope, $http) {
  $http.get('https://api.github.com/repos/angular/angular.js/commits')
    .success(function(commits) {
      $scope.commits = commits
    })
}]
{% endhighlight %}

When it is minified the strings are not touched so `annotate` will still work.

{% highlight javascript %}
var MyController= ["$scope", "$http", function(e,t) {
  t.get("https://api.github.com/repos/angular/angular.js/commits")
    .success(function(t) {
      e.commits=t
    })
}]
{% endhighlight %}

We can see the `annotate` function parsing this array
`angular.injector().annotate(MyController) == ["$scope", "$http"]`

<div class="demo" style="text-align:center; height:140px; width:80%;">
  <div class="github_link"><a href="/examples/angularjs_dependency_injection/minified_annotate.html" target="_blank">http://alexrothenberg.github.com/examples/angularjs_dependency_injection/minified_annotate.html</a></div>
  <iframe src="/examples/angularjs_dependency_injection/minified_annotate.html" style="height:100%;width:100%">
  </iframe>
</div>

Of course what really matters is that it works on the page - which it does.

<div class="demo" style="text-align:center; height:300px; width:80%;">
  <div class="github_link"><a href="/examples/angularjs_dependency_injection/minified_working.html" target="_blank">http://alexrothenberg.github.com/examples/angularjs_dependency_injection/minified_working.html</a></div>
  <iframe src="/examples/angularjs_dependency_injection/minified_working.html" style="height:100%;width:100%">
  </iframe>
</div>

If you've made it to the end of this long post, I hope you've enjoyed the journey into how AngularJS knows what services to inject in your controllers.
Again all you really need to know is to use an array naming the parameters followed by your function but I hope you enjoyed learning how it actually works.
I know I did!
