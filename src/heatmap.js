d3.selection.prototype.moveToFront = function() {
	return this.each(function(){
		this.parentNode.appendChild(this);
	});
};

var rgcolor = d3.scale.linear()
	.domain([1,2,3,4,5,6,7,8,9,10])
	.range(['#00FF00', '#40FF00', '#80FF00', '#BFFF00', '#FFFF00', '#FFBF00',
		'#FF8000', '#FF5C26', '#FF4000', '#FF0000']);
var mainDiv = d3.select("body").append("div").attr("id", "mainDiv");
var columns = 15;
var rows = 10;
var buckets = 11;
var layer = 1;
var servers = {};
var collectorIDs = {};
var serverLinkMap = [];
var transition = false;
var socketRadius = 250;

	
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
	.defer(getFile, "http://10.7.7.120:9000/api/v1/metrics/?name=sys.server.\*.\*")
	.awaitAll(function(error, data) {
		if(typeof error == null) { console.log(error); return; }
		createHeatMap(data)
	})
	
$.ajax( {
	url:"http://10.7.7.120:9000/api/topology/",
	dataType: "json",
	crossDomain: true,
	jsonp: "callback",
	success: function(d) {
		serverLinkMap = []
		d.Node.forEach( function(e) {
			if(typeof e.ips != "undefined") {
				JSON.parse(e.ips).forEach( function(f) {
					serverLinkMap[f] = e.id;
				})
			}
		});
		serverLinkMap["127.0.0.1"] = "self";
	},
	error: function(e, errorType) {
		console.log(errorType);
	}
});
	
var adjustServerColors = function(number, callback) {
	var quantize = d3.scale.quantile()
		.domain([0, number])
		.range(d3.range(10));
	if(!transition) {
		d3.select("body").select("#mainDiv").select("svg")
			.select("g")
			.selectAll("rect")
			.style("fill", function(d) {
				if(tcombobox.selection.selectedIndex == 0) {
					return (rgcolor(1 + quantize(servers[d].cpu)))
				}
				else if(tcombobox.selection.selectedIndex == 1) {
					return (rgcolor(1 + quantize(servers[d].pnum)))
				}			
			})
			.attr("class", function(d) {
				return "hoverable"
			});
	}
	if(transition) {
		d3.select("body").select("#mainDiv").select("svg")
			.select("g")
			.selectAll("rect")
			.transition().duration(1000)
			.style("fill", function(d) {
				if(tcombobox.selection.selectedIndex == 0) {
					return (rgcolor(1 + quantize(servers[d].cpu)))
				}
				else if(tcombobox.selection.selectedIndex == 1) {
					return (rgcolor(1 + quantize(servers[d].pnum)))
				}
			})
			.attr("class", function(d) {
				return "hoverable"
			});
	}
	if(typeof callback != "undefined") {
		callback();
	}
}
	
var adjustProcessColors = function(number, callback) {
	var quantize = d3.scale.quantile()
		.domain([0, number])
		.range(d3.range(10));
	if(!transition) {
		d3.select("#procs").selectAll("*")
			.style("fill", function(d) {
				if(ptcombobox.selection.selectedIndex == 0) {
					return (rgcolor(1 + quantize(d.data[0].cpu)))
				}
				else if(ptcombobox.selection.selectedIndex == 1) {
					return (rgcolor(1 + quantize(d.data[0].sread)))
				}			
			})
			.attr("class", function(d) {
				return "hoverable"
			});
	}
	if(transition) {
		d3.select("#procs").selectAll("*")
			.transition().duration(1000)
			.style("fill", function(d) {
				if(ptcombobox.selfaceection.selectedIndex == 0) {
					return (rgcolor(1 + quantize(d.data[0].cpu)))
				}
				else if(ptcombobox.selection.selectedIndex == 1) {
					return (rgcolor(1 + quantize(d.data[0].sread)))
				}
			})
			.attr("class", function(d) {
				return "hoverable"
			});
	}
	if(typeof callback != "undefined") {
		callback();
	}
}

var adjustSocketColors = function(number, callback) {
	var quantize = d3.scale.quantile()
		.domain([0, number])
		.range(d3.range(10));
}

var loadedMore = function(l, callback) {
	d3.select("#loading").transition().duration(1000)
		.ease("linear")
		.attr("width", 140 * (l/100))
		.each("end", function() {
			if(l == 100) {
				d3.select("#loading").remove();
				d3.select("#loading-bar").remove();
			}
			if(callback != undefined) {
				callback();
			}
		})
	
}

