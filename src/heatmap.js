var mainDiv = d3.select("body").append("div").attr("id", "mainDiv");

var columns = 20
var rows = 10
var buckets = 11

var getFile = function(url, callback) {
	$.ajax({
		url: url,
		dataType: "json",
		crossDomain: true,
		jsonp: "callback",
		async: false,
		success: function(data) {
			callback(null, data)
		},
		error: function(e, errorType) {
			callback(errorType, null)
		}
	});
}

queue()
	.defer(d3.json, "/topology.json")
	.defer(d3.json, "/servers.json")
	// .defer(getFile, "http://localhost:9000/api/v3/topology/")
	// .defer(getFile, "http://localhost:9000/api/v3/servers/")
	
	.awaitAll(function(error, data) {
		// console.log(data)
		createHeatMap(data[0], data[1])
	})
	
function createHeatMap(topology, servers) {
	serverstuff = []
	topology.Node.forEach(function(toposerver) {
		if(toposerver.id == "External") {
				serverstuff.push( {topo:toposerver, server:{ nickname:"External" } } )
		}
		else {
			servers.forEach(function(server) {
				if(toposerver.id == server.nickname) {
					serverstuff.push( {topo:toposerver, server:server} );
				}
			})
		}
	})
	for(var i = serverstuff.length; i < 200; i++) {
		serverstuff.push( {topo: { id:"none" }, server: { nickname:"none" } } );
	}
	createTiles(serverstuff);
	setColorTiles();
}

function createTiles(s) {

	var zoom = function(d, callback) {
		d.on("click", null)
			.transition().duration(1000)
			.attr("width", 800)
			.attr("height", 600)
			.attr("x", 0)
			.attr("y", 0)
			.each("end", callback)
		d3.select("body").select("#mainDiv").select("svg")
			.append("rect")
			.attr("x", d.attr("x"))
			.attr("y", d.attr("y"))
			.attr("width", 0)
			.attr("height", 0)
			.attr("opacity", 1)
			.style("fill", "white")
			.on("click", function() {
				d3.select("svg").select("g").remove();
			})
			.classed("back", true)
			.transition().duration(1000)
			.attr("width", 50)
			.attr("height", 30)
			.attr("x", 20)
			.attr("y", 20)			
	};

	d3.select("body").select("#mainDiv")		
		.append("div")
		.attr("id", "bellsnwhistles")
	d3.select("body").select("#mainDiv")
		.append("div")
		.attr("id", "appcontainer")
		.append("svg")
		.attr("width", 800)
		.attr("height", 600)
		
	d3.select("#bellsnwhistles").append("div").classed("threshold_slider", true)
	.append("p").text("title")
	$(function() {
		$(".threshold_slider").slider();
	});
	d3.select("body").select("#mainDiv").select("svg")
	.append("g")
	.selectAll("rect")
	.data(s)
	.enter()
	.append("rect")
	.attr("class", function(d) {
		if(d.topo.id != "none") {
			if(typeof d.topo.resp_avg != 'undefined') {
				var quantize = d3.scale.quantile().domain([0, 999999]).range(d3.range(10));
				return "hoverable q" + (1 + quantize(d.topo.resp_avg))
			}
			else {
				return "hoverable"
			}
		}
		else {
			return "notdefined"
		}
	})
	.attr("x", function(d, i) {
		return 40 * (i % 15);
	})
	.attr("y", function(d, i) {
		return Math.floor(i / 15) * 40;
	})
	.attr("width", 40)
	.attr("height", 40)
	.on("click", function(d) {
		d3.selectAll("rect")
			.filter(function(x) { 
				return x.server.nickname != d.server.nickname;
			})
			.attr("opacity", 0);
		queue(1)
			.defer(zoom, d3.select(this))
	});
}

function setColorTiles() {
	
}