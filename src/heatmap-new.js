d3.selection.prototype.moveToFront = function() {
	return this.each(function(){
		this.parentNode.appendChild(this);
	});
};



function filterServers() {
	var options = d3.select(".combobox").select("form").select("select").selectAll("option")[0]
	var rects = d3.select("#tiles").selectAll("*");
	if(options[combobox.selection.selectedIndex] == options[0]) { //name
		var sorted = rects.sort(nameSort);
	}
	else if(options[combobox.selection.selectedIndex] == options[1]) { //cpu
		var sorted = rects.sort(cpuSort);
	}
	
	sorted[0].forEach(function(e, i) {
		d3.select(e).transition().duration(1000)
			.attr("x", 40 * (i % columns) )
			.attr("y", Math.floor(i / columns) * 40 )
	});
	
	
	function nameSort(a, b) {
		if(a.toLowerCase() < b.toLowerCase()) {
			return -1;
		}
		else if(a.toLowerCase() == b.toLowerCase()) {
			return 0;
		}
		else {
			return 1;
		}
	}
	
	function cpuSort(a, b) {
		if(Number(servers[a].cpu) < Number(servers[b].cpu)) {
			return -1;
		}
		else if(Number(servers[a].cpu) == Number(servers[b].cpu)) {
			return 0;
		}
		else {
			return 1;
		}
	}
}

var mainDiv = d3.select("body").append("div").attr("id", "mainDiv");
var columns = 15;
var rows = 10;
var buckets = 11;
var layer = 1;
var servers = {};
var collectorIDs = {};

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
	.defer(getFile, "http://localhost:9000/api/v1/metrics/?name=sys.server.\*.\*")
	.awaitAll(function(error, data) {
		if(typeof error == null) { console.log(error); return; }
		createHeatMap(data)
	})
	
			
function loadedMore(l) {
	if(l == 100) {
		
		d3.select("#loading").transition().duration(1000)
			.ease("linear")
			.attr("width", 140)
			.each("end", function() {
				d3.select("#loading").transition().duration(5000).attr("opacity", 0);
				d3.select("#loading-bar").transition().duration(5000).attr("opacity", 0);
			})
	}
	else {
		d3.select("#loading").transition().duration(1000)
			.ease("linear")
			.attr("width", 140 * (l/100));
	}
}

function mover(d) {
	var details = d3.select("#details");
	details.append("div").text("Name: " + d)
	details.append("div").text("CPU Usage: " + servers[d].cpu + "%");
	// details.append
}
function mout() {
	d3.select("#details").selectAll("*").remove();
}