function filterServers() {
	var rects = d3.select("#tiles").selectAll("*");
	if(combobox.selection.selectedIndex == 0) { //name
		var sorted = rects.sort(nameSort);
	}
	else if(combobox.selection.selectedIndex == 1) { //cpu
		var sorted = rects.sort(cpuSort);
	}
	else if(combobox.selection.selectedIndex == 2) { //no. of processes
		var sorted = rects.sort(numProcSort);
	}
	else if(combobox.selection.selectedIndex == 3) { //inbound traffic
		var sorted = rects.sort(inboundSort);
	}
	
	
	sorted[0].forEach(function(e, i) {
		d3.select(e).transition().duration(1000)
			.attr("x", 40 * (i % columns) )
			.attr("y", Math.floor(i / columns) * 40 )
	});
	
	
	function nameSort(a, b) {
		if(a.toLowerCase() < b.toLowerCase()) { return -1; }
		else if(a.toLowerCase() == b.toLowerCase()) { return 0; }
		else { return 1; }
	}
	
	function cpuSort(a, b) {
		if(Number(servers[a].cpu) < Number(servers[b].cpu)) { return -1; }
		else if(Number(servers[a].cpu) == Number(servers[b].cpu)) { return 0; }
		else { return 1; }
	}
	
	function numProcSort(a, b) {
		if(Number(servers[a].pnum) < Number(servers[b].pnum)) { return -1; }
		else if(Number(servers[a].pnum) == Number(servers[b].pnum)) { return 0; }
		else { return 1; }
	}
	
	function inboundSort(a,b) {
		if(Number(servers[a].sread) < Number(servers[b].sread)) { return -1; }
		else if(Number(servers[a].sread) == Number(servers[b].sread)) { return 0; }
		else { return 1; }
	}
}

function filterSockets() {
	var value = $(".socket_threshold_filter").slider("option", "value");
	d3.select("#socket").selectAll("line")
		.filter(function() {
			if(socombobox[1].soselection.selectedIndex == 0) {
				return d3.select(this)[0][0].__data__["Data Sent (bytes)"] <= value
					|| (!isNaN(value)&& value > 0);
			}
			else if(socombobox[1].soselection.selectedIndex == 1) {
				return d3.select(this)[0][0].__data__["Data Received (bytes)"] <= value
					|| (!isNaN(value) && value > 0);
			}
		})
		.transition().duration(500).attr("opacity", 0).attr("display", "none");
	d3.select("#socket").selectAll("line")
		.filter(function() {
			if(socombobox[1].soselection.selectedIndex == 0) {
				return d3.select(this)[0][0].__data__["Data Sent (bytes)"] > value
					|| (!isNaN(value) && value == 0);
			}
			else if(socombobox[1].soselection.selectedIndex == 1) {
				return d3.select(this)[0][0].__data__["Data Received (bytes)"] > value
					|| (!isNaN(value) && value == 0);
			}
		})
		.transition().duration(500).attr("opacity", 1).attr("display", "inline");;
}

function changeSocketThreshold() {
	
}

function changeThreshold() {
	transition = true;
	if(tcombobox.selection.selectedIndex === 0) {
		$(".threshold_slider").slider("option", "max", 100);
		$(".threshold_slider").slider("option", "value", 100);
	}
	else if(tcombobox.selection.selectedIndex === 1) {
		$(".threshold_slider").slider("option", "max", 500);
		$(".threshold_slider").slider("option", "value", 500);
	}
	transition = false;
}

function changeProcThreshold() {
	transition = true;
	if(ptcombobox.selection.selectedIndex === 0) {
		$(".proc_threshold_slider").slider("option", "max", 100);
		$(".proc_threshold_slider").slider("option", "value", 50);
		$(".proc_threshold_slider").slider("option", "step", 1);
		$(".proc_threshold_filter").slider("option", "max", 100);
		// $(".proc_threshold_filter").slider("option", "value", 0);
		$(".proc_threshold_filter").slider("option", "step", 1);
	}
	else if(ptcombobox.selection.selectedIndex === 1) {
		$(".proc_threshold_slider").slider("option", "max", 1048576);
		$(".proc_threshold_slider").slider("option", "value", 1048576);
		$(".proc_threshold_slider").slider("option", "step", 100);
		$(".proc_threshold_filter").slider("option", "max", 1048576);
		// $(".proc_threshold_filter").slider("option", "value", 0);
		$(".proc_threshold_filter").slider("option", "step", 100);
	}
	transition = false;
}

