//Going to be a prototype for the process view

d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

var mainDiv = d3.select("body").append("div").attr("id", "mainDiv");

var controls = mainDiv.append("div").attr("id", "controls")
var appcontainer = mainDiv.append("div").attr("id", "appcontainer")
var svgContainer = appcontainer.append("svg").attr("width", 580).attr("height", 555);

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
		}
	)
}

var start = new Date();
parseData(9869);
	
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
				.attr("cx", 50 * (count % 10) + 30)
				.attr("cy", 50 * Math.floor(count / 10) + 30)
				.attr("opacity", 1)
				.moveToFront;
			count = count + 1;
		}
		else {
			d3.select(circles[i]).transition().attr("opacity", 0);
		}
	})
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
		// .attr("class", function(d) {
			// if(typeof d.data != 'undefined') {
				// console.log(d);
				// var quantize = d3.scale.quantile()
					// .domain([0, 300])
					// .range(d3.range(10));
				// return "hoverable p" + (1 + quantize(d.topo.resp_avg))
			// }
			// else {
				// return "hoverable"
			// }
		// })
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

function processes(server) {
	
}