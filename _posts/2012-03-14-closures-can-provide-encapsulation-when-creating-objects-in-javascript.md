---
layout: post
tags: javascript, closures
title: Closures can provide encapsulation when Creating Objects in Javascript
---

Objects are funny things in Javascript. If you're coming from a language like Ruby with classical inheritance you'll probably be surprised that in Javascript's [prototype system](http://en.wikipedia.org/wiki/Prototype-based_programming) there are no such things as classes.  The patterns are different but we can still achieve what's important about object oriented software namely `objects that encapsulate data and behavior`.
Today I'm going to show you two different ways we can create a simple database object that supports the basic CRUD operations in Javascript.

# Object Literal

The simplest way to create our database is to just declare it as a singleton object with some instance data and functions.
We'll use the "starts with underscore" naming convention to denote "private" data but that is just a convention and not enforced.

{% highlight javascript %}
var Database = {
  _data: {},

  create: function(object) {
    return this._data[object.id] = object
  },
  read: function(id) {
    return this._data[id]
  },
  update: function(object) {
    return this._data[object.id] = object
  },
  delete: function(id) {
    return this._data[id] = null
  }
}
{% endhighlight %}

This is pretty simple and if you try it out you'll see it actually works.

<div class="github_link">Try it at <a href="http://jsfiddle.net/alexrothenberg/Tn8uq/" target="_blank">http://jsfiddle.net/alexrothenberg/Tn8uq/</a></div>
{% highlight javascript %}
// We can CREATE
Database.create({id: 7, name: 'Alex'});
Database.create({id: 9, name: 'Pat'});

// We can READ
console.log('7: ' + Database.read(7).name);
  // 7: Alex
console.log('9: ' + Database.read(9).name);
  // 9: Pat

// We can UPDATE
Database.update({id: 7, name: 'Alexander'})
console.log('7: ' + Database.read(7).name);
  // 7: Alexander

// We can DELETE
Database.delete(7)
console.log('7: ' + Database.read(7));
  // 7: null
{% endhighlight %}

The biggest downside of this approach is that there is no encapsulation.  We can get at the `_data` instance variable directly to read or change it.

{% highlight javascript %}
Database._data[7] = {name: 'I changed your name'}
console.log('7: ' + Database.read(7).name);
{% endhighlight %}



# Encapsulation via a Closure

By wrapping our `Database` in a closure we can encapsulate our private functions and data.  The way to read this is that

* Database is a function that defines a closure.
* The variables  within that closure have access to each other (i.e. `_create` has access to `_data`).
* When the `Database` is called it returns an object that explicitly exposes 4 functions and nothing else.

{% highlight javascript %}
var Database = (function() {
  _data = {}

  _create = function(object) {
    return _data[object.id] = object
  }
  _read =  function(id) {
    return _data[id]
  }
  _update = function(object) {
    return _data[object.id] = object
  }
  _delete = function(id) {
    return _data[id] = null
  }

  return {
    create: _create,
    read:   _read,
    update: _update,
    delete: _delete
  }
}).call(this)
{% endhighlight %}

When we test it we see that it still works.

<div class="github_link">Try it at <a href="http://jsfiddle.net/alexrothenberg/kcGLK/" target="_blank">http://jsfiddle.net/alexrothenberg/kcGLK/</a></div>
{% highlight javascript %}
// We can CREATE
Database.create({id: 7, name: 'Alex'});
Database.create({id: 9, name: 'Pat'});

// We can READ
console.log('7: ' + Database.read(7).name);
  // 7: Alex
console.log('9: ' + Database.read(9).name);
  // 9: Pat

// We can UPDATE
Database.update({id: 7, name: 'Alexander'})
console.log('7: ' + Database.read(7).name);
  // 7: Alexander

// We can DELETE
Database.delete(7)
console.log('7: ' + Database.read(7));
  // 7: null
{% endhighlight %}

The `_data` is encapsulated and not accessible from the outside
{% highlight javascript %}
console.log(Database._data)
  // undefined
{% endhighlight %}


There are other patterns for working with objects in Javascript that take advantage of Javascript's prototype system but I don't have time to go into that today ... perhaps in a future post.