function viewDataSize(num) {
	if(typeof num != "undefined") {
		if(num <= 1024)
			num += " B";
		else if(num < 1048576) {
			num = Math.floor(num / 1024 * 10)/10 + " KB";
		}
		else if(num <= 1073741824) {
			num = Math.floor(num / 1048576 * 10)/10 + " MB";
		}
		return num;
	}
	else {
		return "0 B"
	}
}

function mOverSocket(d) {
	var socketDetails = d3.select("#socket-details");
	socketDetails.select("#socket-status").text("Status: " + d.__data__.Status);
	socketDetails.select("#socket-port").text("Port: " + d.__data__["Socket Port"]);
	socketDetails.select("#socket-type").text("Type: " + d.__data__.Type);
	socketDetails.select("#socket-sent").text("Data Sent: " + viewDataSize(d.__data__["Data Sent (bytes)"]))
	socketDetails.select("#socket-received").text("Data Received: " + viewDataSize(d.__data__["Data Received (bytes)"]))
	socketDetails.select("#socket-linked").text("Linked to: " + serverLinkMap[d.__data__["Peer IP"]])
	console.log(d.__data__["Peer IP"])
	d3.select("#socket").selectAll("line")
		.style("stroke-width", 2).style("stroke", "black");
	d3.select(d).style("stroke", "blue").style("stroke-width", 6);
	
}

function mOutSocket() {
	var socketDetails = d3.select("#socket-details");
	socketDetails.select("#socket-status").text("Status: ");
	socketDetails.select("#socket-port").text("Port: ");
	socketDetails.select("#socket-type").text("Type: ");
	socketDetails.select("#socket-sent").text("Data Sent: ");
	socketDetails.select("#socket-received").text("Data Received: ");
}

function mOverServer(d) {
	var details = d3.select("#server-details");
	details.select("#server-name").text("Name: " + d)
	details.select("#server-cpu").text("CPU Usage: " + servers[d].cpu + "%");
	details.select("#server-inbound").text("Inbound Traffic: " + viewDataSize(Number(servers[d].sread)));
	details.select("#server-outbound").text("Outbound Traffic: " + viewDataSize(Number(servers[d].swrite)));
	details.select("#server-processes-num").text("No. of Processes: " + servers[d].pnum);
	d3.select(".tooltip").transition().duration(500).style("opacity", .9);
	d3.select(".tooltip").text("Name: " + d)
}

function mOutServer() {
	var details = d3.select("#server-details");
	details.select("#server-name").text("Name: ")
	details.select("#server-cpu").text("CPU Usage: ");
	details.select("#server-inbound").text("Inbound Traffic: ");
	details.select("#server-outbound").text("Outbound Traffic: ");
	details.select("#server-processes-num").text("No. of Processes: ");
	d3.select(".tooltip").transition().duration(500).style("opacity", 1e-16);
}

function mOverProcess(d) {
	var details = d3.select("#process-details");
	details.select("#process-name").text("Name: " + d.name);
	details.select("#process-cpu").text("CPU Usage: " + d.data[0].cpu + "%");
	details.select("#process-inbound").text("Inbound Traffic: " + viewDataSize(Number(d.data[0].sread)));
	details.select("#process-outbound").text("Outbound Traffic: " + viewDataSize(Number(d.data[0].swrite)));
	details.select("#process-response-num").text("No. of Responses: " + d.data[0].resp_num);
}

function mOutProcess() {
	var details = d3.select("#process-details");
	details.select("#process-name").text("Name: ");
	details.select("#process-cpu").text("CPU Usage: ");
	details.select("#process-inbound").text("Inbound Traffic: ");
	details.select("#process-outbound").text("Outbound Traffic: ");
	details.select("#process-response-num").text("No. of Responses: ");
}

