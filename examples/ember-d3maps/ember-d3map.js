// # Ember-D3Maps
(function() {
  window.D3Maps = Ember.Namespace.create();

  D3Maps.Map = Ember.View.extend({
    selectedBinding: 'features.selected',
    
    defaultFill: 'white',
    selectedFill: 'rgb(220,220,0)',
    chloropleth: false,
    
    didInsertElement: function() {
      var view = this;
      var elementId = this.get('elementId');
      var regions = d3.select("#" + elementId).append("svg").append("g").attr("id", "regions");

      var mapW      = this.$().height()
      var mapH      = this.$().width()
      var mapXY  = d3.geo.albers().scale(1000).translate([mapH/2,mapW/2])
      var path   = d3.geo.path().projection(mapXY)
      
      var features = this.get('features').toArray();
      regions.selectAll("#regions path").data(features).enter().insert("path")
        .attr("d", path)
        .each(function(d) { d.properties.clicks = 0 })
        .attr('stroke', '#ccc'  )
        .attr('fill',   this.get('defaultFill') )
        .attr('id',     function(d) { return d.properties.name } ) 
        .on("click",    function(d) { 
          view.click(d)
          d3.event.cancelBubble = true;
        });
    },
    
    click: function(d) {
      d.properties.clicks += 1;
      this.set('selected', d.properties.name);
      return false;
    },
    
    updateAllFill: function() {
      var view = this;
      d3.selectAll('#regions path').attr('fill', function(d) { return view.fillFor(d) });
      d3.select('#regions path[id="' + this.get('selected') + '"]').attr('fill', this.get('selectedFill'))      
    }.observes('selected', 'defaultFill', 'selectedFill', 'chloropleth'),

    fillFor: function(d) {
      if (this.get('chloropleth')) {
        color = 255 - (d.properties.clicks * 10)
        return 'rgb(' + color + ', ' + color + ', ' + color + ')'
      } else {
        return this.get('defaultFill');
      }
    }
  });
  
}).call(this);