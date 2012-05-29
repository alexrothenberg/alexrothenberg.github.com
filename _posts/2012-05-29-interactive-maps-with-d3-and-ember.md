---
layout: post
tags: emberjs,d3,geoJSON,javascript
title: Combining D3 and Ember to Build Interactive Maps
---

<img src="http://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Simple2008PresElections-USA-states.png/120px-Simple2008PresElections-USA-states.png" class="heading_image">

The Javascript world is exploding with new libraries that let us build really interactive applications.
The image on the left is a static image showing how each US State voted in the 2008 Presidential Election - I suspect we'll be seeing a lot more of this map in the coming months!

Let's look at how we can draw that map ourselves and make it interactive using:
* [SVG](https://developer.mozilla.org/en/SVG) - a vector graphics format. That will let us draw an good looking map using publicly available data about the geography of each state.
* [D3.js](http://d3js.org) - a JavaScript library for manipulating documents based on data. Its super fast and will help us interact with the SVG map.
* [Ember.js](http://emberjs.com) - a JavaScript framework for creating ambitious web applications that eliminates boilerplate and provides a standard application architecture.
  Its going to keep us disciplined and our code organized.

<script type="text/javascript">
  $(function() {
    $('.demo iframe').contents().find('.link_back').hide()
  })
</script>

# An outline map of the States in the USA

We'll get stated building an Ember app to draw a map of the USA with each state outlined.

First, we'll need to know what each State looks like. This information is available to download from [http://data.jquerygeo.com/usastates.json](http://data.jquerygeo.com/usastates.json).

{% highlight javascript %}
var MapApp.usaStatesGeoData = {
  "type":"FeatureCollection",
  "features":[
   {"type":"Feature",
    "properties":{"fips":8,"name":"Colorado","abbr":"CO"},
    "geometry":/*...one polygon defining a rectangular shape...*/},
   {"type":"Feature",
    "properties":{"fips":22,"name":"Louisiana","abbr":"LA"},
    "geometry":/*...many polygons defining a very complicated coastline */},

   // all the other States are here too ...
  ]
};
{% endhighlight %}

This is a [GeoJSON](http://www.geojson.org/) format which Thomas Newton points out in his post
[Positioning and Scaling maps in D3](http://blog.newtonlabs.io/post/21964404793/positioning-and-scaling-maps-in-d3) is a format that works really well with D3
since it is data that can be rendered into SVG by our code.
Each State's boundaries are defined in complete detail with polygons that a cartographer has drawn out for us.
This works for rectangular States like Colorodo or Wyoming and amazingly also works for those with lots of coastline like Louisiana or Alaska (although the polygons are much more complicated).

Now, to create an Ember app we need to create our application and we'll assign the GeoJSON data into a bindable property.

{% highlight javascript %}
window.MapApp = Ember.Application.create({
  ready: function() {
    this.set('usaStatesGeoData', usaStatesGeoData);
  }
});
{% endhighlight %}

Next we'll add some [handlebars](http://emberjs.com/#toc_describing-your-ui-with-handlebars) expressions to our html page telling it to display the map as an Ember View
(we'll create that in a minute).

{% highlight html %}{% raw %}
<script type='text/x-handlebars'>
  {{view MapApp.Map geoDataBinding="MapApp.usaStatesGeoData"}}
</script>
{% endraw %}{% endhighlight %}

Finally we write the view

{% highlight javascript %}
MapApp.Map = Ember.View.extend({
  didInsertElement: function() {
    var elementId = this.get('elementId');
    var regions = d3.select("#" + elementId).append("svg").append("g").attr("id", "regions");

    var features = this.get('geoData').features;
    var path = this.get('path');
    regions.selectAll("#regions path").data(features).enter().insert("path")
      .attr("d",      path)
      .attr('stroke', '#ccc'  )
      .attr('fill',   'white' );
  }

  path: function() {
    var mapW  = this.$().height();
    var mapH  = this.$().width();
    var mapXY = d3.geo.albersUsa().scale(1000).translate([mapH/2,mapW/2]);

    return d3.geo.path().projection(mapXY);
  }.property(),
});{% endhighlight %}

Whew that is a bit of code so let's dig in. This is where we use `d3` to create the svg that looks like a map of the USA.
`d3` (__D__ata-__D__riven __D__ocuments) works by binding data to your DOM then applying tranformations to that data.
In this case our data is the GeoJSON file and our tranformations turn it into an SVG map.
`didInsertElement` is called by Ember when the view is inserted into the page's DOM.

* The first two lines use `d3.select` to add the `<svg><g id="regions">` elements to the page on this view's portion of the page.
* The remaining use `d3.selectAll.data.enter` to loop through the features (each State) and add a `<path>` element.
* Looping through each feature (ie. State), we make use of the rest of the code and set the `d` attribute to the value of the `path` property. The `path` logic scales the map and uses the `albersUsa` projection which moves Alaska and Hawaii to the bottom left where we usually see them on maps.

Looking at code is fun but what does it look like?  Below is the page we just built and the you can see that it does, in fact, look like a map of the USA with each State outlined.

<div class="demo" style="text-align:center; height:450px; width:80%; margin: 0px auto;">
  <div class="github_link"><a href="/examples/ember-d3maps/map_outline.html" target="_blank">http://www.alexrothenberg.com/examples/ember-d3maps/map_outline.html</a></div>
  <iframe src="/examples/ember-d3maps/map_outline.html" style="height:100%;width:100%">
  </iframe>
</div>

# Coloring the States red or blue

A red/blue map isn't much use when all the States are white so let's color them in.

First we'll need some data with the election results so we know what color each State should be. There's a source from Google at
[http://code.google.com/p/general-election-2008-data/source/browse/trunk/json/votes/2008](http://code.google.com/p/general-election-2008-data/source/browse/trunk/json/votes/2008).
I found the format to be a little hard to work with so I processed it into a simpler json file with just the information we'll need. It looks like:

{% highlight javascript %}
[
  {"name": "Alabama",    "electoral": 9,  "winner": "McCain"},
  {"name": "Alaska",     "electoral": 3,  "winner": "McCain"},
  {"name": "Arizona",    "electoral": 10, "winner": "McCain"},
  {"name": "Arkansas",   "electoral": 6,  "winner": "McCain"},
  {"name": "California", "electoral": 55, "winner": "Obama"},

  // results for the rest of the States too...
]
{% endhighlight %}

To use it we'll save it in our Ember Application.

{% highlight javascript %}
window.MapApp = Ember.Application.create({
  ready: function() {
    this.set('usaStatesGeoData', usaStatesGeoData);

    var stateResults = usaPres2008Data.map(function(stateResult) {
      return MapApp.StateResult.create(stateResult);
    });
    this.set('usaPres2008Results',  MapApp.StateResults.create({content: stateResults}));
  }
});
{% endhighlight %}

We use the javascript `map` function to turn our json data into ember objects that we can put into an Ember `ArrayProxy` object.
For this example we don't really need these ember objects but in a real application we'd probably get some requirements that would make them useful.
For instance if we wanted the colors to update on election night as new results come in.

Since we are using the `StateResult` and `StateResults` objects, we need to define them next.

{% highlight javascript %}
MapApp.StateResult  = Ember.Object.extend({});

MapApp.StateResults = Ember.ArrayProxy.extend({
  names: (function() {
    return this.mapProperty('name');
  }).property('content'),

  findByName: function(name) {
    var content = this.get('content');
    var index = this.get('names').indexOf(name);
    return content[index];
  }
});
{% endhighlight %}

Both objects are pretty simple. In fact they would both be empty except for the `findByName` accessor we define on `StateResults`.
We'll see the need for that in a minute when we look at how the view decides whether to color a State red or blue.

This takes us to the view which enhances what we had before:

{% highlight javascript %}
MapApp.Map = Ember.View.extend({
  // the path property is unchanged

  didInsertElement: function() {
    // same code as before ...

    regions.selectAll("#regions path").data(features).enter().insert("path")
      .attr("d",      path)
      .attr('stroke', '#ccc')
      .attr('fill',   this.updateFillFor ); // This line changed
  },

  // A new function
  updateFillFor: function(d) {
    var stateResult = MapApp.usaPres2008Results.findByName(d.properties.name);
    switch (stateResult.get('winner')) {
      case 'Obama':
        return 'blue';
      case 'McCain':
        return 'red';
    }
  }
});
{% endhighlight %}

Most of the view is the same, all that's different is the way we set the fill on each State ("feature" in d3 terms).

* `.attr('fill', this.updateFillFor);` - Instead of setting the "fill" attribute to 'white' for all States we now provide a function to make the decision differently for each State. D3 will call the function with the current State as an argument (it actually passes the D3 "datum" object).
* `updateFillFor` - This function uses the `findByName` function we defined in `StateResults` to match the "geographical" State with the "election result" State.  They are separate because each came from a different external json source. Once we have the stateResult object we look at the winner and know to return either "red" or "blue".

We can see it all working together right here and yes it does look like all the other red/blue election maps you've seen.

<div class="demo" style="text-align:center; height:450px; width:80%; margin: 0px auto;">
  <div class="github_link"><a href="/examples/ember-d3maps/map_red_blue.html" target="_blank">http://www.alexrothenberg.com/examples/ember-d3maps/map_red_blue.html</a></div>
  <iframe src="/examples/ember-d3maps/map_red_blue.html" style="height:100%;width:100%">
  </iframe>
</div>

This is just the beginning of what you can do by combining D3.js with Ember.js. Next I plan to write about how you could add behavior like clicking to select a State and let Ember show details about that State.