function zoomIn(d, i) {
	layer = 2;
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
	//{ loading bar stuff
	// var loadingbar = d3.select("#mainsvg").append("rect")
		// .attr("id", "loading-bar")
		// .attr("x", 225)
		// .attr("y", 225)
		// .attr("width", 150)
		// .attr("height", 25)
		// .style("fill", "white")
		// .style("stroke-width", "5px")
		// .style("stroke", "black");
	// var bar = d3.select("#mainsvg").append("rect")
		// .attr("id", "loading")
		// .attr("x", 230)
		// .attr("y", 230)
		// .attr("width", 0)
		// .attr("height", 15)
		// .style("fill", "red")		
	//}
	
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
			.attr("y", 20);
			
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

function click(i, d) {
	d3.selectAll(".hoverable").on("mouseout", null)
		.on("mouseover", null).on("click", null);
	d3.select(".combobox").select("form").select("select").attr("disabled", true);
	zoomIn(d3.select(d), i);
	// loadedMore(50);
	processes(collectorIDs[d3.select(d)[0][0].__data__]);
	d3.select(d).attr("class", function() {
		var re = d3.select(d).attr("class");
		re = re.replace("hoverable", "");
		re = re.replace(" ", "");
		return re;
	})
	$(".threshold_slider").slider("option", "disabled", true);
}

function zoomOut() {

	layer = 1;
	d3.select("#procs").remove();
	d3.select("#bellsnwhistles").select("input").remove();
	mout();
	
	d3.select("#tiles").selectAll("*")
	.on("mouseover", function(d) {
		mover(d);
	})
	.on("mouseout", function() {
		mout();
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
		.each("end", function(d) {
			d3.select("#tiles").selectAll("*")
				.on("click", function(d, i) {
					click(i, this);
				})
		});
}
	
function createHeatMap(data) {

	function parseServerData() {
	
		// console.log(Object.keys(data[0]["data"]));
		eval(data[0]["collectors"]).forEach( function(d) {
			collectorIDs[d[0]] = d[1];
		});
		var collectors = {};
		for(var c in data[0]["request"]["collectors"]) {
			collectors[data[0]["request"]["collectors"][c]] = {};
		}
		
		Object.keys(data[0]["data"]).forEach( function(d) {
			var s = d.replace("sys.server.", "");
			var temp = s;
			// console.log(d);
			var server = "";
			
			while(temp !== "" && temp.indexOf(".") != -1 && Object.keys(collectors).indexOf(server) == -1) {
				if(server !== "") {
					server = server + ".";
				}
				var i = temp.indexOf(".") + 1;
				var t = temp.substring(0, i);
				server = server + t;
				server = server.substring(0, server.length - 1)
				temp = temp.replace(t, "");
			}
			// console.log(data[0]["data"][Object.keys(data[0]["data"])[i]][0]["value"]);
			// console.log(temp);
			// console.log(data[0]["data"][d][0]["value"]);
			collectors[server][temp] = data[0]["data"][d][0]["value"];
		})
		return collectors;
	}
	
	servers = parseServerData();

	// serverstuff = []
	// topology.Node.forEach(function(toposerver) {
		// if(toposerver.id == "External") {
				// serverstuff.push( {topo:toposerver, server:{ nickname:"External" } } )
		// }
		// else {
			// servers.forEach(function(server) {
				// if(toposerver.id == server.nickname) {
					// serverstuff.push( {topo:toposerver, server:server} );
				// }
			// })
		// }
	// })
	createTiles();
}

function createTiles() {
	var keys = Object.keys(servers);
	var oldx, oldy, thisRect;

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
		.data(keys)
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
			click(i, this)
		})
		.on("mouseover", function(d) {
			mover(d);
		})
		.on("mouseout", function() {
			mout();
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
					return value / 10 + "%";
				});
			  },
			  change: function( event, ui ) { 
				adjustColors(ui.value);
				d3.select("#slider_value").text( function() {
					var value = $(".threshold_slider").slider("option", "value");
					return value / 10 + "%";
				});
			  },
			  step: 1,
			  min: 0,
			  max: 1000,
			  value: 1000
			});
			callback(null, $(".threshold_slider").slider("option", "value"));
		});
		d3.select("#threshold_slider")
			.append("div").attr("id", "slider_value")
			.text("100%")
	}
	
	function createComboBox() {
	
		var options = [ "name", "cpu" ];
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
				if(servers[d] != "none") {
					if(typeof servers[d] != 'undefined') {
						var quantize = d3.scale.quantile()
							.domain([0, number/10])
							.range(d3.range(10));
						return "hoverable h" + (1 + quantize(servers[d].cpu))
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
		d3.select("#dirtyNumbers").append("g").attr("id", "details");
		callback();
	}
	
	queue()
		.defer(createSlider)
		.defer(createComboBox)
		.defer(adjustColors, $(".threshold_slider").slider("option", "value"))
		.defer(addDirtyNumbers);
}

function processes(server) {
	function parseData(server) {
		var url = "http://localhost:9000/api/v1/metrics/?name=sys.server." + server + ".process.\*"
		d3.json(url,
			function(error, data) {
				parsedData = [];
				data = data["data"][server];
				for(var point in data) {
					for(var d in data[point][0]) {
						parsedData.push({name: data[point][0][d][1], data:data[point][0][d]});
					}
				}
				showProcesses(parsedData);
				d3.select(".backbutton")
						.on("mousedown", function() {
							zoomOut();
						});
			}
		)
	}

	var start = new Date();
	
	parseData(server);
		
	function showProcesses(d) {
		var procs = d3.select("#mainsvg").append("g").attr("id", "procs");
		d3.select("#bellsnwhistles").append("input").attr("id", "textBox").attr("type", "text").attr("oninput", "filterProcesses()");
		procs.selectAll("circle").data(d).enter()
			.append("circle")
			.attr("r", 0)
			.style("fill", function() {
				var r = Math.floor(Math.random() * 3);
				if(r == 0) {
					return "blue";
				} else if(r == 1) {
					return "red";
				} else {
					return "yellow";
				}
			})
			.attr("stroke", "black")
			.attr("stroke-width", 1)
			.transition().duration(500)
			.ease("elastic")
			.attr("r", 20)
			.attr("cx", function(x, i) {
				return 50 * (i % 10) + 75;
			})
			.attr("cy", function(x, i) {
				return 50 * Math.floor(i / 10) + 75;
			})
	}
}

function filterProcesses() {
		var text = d3.select("#textBox")[0][0].value;
		var visible = [];
		var circles = d3.select("#procs").selectAll("*")[0];
		d3.select("#procs").selectAll("*")[0]
			.forEach(function(d, i) {
				if(d.__data__.name.indexOf(text.toLowerCase()) == -1) {
					visible.push(false);
				}
				else {
					visible.push(true);
				}
			})
		var count = 0;
		visible.forEach( function(d, i) {
			if(visible[i]) {
				d3.select(circles[i]).transition().duration(300)
					.attr("cx", 50 * (count % 10) + 75)
					.attr("cy", 50 * Math.floor(count / 10) + 75)
					.attr("opacity", 1)
					.moveToFront;
				count = count + 1;
			}
			else {
				d3.select(circles[i]).transition().attr("opacity", 0);
			}
		})
	}