function zoomIn(d, i) {
	if(layer == 1) {
		layer = 2;
		$(".threshold_slider").slider("option", "disabled", true);
		d3.selectAll(".hoverable").on("mouseout", null)
			.on("mouseover", null).on("click", null)
			.on("mousemove", null);
		d3.select(".tooltip").transition().duration(300).style("opacity", 1e-16)
		d3.select("#scombobox").select("form").select("select").attr("disabled", true);
		d3.select(".tcombobox").select("form").select("select").attr("disabled", true);

		var setValue = function(callback) {
			d3.select("body").select("#mainDiv")
				.select("svg").select("g")
				.selectAll("rect")[0]
				.forEach( function(e, j) {
					if(e.__data__ == d[0][0].__data__) {
						thisRect = e;
						oldx = thisRect.x.baseVal.value;
						oldy = thisRect.y.baseVal.value;
						if(callback != undefined) {
							callback();
						}
					}
				})
		}
		
		var loadingbar = d3.select("#mainsvg").append("rect")
			.attr("id", "loading-bar")
			.attr("x", 225)
			.attr("y", 225)
			.attr("width", 150)
			.attr("height", 25)
			.style("fill", "white")
			.style("stroke-width", "5px")
			.style("stroke", "black");
		var bar = d3.select("#mainsvg").append("rect")
			.attr("id", "loading")
			.attr("x", 230)
			.attr("y", 230)
			.attr("width", 0)
			.attr("height", 15)
			.style("fill", "blue")		
		
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
			.awaitAll(function() {
				$("#bellsnwhistles").fadeOut(500, function() {
					$("#processbells").fadeIn(500);
				});
				doAction();
			})
	}
	else if(layer == 2) {
		layer = 3;
		d3.select("#mainsvg").append("g").attr("id", "socket")
		$($("#procs *")[i]).clone().appendTo("#socket");
		d3.select("#socket").select("rect")
			.attr("class", null)
			.style("stroke", "black")
			.style("stroke-width", 2)
			
			.transition().duration(1000)
			.attr("x", 280).attr("y", 280);
		$("#procs").children().fadeOut();
		showLines(d[0][0].id);
		d3.select(".backbutton").on("mousedown", null);
		$("#processbells").fadeOut(500, function() {
			d3.select(".backbutton").on("mousedown", function() {
				zoomOut();
			})
			$("#socketbells").fadeIn(500);
		});
	}
};

function click(i, d) {
	zoomIn(d3.select(d), i);
	processes(collectorIDs[d3.select(d)[0][0].__data__]);
	d3.select(d).attr("class", function() {
		var re = d3.select(d).attr("class");
		re = re.replace("hoverable", "");
		re = re.replace(" ", "");
		return re;
	})
}

function zoomOut() {
	if(layer == 2) {
		layer = 1;
		d3.select("#textBox")[0][0].value = "";
		d3.select("#procs").remove();
		mOutServer();
		d3.select("#tiles").selectAll("*")
			.on("mouseover", function(d) {
				mOverServer(d);
			})
			.on("mouseout", function() {
				mOutServer();
			})
		
		d3.select("#scombobox").select("form").select("select").attr("disabled", null);
		d3.select(".tcombobox").select("form").select("select").attr("disabled", null);
		d3.select("#textBox").attr("disabled", true);
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
			
		$("#processbells").fadeOut(500, function() {
			$("#bellsnwhistles").fadeIn(500);
		});
	}
	else if(layer == 3) {
		layer = 2;
		$("#socket *").fadeOut(1000, $("#socket").remove());
		$("#socket").remove();
		$("#procs rect:hidden").fadeIn(1000);
		d3.select(".backbutton").on("mousedown", null);
		d3.selectAll(".hoverable").on("click", null)
		$("#socketbells").fadeOut(500, function() {
			$("#processbells").fadeIn(500);
			d3.select("#procs").selectAll("rect").on("click", function(d, i) {
				zoomIn(d3.select(d), i);
			})
			d3.select(".backbutton").on("mousedown", function() {
				zoomOut();
			})
		});
	}
}
	
function createHeatMap(data) {

	function parseServerData() {
	
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
			var server = "";
			
			while(temp !== "" && temp.indexOf(".") != -1 
				&& Object.keys(collectors).indexOf(server) == -1) {
				if(server !== "") {
					server = server + ".";
				}
				var i = temp.indexOf(".") + 1;
				var t = temp.substring(0, i);
				server = server + t;
				server = server.substring(0, server.length - 1)
				temp = temp.replace(t, "");
			}
			collectors[server][temp] = data[0]["data"][d][0]["value"];
		})
		return collectors;
	}
	
	servers = parseServerData();
	createTiles();
	createTools();
}

function createTiles() {
	var keys = Object.keys(servers);
	var oldx, oldy, thisRect;
	
	d3.select("body").select("#mainDiv")
		.append("div")
		.attr("id", "appcontainer")
		.append("svg")
		.attr("id", "mainsvg")
		.attr("width", 600)
		.attr("height", 600);
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
			mOverServer(d);
		})
		.on("mousemove", function(d) {
			d3.select(".tooltip")
				.style("left", (d3.event.pageX) + "px")
				.style("top", (d3.event.pageY) + "px");
		})
		.on("mouseout", function() {
			mOutServer();
		});
	createToolTip();
}

