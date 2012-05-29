window.MapApp = Ember.Application.create({
  ready: function() {
    this.set('usaStatesGeoData', usaStatesGeoData);
    
    var stateResults = usaPres2008Data.map(function(stateResult) {
      return MapApp.StateResult.create(stateResult);
    })
    this.set('usaPres2008Results',  MapApp.StateResults.create({content: stateResults}));
  }
});

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



MapApp.Map = Ember.View.extend({
  path: function() {
    var mapW  = this.$().height();
    var mapH  = this.$().width();
    var mapXY = d3.geo.albersUsa().scale(700).translate([mapH/2,mapW/2]);

    return d3.geo.path().projection(mapXY);
  }.property(),
  
  didInsertElement: function() {
    var elementId = this.get('elementId');
    var regions = d3.select("#" + elementId).append("svg").append("g").attr("id", "regions");
    var features = this.get('geoData').features;
    var path = this.get('path');

    regions.selectAll("#regions path").data(features).enter().insert("path")
      .attr("d",      path)
      .attr('stroke', '#ccc'  )
      .attr('fill',   this.updateFillFor );
  },
  
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

