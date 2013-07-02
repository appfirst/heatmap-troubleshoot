d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};



function filterServers() {
	var options = d3.select(".combobox").select("form").select("select").selectAll("option")[0]
	var rects = d3.select("#tiles").selectAll("*");
	if(combobox.selection.selectedIndex != 0) {
		if(options[combobox.selection.selectedIndex] == options[1]) { //avg_resp_time
			var sorted = rects.sort(respSort);
		}
		else if(options[combobox.selection.selectedIndex] == options[2]) { //name
			var sorted = rects.sort(nameSort);
		}
		sorted[0].forEach(function(e, i) {
			d3.select(e).transition().duration(1000).attr("x", 40 * (i % columns) )
				.attr("y", Math.floor(i / columns) * 40 )
		});
	}
	
	
	function nameSort(a, b) {
		if(a.topo.id.toLowerCase() < b.topo.id.toLowerCase()) {
			return -1;
		}
		else if(a.topo.id.toLowerCase() == b.topo.id.toLowerCase()) {
			return 0;
		}
		else {
			return 1;
		}
	}
	
	function respSort(a, b) {
		if(isNaN(Number(a.topo.resp_avg)) && isNaN(Number(b.topo.resp_avg))) {
			return 0;
		}
		else if(isNaN(Number(a.topo.resp_avg))) {
			return 1;
		}
		else if(isNaN(Number(b.topo.resp_avg))) {
			return -1;
		}
		else {
			if(Number(a.topo.resp_avg) < Number(b.topo.resp_avg)) {
				return -1;
			}
			else if(Number(a.topo.resp_avg) == Number(b.topo.resp_avg)) {
				return 0;
			}
			else {
				return 1;
			}
		}
	}
}

var mainDiv = d3.select("body").append("div").attr("id", "mainDiv");
var columns = 15
var rows = 10
var buckets = 11