function createToolTip() {
	var tooltip = d3.select("#mainDiv").append("div").classed("tooltip", true).style("opacity", 1e-6);
	tooltip.text("words");
}

function createTools() {

	$("#mainDiv").prepend(
		jQuery("<div/>", {
			id: "bellsnwhistles",
			class: "bellsnwhistles",
			display: "none"
		})
	);
	$("#mainDiv").prepend(
		jQuery("<div/>", {
			id: "processbells",
			class: "bellsnwhistles",
			display: "none"
		})
	);
	$("#mainDiv").prepend(
		jQuery("<div/>", {
			id: "socketbells",
			class: "bellsnwhistles",
			display: "none"
		})
	);
	d3.select("#processbells").append("div").attr("id", "box-container").append("div")
		.classed("label", true).text("Filter: ");
	d3.select("#box-container").append("input")
		.attr("id", "textBox").attr("type", "text")
		.attr("oninput", "filterProcesses()")
		.attr("disabled", true);
	$("#processbells").hide();
	$("#socketbells").hide();
	
	var options = [ "cpu", "inbound traffic" ];
	var combobox = d3.select("#processbells")
		.append("div").classed("ptcombobox", true);
	combobox.append("div").classed("combolabel", true).text("Threshold: ");
	combobox.append("form").attr("name", "ptcombobox")
		.append("select").attr("name", "selection")
		.attr("size", 1).attr("onChange", "changeProcThreshold()");
	options.forEach( function(e) {
		d3.select(".ptcombobox").select("form").select("select")
			.append("option").attr("value", e).text(e);
	});
		
		
	var createSocketFilter = function(callback) {
	
		var options = [ "data sent", "data received", "time open" ];
		var combobox = d3.select("#socketbells").append("div").classed("combobox", true).attr("id", "socombobox");
		combobox.append("div").classed("combolabel", true).text("Threshold: ");
		combobox.append("form").attr("name", "socombobox")
			.append("select").attr("name", "soselection").attr("size", 1).attr("onChange", "changeSocketThreshold()");
		options.forEach( function(e) {
			d3.select("#socombobox").select("form").select("select")
				.append("option").attr("value", e).text(e);
		});
		d3.select("#socketbells")
			.append("div").attr("id", "socket_threshold_filter")
		
		d3.select("#socket_threshold_filter")
			.append("div").classed("socket_threshold_filter slider", true)
		$(function() {
			$(".socket_threshold_filter").slider({
				slide: function( event, ui ) {
					d3.select("#socket_filter_value").text( function() {
						var value = $(".socket_threshold_filter").slider("option", "value");
						return viewDataSize(value);
					});
				},
				change: function( event, ui ) { 
					filterSockets(ui.value)
					d3.select("#socket_filter_value").text( function() {
						var value = $(".socket_threshold_filter").slider("option", "value");
						return viewDataSize(value);	
					});
				},
				step: 100,
				min: 0,
				max: 102400,
				value: 0
			});
			if(callback != undefined) {
				callback();
			}
		});
		d3.select("#socket_threshold_filter")
			.append("div").attr("id", "socket_filter_value").classed("slider-value", true)
			.text("0 B")
	}
	
	var createProcFilter = function(callback) {
		d3.select("#processbells")
			.append("div").attr("id", "proc_threshold_filter")
		
		d3.select("#proc_threshold_filter")
			.append("div").classed("proc_threshold_filter slider", true)
		$(function() {
			$(".proc_threshold_filter").slider({
				slide: function( event, ui ) {
					d3.select("#proc_filter_value").text( function() {
						var value = $(".proc_threshold_filter").slider("option", "value");
						return value;
					});
				},
				change: function( event, ui ) { 
					filterProcesses(ui.value)
					d3.select("#proc_filter_value").text( function() {
						var value = $(".proc_threshold_filter").slider("option", "value");
						return value;	
					});
				},
				step: 1,
				min: 0,
				max: 50,
				value: 0
			});
			if(callback != undefined) {
				callback();
			}
		});
		d3.select("#proc_threshold_filter")
			.append("div").attr("id", "proc_filter_value").classed("slider-value", true)
			.text("0%")
	}
	
	var createProcSlider = function(callback) {
		d3.select("#processbells")
			.append("div").attr("id", "proc_threshold_slider")
		
		d3.select("#proc_threshold_slider")
			.append("div").classed("proc_threshold_slider slider", true)
		$(function() {
			$(".proc_threshold_slider").slider({
				slide: function( event, ui ) { 
					adjustProcessColors(ui.value);
					d3.select("#proc_slider_value").text( function() {
						var value = $(".proc_threshold_slider").slider("option", "value");
						if(ptcombobox.selection.selectedIndex == 0) {
							return value + "%";
						}
						else if(ptcombobox.selection.selectedIndex == 1) {
							return viewDataSize(value);
						}
					});
				},
				change: function( event, ui ) { 
					adjustProcessColors(ui.value);
					d3.select("#proc_slider_value").text( function() {
						var value = $(".proc_threshold_slider").slider("option", "value");
						if(ptcombobox.selection.selectedIndex == 0) {
							return value + "%";
						}
						else if(ptcombobox.selection.selectedIndex == 1){
							return viewDataSize(value);
						}		
					});
				},
				step: 1,
				min: 0,
				max: 100,
				value: 100
			});
			if(callback != undefined) {
				callback(null, $(".threshold_slider").slider("option", "value"));
			}
		});
		d3.select("#proc_threshold_slider")
			.append("div").attr("id", "proc_slider_value").classed("slider-value", true)
			.text("100%")
		
		var options = [ "name", "cpu", "inbound traffic", 
						"outbound traffic", "no. of responses" ];
		var combobox = d3.select("#processbells").append("div")
			.attr("id", "pcombobox").classed("combobox", true);
			combobox.append("div").classed("combolabel", true).text("Sort: ");
			combobox.append("form").attr("name", "pvcombobox")
				.append("select").attr("name", "selection")
				.attr("size", 1).attr("onChange", "sortProcesses()");
			options.forEach( function(e) {
				d3.select("#pcombobox").select("form").select("select")
					.append("option").attr("value", e).text(e);
			});
	}
	
	var createSlider = function(callback) {
		d3.select("#bellsnwhistles")
			.append("div").attr("id", "threshold_slider")
		var options = [ "cpu", "no. of processes" ];
		var combobox = d3.select("#threshold_slider")
			.append("div").classed("tcombobox", true);
		combobox.append("div").classed("combolabel", true).text("Threshold: ");
		combobox.append("form").attr("name", "tcombobox")
			.append("select").attr("name", "selection")
			.attr("size", 1).attr("onChange", "changeThreshold()");
		options.forEach( function(e) {
			d3.select(".tcombobox").select("form").select("select")
				.append("option").attr("value", e).text(e);
		});
		d3.select("#threshold_slider")
			.append("div").classed("threshold_slider slider", true)
		$(function() {
			$(".threshold_slider").slider({
				slide: function( event, ui ) { 
					adjustServerColors(ui.value);
					d3.select("#slider_value").text( function() {
						var value = $(".threshold_slider").slider("option", "value");
						if(tcombobox.selection.selectedIndex == 0) {
							return value + "%";
						}
						else {
							return value;
						}
					});
				},
				change: function( event, ui ) { 
					adjustServerColors(ui.value);
					d3.select("#slider_value").text( function() {
						var value = $(".threshold_slider").slider("option", "value");
						if(tcombobox.selection.selectedIndex == 0) {
							return value + "%";
						}
						else {
							return value;
						}				
					});
				},
				step: 1,
				min: 0,
				max: 100,
				value: 100
			});
			callback(null, $(".threshold_slider").slider("option", "value"));
		});
		d3.select("#threshold_slider")
			.append("div").attr("id", "slider_value")
			.text("100%")
	}
	
	var createComboBox = function(callback) {
	
		var options = [ "name", "cpu", "no. of processes", "inbound traffic" ];
		var combobox = d3.select("#bellsnwhistles").append("div").classed("combobox", true).attr("id", "scombobox");
			combobox.append("div").classed("combolabel", true).text("Sort: ");
			combobox.append("form").attr("name", "combobox")
				.append("select").attr("name", "selection").attr("size", 1).attr("onChange", "filterServers()");
			options.forEach( function(e) {
				d3.select("#scombobox").select("form").select("select")
					.append("option").attr("value", e).text(e);
			});
		if(callback != undefined) {
			callback();
		}
	}
	
	var addDirtyNumbers = function(divname, dnID, callback) {
		d3.select("#" + divname).append("div").classed("dirty-numbers", true).attr("id", dnID + "-numbers");
		if(callback != undefined) {
			callback();
		}
	}
	
	queue()
		.defer(createProcFilter)
		.defer(createSocketFilter)
		.defer(createSlider)
		.defer(createComboBox)
		.defer(createProcSlider)
		.defer(adjustServerColors, $(".threshold_slider").slider("option", "value"))
		.defer(addDirtyNumbers, "bellsnwhistles", "server")
		.defer(addDirtyNumbers, "processbells", "process")
		.defer(addDirtyNumbers, "socketbells", "socket")
		.awaitAll(function() {
			var serverDetails = d3.select("#server-numbers").append("g").attr("id", "server-details");
			serverDetails.append("div").attr("id", "server-name").text("Name: ");			
			serverDetails.append("div").attr("id", "server-cpu").text("CPU Usage: ");
			serverDetails.append("div").attr("id", "server-inbound").text("Inbound Traffic: ");
			serverDetails.append("div").attr("id", "server-outbound").text("Outbound Traffic: ");
			serverDetails.append("div").attr("id", "server-processes-num").text("No. of Processes: ");
			var processDetails = d3.select("#process-numbers").append("g").attr("id", "process-details");
			processDetails.append("div").attr("id", "process-name").text("Name: ");
			processDetails.append("div").attr("id", "process-cpu").text("CPU Usage: ");
			processDetails.append("div").attr("id", "process-inbound").text("Inbound Traffic: ");
			processDetails.append("div").attr("id", "process-outbound").text("Outbound Traffic: ");
			processDetails.append("div").attr("id", "process-response-num").text("No. of Responses: ");
			var socketDetails = d3.select("#socket-numbers").append("g").attr("id", "socket-details");
			socketDetails.append("div").attr("id", "socket-status").text("Status: ");
			socketDetails.append("div").attr("id", "socket-type").text("Type: ");
			socketDetails.append("div").attr("id", "socket-port").text("Port: ");
			socketDetails.append("div").attr("id", "socket-sent").text("Data sent: ");
			socketDetails.append("div").attr("id", "socket-received").text("Data received: ");
			socketDetails.append("div").attr("id", "socket-linked").text("Linked to: ");
		});
}

