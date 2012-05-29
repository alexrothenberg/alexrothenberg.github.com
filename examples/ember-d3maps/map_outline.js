window.MapApp = Ember.Application.create({
  ready: function() {
    this.set('usaStatesGeoData', usaStatesGeoData);
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
      .attr('fill',   'white' );
  }
});