var getFile = function(url, callback) {
	$.ajax({
		url: url,
		dataType: "json",
		crossDomain: true,
		jsonp: "callback",
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
	createTiles(serverstuff);
}

function createTiles(s) {
	var oldx, oldy, thisRect;
	function zoomIn(d, i) {
		var setValue = function(callback) {
			d3.select("body").select("#mainDiv")
				.select("svg").select("g")
				.selectAll("rect")[0]
				.forEach( function(e, j) {
					if(e.__data__ == d[0][0].__data__) {
						thisRect = e;
						oldx = thisRect.x.baseVal.value;
						oldy = thisRect.y.baseVal.value;
						callback();
					}
				})
			}
		var doAction = function(callback) {
			d.on("click", null)
				.transition().duration(1000)
				.attr("width", 600)
				.attr("height", 600)
				.attr("x", 0)
				.attr("y", 0)
				
			d3.select("body").select("#mainDiv").select("svg").select("g").selectAll("rect")
				.filter(function(x, j) {
					return x.__data__ != d[0][0].__data__;
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
				.append("g").attr("class", "backbutton")
				.append("rect")
				.attr("x", d.attr("x"))
				.attr("y", d.attr("y"))
				.attr("width", 0)
				.attr("height", 0)
				.attr("opacity", 1)
				.style("fill", "white")
				.classed("back", true)
				.transition().duration(1000)
				.attr("width", 50)
				.attr("height", 30)
				.attr("x", 20)
				.attr("y", 20)
				.each("end", function(d) {
					d3.select(".backbutton")
						.on("mousedown", function() {
							zoomOut();
						});
				});
				
			d3.select(".backbutton").append("text")
				.text("Back")
				.attr("x", d.attr("x"))
				.attr("y", d.attr("y"))
				.attr("width", 0)
				.attr("height", 0)
				.attr("font-size", 0)
				.transition().duration(1000)
				.attr("font-size", 12)
				.attr("x", 32)
				.attr("y", 40)
				
			d.moveToFront;
		}
		queue()
			.defer(setValue)
			.awaitAll(doAction)
		
	};
	
	function zoomOut() {
	
		d3.select("#tiles").selectAll("*")
		.on("mouseover", function(d) {
			var t = d.server.nickname + "\n" + d.topo.resp_avg;
			d3.select("#dirtyNumbers").text(t)
		})
		.on("mouseout", function() {
			d3.select("#dirtyNumbers").text("")
		})
		.on("click", function(d, i) {
			d3.selectAll(".hoverable").on("mouseout", null)
				.on("mouseover", null).on("click", null);
			d3.select(".combobox").select("form").select("select").attr("disabled", true);
			zoomIn(d3.select(this), i);
			d3.select(this).attr("class", function() {
				var re = d3.select(this).attr("class");
				re = re.replace("hoverable", "");
				re = re.replace(" ", "");
				return re;
			})
			$(".threshold_slider").slider("option", "disabled", true);
		})
		d3.select(".combobox").select("form").select("select").attr("disabled", null);
		d3.select("#tiles").selectAll("*").attr("class", function() {
			var re = d3.select(this).attr("class");
			if(re.indexOf("hoverable") == -1) {
				re = "hoverable " + re;
			}
			return re;
		})
		$(".threshold_slider").slider("option", "disabled", false);
		d3.select(".backbutton").remove()
		d3.select(thisRect)
			.transition().duration(1000)
			.attr("width", 40)
			.attr("height", 40)
			.attr("x", oldx)
			.attr("y", oldy);
		d3.select("#tiles").selectAll("*")
			.filter(function(x, j) {
				return x != thisRect;
			})
			.transition().duration(1000)
			.attr("x", function() {
				var dif = (this.x.baseVal.value / columns)
				return dif + oldx;
			})
			.attr("y", function() {
				var dif = (this.y.baseVal.value / columns)
				return dif + oldy;
			})
			.attr("width", 40)
			.attr("height", 40)
	}

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
		.append("g").attr("id", "tiles")
		.selectAll("rect")
		.data(s)
		.enter()
		.append("rect")
		.attr("x", function(d, i) {
			return 40 * (i % columns);
		})
		.attr("y", function(d, i) {
			return Math.floor(i / columns) * 40;
		})
		.attr("width", 40)
		.attr("height", 40)
		.on("click", function(d, i) {
			d3.selectAll(".hoverable").on("mouseout", null)
				.on("mouseover", null).on("click", null);
			d3.select(".combobox").select("form").select("select").attr("disabled", true);
			zoomIn(d3.select(this), i)
			d3.select(this).attr("class", function() {
				var re = d3.select(this).attr("class");
				re = re.replace("hoverable", "");
				re = re.replace(" ", "");
				return re;
			})
			$(".threshold_slider").slider("option", "disabled", true);
		})
		.on("mouseover", function(d) {
			var t = d.server.nickname + "\n" + d.topo.resp_avg;
			d3.select("#dirtyNumbers").text(t)
		})
		.on("mouseout", function() {
			d3.select("#dirtyNumbers").text("")
		});
	
	var createSlider = function(callback) {
		d3.select("#bellsnwhistles")
			.append("div").attr("id", "threshold_slider")
			.append("div").classed("slider_title", true)
			.append("p").text("Threshold")
		d3.select("#threshold_slider")
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
			  step: 10000,
			  min: 0,
			  max: 2000000,
			  value: 1000000
			});
			callback(null, $(".threshold_slider").slider("option", "value"));
		});
		d3.select("#threshold_slider")
			.append("div").attr("id", "slider_value")
			.text("1.00 s")
	}
	
	function createComboBox() {
	
		var options = [ "", "avg_resp_time", "name" ];
		var combobox = d3.select("#bellsnwhistles").append("div").classed("combobox", true)
			combobox.append("div").classed("combolabel", true).text("Sort: ")
			combobox.append("form").attr("name", "combobox")
			.append("select").attr("name", "selection").attr("size", 1).attr("onChange", "filterServers()")
			options.forEach( function(e) {
				d3.select(".combobox").select("form").select("select")
					.append("option").attr("value", e).text(e);
			});
	}
	
	var adjustColors = function(number, callback) {
		d3.select("body").select("#mainDiv").select("svg")
			.select("g")
			.selectAll("rect")
			.attr("class", function(d) {
				if(d.topo.id != "none") {
					if(typeof d.topo.resp_avg != 'undefined') {
						var quantize = d3.scale.quantile()
							.domain([0, number])
							.range(d3.range(10));
						return "hoverable h" + (1 + quantize(d.topo.resp_avg))
					}
					else {
						return "hoverable"
					}
				}
				else {
					return "notdefined"
				}
			});
		if(typeof callback != "undefined") {
			callback();
		}
	}
	
	var addDirtyNumbers = function(callback) {
		d3.select("#bellsnwhistles").append("div").attr("id", "dirtyNumbers");
		callback();
	}
	
	queue()
		.defer(createSlider)
		.defer(createComboBox)
		.defer(adjustColors, $(".threshold_slider").slider("option", "value"))
		.defer(addDirtyNumbers);
}