function parseData(server, callback) {
	loadedMore(30);
	var url = "http://10.7.7.120:9000/api/v1/metrics/?name=sys.server." + server + ".process.\*"
	d3.json(url,
		function(error, data) {
			parsedData = [];
			data = data["data"][server];
			for(var point in data) {
				for(var d in data[point][0]) {
					parsedData.push({name: data[point][0][d][1], id:d.split(",").join("_"), data:data[point][0][d]});
				}
			}
			callback(null, parsedData)
		}
	)
}

function showLines(id) {

	function draw(d) {
		d3.select("#socket").append("circle")
			.attr("cx", 300).attr("cy", 300)
			.attr("r", socketRadius).style("fill", "none")
			.style("stroke-width", 1).style("stroke", "black")
			.attr("opacity", 0).transition().duration(1000)
			.attr("opacity", 1);
		var numOfLines = typeof d.sockets != "undefined" ? d.sockets.length : 0;
		if(typeof d.sockets != "undefined") {
			d3.select("#socket").selectAll("line").data(d.sockets).enter().append("line")
				.attr("x1", 300).attr("y1", 300)
				.attr("x2", 300).attr("y2", 300)
				.style("stroke", "black").style("stroke-width", 2)
				.on("mouseover", function() {
					mOverSocket(this);
					
				})
				.transition().duration(1000)
				.attr("x2", function(d,i) { return 300 + socketRadius * Math.cos(i * 2*Math.PI/numOfLines - Math.PI/2) })
				.attr("y2", function(d,i) { return 300 + socketRadius * Math.sin(i * 2*Math.PI/numOfLines - Math.PI/2) })
			}
		}
		queue()
			.defer(d3.json, "http://10.7.7.120:9000/api/processes/" + id + "/detail/")
			.awaitAll(function(err, data) {
				draw(data[0]);
			})
}

