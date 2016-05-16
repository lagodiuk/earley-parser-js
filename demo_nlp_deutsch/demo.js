function init() {

var margin = {
        top: 40, 
        right: 40, 
        bottom: 40, 
        left: 40
    },
	width = $("#body").width() - margin.right - margin.left,
	height = window.innerHeight - margin.top - margin.bottom;
	
var i = 0;

var diagonal = d3.svg.diagonal()
	.projection(function(d) { return [d.x, d.y]; });

var svg = d3.select("#body").append("svg")
	.attr("width", width + margin.right)
	.attr("height", height + margin.top + margin.bottom)
    .call(zm = d3.behavior.zoom().scaleExtent([0.1,3]).on("zoom", redraw))
    .append("g")
	.attr("transform", "translate(" + 0 + "," + margin.top + ")");
    
//necessary so that zoom knows where to zoom and unzoom from
// http://jsfiddle.net/augburto/YMa2y/
zm.translate([0, margin.top]);

$('.example').click(function(){     
    $('#txt').val($(this).text());
    $('#txt').trigger('input');
    return false;
});

// Slider for horizontal scaling of the tree
// https://jqueryui.com/slider/#rangemin
$( "#slider-range-min" ).slider({
  range: "min",
  value: 0,
  min: 0,
  max: 90,
  slide: function( event, ui ) {
    var newVal = $(this).val();
    currentZoom = (100.0 - ui.value) / 100.0;
    svg.selectAll("*").remove();                            
    update(root);
  }
});

function transform(tree) {
    var node = {};
    if(tree["root"]) {
        node["name"] = tree["root"];
    }
    var children = [];
    for(var i in tree["subtrees"]) {
        var child = transform(tree["subtrees"][i]);
        if(child) {
            children.push(child);
        }
    }
    if(children.length > 0) {
        node["children"] = children;
    }
    return node;
}

$('#txt').bind('input', function() {
    var s = $(this).val();
    s = s.replace(/,/g, " , ");
    s = s.replace(/\s+/g, " ");

    var tokenStream = s.trim().split(' ');

    var rulesRaw = $('#grm').val().trim().split('\n')
    var rules = [];
    for(var i in rulesRaw) {
        var rule = rulesRaw[i].trim();
        rule = rule.replace(/\s+/g, " ");
        if(rule) {
        		rules.push(rule);
        }
    }

    var grammar = new tinynlp.Grammar(rules);

    var rootProduction = 'Root';
    var chart = tinynlp.parse(tokenStream, grammar, rootProduction);

    var state = chart.getFinishedRoot(rootProduction);
    if (state) {
        var trees = state.traverse();
        $('#dv').empty();
        $('#chart').empty();
        for (var t in trees) {
            var tree = trees[t];
            console.log(JSON.stringify(tree))
            var preparedToDisplayTree = transform(tree);
            // Do not display the Root production
            preparedToDisplayTree = preparedToDisplayTree["children"][0];
            console.log(JSON.stringify(preparedToDisplayTree))

            // ************** Generate the tree diagram	 *****************
            svg.selectAll("*").remove();                            
            root = preparedToDisplayTree;
            update(root);
            
            // Currently displaying only one tree
            break;
        }
    }
});

var nodeColors = {
    "Satz" : "#b3ffcc",
    "Konjunktion" : "#ffc6b3",
    "Hauptsatz" : "#b3c6ff",
    "Nebensatz" : "#ffb3ff",
    "Verb" : "#c2f0c2",
    "Subject" : "#d9ffb3",
    "Object" : "#ecffb3",
    "Preposition" : "#ccb3ff",
    "Prep" : "#d9b3ff",
    "Artikel" : "#b3ffd9",
    "Adj" : "#ffd9b3",
    "Nomen" : "#ffb3b3",
    "Pers" : "#c1f0c1",
    "default" : "yellow"
}

// Used for horizontal scaling of the tree
var currentZoom = 1;

// D3js code is taken from http://bl.ocks.org/d3noob/8326869
// http://www.d3noob.org/2014/01/tree-diagrams-in-d3js_11.html
function update(source) {

  // Used for horizontal scaling of the tree
  var zoom = (currentZoom && currentZoom < 1) ? currentZoom : 1;
  
  // Cluster layout https://bl.ocks.org/mbostock/4063570
  var tree = d3.layout.cluster().size([width / zoom, height]);

  var rectW = 40;
  var rectH = 40;

  // Compute the new tree layout.
  var nodes = tree.nodes(root),
	  links = tree.links(nodes);


  // Displaying the tree in a nice way
  var maxDepth = -1;
  // Find the max depth of the tree
  nodes.forEach(function(d) { 
    maxDepth = Math.max(maxDepth, d.depth);
  });  
  nodes.forEach(function(d) { 
    if(d._children || d.children) {
        // Non-leaf nodes located with respect to the depth
        d.y = d.depth * 100; 
    } else {
        // Put all leafs at the same depth
        d.y = maxDepth * 100; 
    }
  });

  // Declare the nodes…
  var node = svg.selectAll("g.node")
	  .data(nodes, function(d) { return d.id || (d.id = ++i); });

  // Enter the nodes.
  var nodeEnter = node.enter().append("g")
	  .attr("class", "node")
	  .attr("transform", function(d) { 
		  return "translate(" + (d.x - rectW / 2) + "," + d.y + ")"; 
      });

    nodeEnter.append("rect")
        .attr("width", rectW)
        .attr("height", rectH)
        .attr("rx", 10)
        .attr("ry", 10)
        .attr("stroke", "gray")
        .attr("stroke-width", 1)
        .style("fill", function (d) {
            var color = nodeColors[d.name.split("_")[0]];
            return (color) ? color : nodeColors["default"];
        });

  nodeEnter.append("text")
	  .attr("y", rectH / 2)
      .attr("x", rectW / 2)
	  .attr("dy", ".35em")
	  .attr("text-anchor", "middle")
	  .text(function(d) { return d.name; })
	  .style("fill-opacity", 1);
      
    // Wrapping text into rectangles  
    // http://stackoverflow.com/questions/30098532/d3-js-wrap-text-in-rect  
    nodeEnter.each(function() {
        var w = this.getBBox().width + 6,
            h = this.getBBox().height;
        
        d3.select(this)
          .select('rect')
          .attr({'width': w, 'height': h})
          .attr("transform", function(d) { 
                return "translate(" + (- (w - rectW) / 2) + "," + 0 + ")"; 
          });
          
        d3.select(this)
          .select('text')
          .attr("x", w / 2).attr("transform", function(d) { 
                return "translate(" + (- (w - rectW) / 2) + "," + 0 + ")"; 
          });
    });

  // Declare the links…
  var link = svg.selectAll("path.link")
	  .data(links, function(d) { return d.target.id; });

  // Enter the links.
  link.enter().insert("path", "g")
	  .attr("class", "link")
	  .attr("d", diagonal);
}

//Redraw for zoom
function redraw() {
  //console.log("here", d3.event.translate, d3.event.scale);
  svg.attr("transform",
      "translate(" + d3.event.translate + ")"
      + " scale(" + d3.event.scale + ")");
}

}
