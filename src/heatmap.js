d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

var mainDiv = d3.select("body").append("div").attr("id", "mainDiv");
var layer = 1
var columns = 15
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
		if(typeof error == null) { console.log(error); return; }
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
	// for(var i = serverstuff.length; i < 225; i++) {
		// serverstuff.push( {topo: { id:"none" }, server: { nickname:"none" } } );
	// }
	createTiles(serverstuff);
}

function createTiles(s) {
	function zoom(d, i) {
		if(layer == 1) {
			var thisRect;
			var setValue = function(callback) {
				d3.select("body").select("#mainDiv")
					.select("svg").select("g")
					.selectAll("rect")[0]
					.forEach( function(e, j) {
						if(i == j) {
							thisRect = e;
							callback(null, null);
						}
					})
				}
			function doAction() { 
				d.on("click", null)
					.transition().duration(1000)
					.attr("width", 600)
					.attr("height", 600)
					.attr("x", 0)
					.attr("y", 0)
					
				d3.select("body").select("#mainDiv").select("svg").select("g").selectAll("rect")
					.filter(function(x, j) { 
						return i != j;
					})
					.transition().duration(1000)
					.attr("width", 600)
					.attr("height", 600)
					.attr("x", function() {
						var dif = (this.x.baseVal.value - thisRect.x.baseVal.value)
						var svgWidth = d3.select("body").select("#mainDiv")
							.select("svg")[0][0].clientWidth
						var rectWidth = thisRect.width.baseVal.value;
						var mult = svgWidth / rectWidth;
						return dif * mult;
					})
					.attr("y", function() {
						var dif = (this.y.baseVal.value - thisRect.y.baseVal.value)
						var svgHeight = d3.select("body").select("#mainDiv")
							.select("svg")[0][0].clientHeight
						var rectHeight = thisRect.height.baseVal.value;
						var mult = svgHeight / rectHeight;
						return dif * mult;
					})
				d3.select("body").select("#mainDiv").select("svg")
					.append("g").attr("id", "back")
					.append("rect")
					.attr("x", d.attr("x"))
					.attr("y", d.attr("y"))
					.attr("width", 0)
					.attr("height", 0)
					.attr("opacity", 1)
					.style("fill", "white")
					.on("click", function() {
						
						$("#mainsvg").empty(); //THIS NEEDS TO CHANGE IT BACK TO LAYER 1
					})
					.classed("back", true)
					.transition().duration(1000)
					.attr("width", 50)
					.attr("height", 30)
					.attr("x", 20)
					.attr("y", 20)
				d3.select("#back").append("text")
					.text("back")
					.attr("x", d.attr("x"))
					.attr("y", d.attr("y"))
					.attr("width", 0)
					.attr("height", 0)
					.attr("font-size", 0)
					.transition().duration(1000)
					.attr("font-size", 12)
					.attr("x", 45)
					.attr("y", 40)
				d.moveToFront;
				layer = 2;
			}
			queue(1)
				.defer(setValue)
				.awaitAll(doAction)
		}
		if(layer == 2) {
			
		}
	};

	d3.select("body").select("#mainDiv")		
		.append("div")
		.attr("id", "bellsnwhistles")
	d3.select("body").select("#mainDiv")
		.append("div")
		.attr("id", "appcontainer")
		.append("svg")
		.attr("id", "mainsvg")
		.attr("width", 600)
		.attr("height", 600)
	d3.select("body").select("#mainDiv").select("svg")
	.append("g")
	.selectAll("rect")
	.data(s)
	.enter()
	.append("rect")
	.attr("x", function(d, i) {
		return 40 * (i % columns); //first number is width of rect, second is how many in a row
	})
	.attr("y", function(d, i) {
		return Math.floor(i / columns) * 40; //first number is how many in a row, second is width
	})
	.attr("width", 40)
	.attr("height", 40)
	.on("click", function(d, i) {
		zoom(d3.select(this), i)
		d3.select(this).attr("class", function() {
			var re = d3.select(this).attr("class");
			re = re.replace("hoverable", "");
			re = re.replace(" ", "");
			return re;
		})
		$(".threshold_slider").slider("option", "disabled", true);
	})
	.on("mouseover", function(d) {
		var t = d.server.nickname;
		d3.select("#dirtyNumbers").text(t)
	})
	.on("mouseout", function() {
		d3.select("#dirtyNumbers").text("")
	});
	
	var createSlider = function(callback) {
		d3.select("#bellsnwhistles")
		.append("div").classed("slider_title", true)
		.append("p").text("Threshold")
		d3.select("#bellsnwhistles")
		.append("div").classed("threshold_slider", true)
		$(function() {
			$(".threshold_slider").slider({
			  slide: function( event, ui ) { 
				adjustColors(ui.value);
				d3.select("#slider_value").text( function() {
					var value = $(".threshold_slider").slider("option", "value");
					if(value / 1000000 < 1) {
						return Math.floor(value / 1000) + " ms"
					}
					else {
						return Math.floor(value / 10000) / 100 + " s";
					}
				});
			  },
			  change: function( event, ui ) { 
				adjustColors(ui.value);
				d3.select("#slider_value").text( function() {
					var value = $(".threshold_slider").slider("option", "value");
					if(value / 1000000 < 1) {
						return Math.floor(value / 1000) + " ms"
					}
					else {
						return Math.floor(value / 10000) / 100 + " s";
					}
				});
			  },
			  // animate: "fast",
			  step: 10000,
			  min: 0,
			  max: 2000000,
			  value: 1000000
			});
			callback(null, $(".threshold_slider").slider("option", "value"));
		});
		d3.select("#bellsnwhistles")
			.append("div").attr("id", "slider_value")
			.append("p").text("1.00 s")
	}
	
	var adjustColors = function(callback) {
		d3.select("body").select("#mainDiv").select("svg")
			.select("g")
			.selectAll("rect")
			.attr("class", function(d) {
				if(d.topo.id != "none") {
					if(typeof d.topo.resp_avg != 'undefined') {
						var quantize = d3.scale.quantile()
							.domain([0, $(".threshold_slider")
							.slider("option", "value")])
							.range(d3.range(10));
						return "hoverable q" + (1 + quantize(d.topo.resp_avg))
					}
					else {
						return "hoverable"
					}
				}
				else {
					return "notdefined"
				}
			});
	}
	
	var addDirtyNumbers = function(callback) {
		d3.select("#bellsnwhistles").append("div").attr("id", "dirtyNumbers");
		callback();
	}
	queue()
		.defer(createSlider)
		.defer(adjustColors)
		.defer(addDirtyNumbers);
}