function showProcesses(d) {
	var procs = d3.select("#mainsvg").append("g").attr("id", "procs");
	procs.selectAll("rect").data(d).enter()
		.append("rect")
		.classed("hoverable", true)
		.attr("opacity", 0)
		.attr("stroke", "gray")
		.attr("stroke-width", 1)
		.on("mouseover", function(d) {
			mOverProcess(d);
		})
		.on("mouseout", function() {
			mOutProcess();
		})
		.on("click", function(d, i) {
			zoomIn(d3.select(d), i);
		})
		.transition().duration(1000)
		.attr("opacity", 1)
		.attr("width", 40)
		.attr("height", 40)
		.attr("x", function(x, i) {
			return 40 * (i % 12) + 60;
		})
		.attr("y", function(x, i) {
			return 40 * Math.floor(i / 12) + 60;
		})
		.each("end", function() {
			d3.select(this).attr("display", function() {
				if(d3.select(this)[0][0].y.animVal.value > 500) {
					return "none";
				}
				else {
					return "inline";
				}
			});
		})
	d3.select(".backbutton")
		.on("mousedown", function() {
			zoomOut();
		});
	adjustProcessColors(100);
}

function processes(server) {

	queue(1)
		.defer(parseData, server)
		.defer(loadedMore, 100)
		.awaitAll(function(err, data) {
			showProcesses(data[0]);
			d3.select("#textBox").attr("disabled", null);
		})
}

