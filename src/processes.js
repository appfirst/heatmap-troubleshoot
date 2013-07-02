//Going to be a prototype for the process view

var mainDiv = d3.select("body").append("div").attr("id", "mainDiv");

var controls = mainDiv.append("div").attr("id", "controls")
var appcontainer = mainDiv.append("div").attr("id", "appcontainer")
var svgContainer = appcontainer.append("svg");

function parseData() {
	var q = queue();
	d3.json("http://localhost:9000/api/v3/servers/6324/processes/", function(error, data) {
		data.forEach( function(d) { 
			q.defer(makeObject, d, "http://localhost:9000/api/v3/processes/" + d.uid + "/data/")
		})
		q.awaitAll(function(err, d) { 
			var finish = new Date();
			var difference = new Date();
			difference.setTime(finish.getTime() - start.getTime());
			console.log( difference.getSeconds() + "." + difference.getMilliseconds() );
			showProcesses(d);
		})
	})
	
	function makeObject(d, url, callback) {
		d3.json(url, function(error, data) {
			callback( null, { init: d, data: data } );
		})
	}
}

var start = new Date();
parseData()
	
function filterProcesses() {
	var text = d3.select("#textBox")[0][0].value;
	d3.select("#procs").selectAll("*")
		.filter(function() {
			return d3.select(this)[0][0].__data__.init.name.indexOf(text) == -1;
		})
		.transition().duration(500).attr("opacity", 0);
	d3.select("#procs").selectAll("*")
		.filter(function() {
			return d3.select(this)[0][0].__data__.init.name.indexOf(text) != -1;
		})
		.transition().duration(500).attr("opacity", 1);
}
	
function showProcesses(d) {
	var procs = svgContainer.append("g").attr("id", "procs");
	controls.append("input").attr("id", "textBox").attr("type", "text").attr("oninput", "filterProcesses()");
	procs.selectAll("circle").data(d).enter()
		.append("circle")
		.attr("r", 0)
		.style("fill", function() {
			var r = Math.floor(Math.random() * 3);
			if(r == 0) {
				return "blue"
			} else if(r == 1) {
				return "red"
			} else {
				return "yellow"
			}
		})
		.attr("stroke", "black")
		.attr("stroke-width", 1)
		.transition().duration(1000)
		.ease("elastic")
		.attr("r", 20)
		.attr("cx", function(x, i) {
			return 50 * (i % 10) + 30;
		})
		.attr("cy", function(x, i) {
			return 50 * Math.floor(i / 10) + 30;
		})
}