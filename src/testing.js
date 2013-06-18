d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

var nodesandlines = [];
var targetsandlines = [];

var w = 960;
var h = 500;
		
var width = 960,
height = 500;

var color = d3.scale.category20();

var svg = d3.select("body").append("svg")
.attr("width", width)
.attr("height", height);
			
			
d3.json("topology.json", function(error, graph) {


	function buildjson() {
		newEdges = [];
		var nodeArray = graph.Node.map(function(o){return o.id});
		var fromIndexArray = graph.Edge.map(function(o){return o.fromID;});
		var toIndexArray = graph.Edge.map(function(o){return o.toID;});
		graph.Edge.forEach(function(element) {
			var from = nodeArray.indexOf(element.fromID);
			var to = nodeArray.indexOf(element.toID);
			newEdges.push( {source:from,target:to,weight:1} );
		})
		console.log(graph.Edge)
		return newEdges;
	}

	var newEdges = buildjson();
	// console.log(newEdges);

	  
	var nodes = graph.Node
	var links = newEdges

	var node = svg.selectAll("source")
    	.data(graph.Node)
		.enter().append("circle")
		.attr("cx", function(d,i) {
			return 50 + i * 50
		})
		.attr("cy", function(d,i) {
			return 400
		})
		.attr("r", 5)
		.attr("zz", function(d, i) {
			var emptylines = []
			nodesandlines.push( 
				{node:d3.select(this), lines:emptylines}
			)
		})
		.style("fill", "red" )
		.on("mouseenter", function(d, i) {
			var circle = d3.select(this)
			d3.select(this).transition()
			.duration(200)
			.style("fill", "blue");
			nodesandlines[i].lines.forEach(function(e) {
				e.transition()
				.duration(200)
				.attr("stroke", "blue")
				.attr("stroke-width", 1)
			});
		})
		.on("mouseleave", function(d, i) {
			var circle = d3.select(this)
			d3.select(this).transition()
			.duration(200)
			.style("fill", "red")
			
			nodesandlines[i].lines.forEach(function(e) {
				e.transition()
				.duration(200)
				.attr("stroke", "gray")
				.attr("stroke-width", .5)
			});
		});
	
	var nodetarget = svg.selectAll("target")
    	.data(graph.Node)
		.enter().append("circle")
		.attr("cx", function(d,i) {
			return 50 + i * 50
		})
		.attr("cy", function(d,i) {
			return 200
		})
		.attr("r", 5)
		.attr("zz", function() {
			var emptylines = []
			targetsandlines.push( 
				{node:d3.select(this), lines:emptylines}
			)
		})
		.style("fill", "red")
		.on("mouseenter", function(d, i) {
			var circle = d3.select(this)
			d3.select(this).transition()
			.duration(200)
			.style("fill", "blue");
			targetsandlines[i].lines.forEach(function(e) {
				e.transition()
				.duration(200)
				.attr("stroke", "blue")
				.attr("stroke-width", 1)
			});
		})
		.on("mouseleave", function(d, i) {
			var circle = d3.select(this)
			d3.select(this).transition()
			.duration(200)
			.style("fill", "red")
			
			targetsandlines[i].lines.forEach(function(e) {
				e.transition()
				.duration(200)
				.attr("stroke", "gray")
				.attr("stroke-width", .5)
			});
		});
		
	console.log(nodesandlines);
	console.log(targetsandlines);
	
	function drawLine(d) {
		var lineData = [ { "x":node[0][[d.source]].attributes[0].value, "y":node[0][d.source].attributes[1].value },
				{ "x":50 + node[0].length/2 * 50, "y":300 },
				{ "x":nodetarget[0][d.target].attributes[0].value, "y":nodetarget[0][d.target].attributes[1].value } ]
		
		var lineFunction = 
			d3.svg.line()
			.x(function(d) { return d.x; })
			.y(function(d) { return d.y; })
			.interpolate("cardinal");
			
		var lineGraph = svg.append("path")
								.attr("d", lineFunction(lineData))
								.attr("stroke", "gray")
								.attr("stroke-width", .5)
								.attr("fill", "none");
								
		nodesandlines[d.source].lines.push(lineGraph);
		targetsandlines[d.target].lines.push(lineGraph);
	
	}
	var link = svg.selectAll("path")
	    .data(newEdges)
	    .enter().append("path")
		.attr("d", function(d) { drawLine(d) });
	
	node.moveToFront();
	nodetarget.moveToFront();
	node.append("title")
	  .text(function(d) { return d.name; });
});