function sortProcesses() {
	var procs = d3.select("#procs").selectAll("*")
	if(pvcombobox.selection.selectedIndex == 0) { //name
		var sorted = procs.sort(nameSort);
	}
	else if(pvcombobox.selection.selectedIndex == 1) { //cpu
		var sorted = procs.sort(cpuSort);
	}
	else if(pvcombobox.selection.selectedIndex == 2) { //inbound traffic
		var sorted = procs.sort(inboundSort);
	}
	else if(pvcombobox.selection.selectedIndex == 3) { //outbound traffic
		var sorted = procs.sort(outboundSort);
	}
	else if(pvcombobox.selection.selectedIndex == 4) { //num responses
		var sorted = procs.sort(respSort);
	}
	
	sorted[0].forEach(function(e, i) {
		d3.select(e).transition().duration(1000)
			.attr("x", 40 * (i % 12) + 60)
			.attr("y", Math.floor(i / 12) * 40 + 60)
	});
	
	filterProcesses();
	
	function nameSort(a, b) {
		if(a.name.toLowerCase() < b.name.toLowerCase()) { return -1; }
		else if(a.name.toLowerCase() == b.name.toLowerCase()) { return 0; }
		else { return 1; }
	}
	
	function inboundSort(a,b) {
		if(Number(a.data[0].sread) < Number(b.data[0].sread)) { return -1; }
		else if(Number(a.data[0].sread) == Number(b.data[0].sread)) { return 0; }
		else { return 1; }
	}
	
	function outboundSort(a,b) {
		if(Number(a.data[0].swrite) < Number(b.data[0].swrite)) { return -1; }
		else if(Number(a.data[0].swrite) == Number(b.data[0].swrite)) { return 0; }
		else { return 1; }
	}
	
	function cpuSort(a,b) {
		if(Number(a.data[0].cpu) < Number(b.data[0].cpu)) { return -1; }
		else if(Number(a.data[0].cpu) == Number(b.data[0].cpu)) { return 0; }
		else { return 1; }
	}
	
	function respSort(a,b) {
		if(Number(a.data[0].resp_num) < Number(b.data[0].resp_num)) { return -1; }
		else if(Number(a.data[0].resp_num) == Number(b.data[0].resp_num)) { return 0; }
		else { return 1; }
	}
}

function filterProcesses(value) {
	var text = d3.select("#textBox")[0][0].value;
	var visible = [];
	var circles = d3.select("#procs").selectAll("*")[0];
	var filterValue = typeof value == "undefined" ? $(".proc_threshold_filter").slider("option", "value") : value;
	d3.select("#procs").selectAll("*")[0]
		.forEach(function(d, i) {
			d3.select(d).attr("display", "inline");
		})
	
	d3.select("#procs").selectAll("*")[0]
		.forEach(function(d, i) {
			if((ptcombobox.selection.selectedIndex == 0 && d.__data__.data[0].cpu < filterValue) 
				|| (ptcombobox.selection.selectedIndex == 1 && d.__data__.data[0].sread < filterValue)
				|| (d.__data__.name.indexOf(text.toLowerCase()) == -1)) {
				visible.push(false);
			}
			else {
				visible.push(true);
			}
		})
	var count = 0;
	visible.forEach( function(d, i) {
		if(visible[i]) {
			d3.select(circles[i])
				.transition().duration(1000)
				.attr("x", 40 * (count % 12) + 60)
				.attr("y", 40 * Math.floor(count / 12) + 60)
				.attr("opacity", 1)
				.moveToFront;
			count = count + 1;
		}
		else {
			d3.select(circles[i])
				.transition().attr("opacity", 0);
		}
	})
	d3.select("#procs").selectAll("*")[0]
		.forEach(function(d, i) {
			if(!visible[i]) {
				d3.select(d).attr("display", "none");
			}			
		})
}