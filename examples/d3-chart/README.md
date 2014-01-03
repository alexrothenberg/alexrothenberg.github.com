D3 2.10 adds support for optional outer padding with [d3.scale.ordinal](https://github.com/mbostock/d3/wiki/Ordinal-Scales#wiki-ordinal). This parameter allows you to control the outer padding (before the first bar and after the last bar) separately from the inner padding between bars. In this case, the inner padding is 10% and the outer padding is 20%.

```javascript
var x = d3.scale.ordinal()
    .rangeRoundBands([0, width], .1, .2);
```

See also this [updated version with an axis title](/mbostock/3885304).
