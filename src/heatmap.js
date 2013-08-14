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
var transition = false; //this line (13) is for kyle
var socketRadius = 250;
var ctrlPressed = false;
var buttonDown = false;
var multiServer = false;
  
function main() {
  d3.select(this).on("keydown", function() {
    if(d3.event.ctrlKey && !buttonDown) {
      ctrlPressed = true;
      buttonDown = true;
    }
  })
  .on("keyup", function() {
    if(d3.event.keyCode == 17) {
      ctrlPressed = false;
      buttonDown = false;
    }
  })

  queue()
    .defer(getFile, "http://localhost:9000/api/v1/metrics/?name=sys.server.\*.\*")
    .awaitAll(function(error, data) {
      if(typeof error == null) { console.log(error); return; }
      createHeatMap(data)
    })
}
  
d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};  

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
  
$.ajax( {
  url:"http://localhost:9000/api/topology/",
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
    d3.select("#procs").selectAll("rect")
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
    d3.select("#procs").selectAll("rect")
      .transition().duration(1000)
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
  var rects = d3.select("#tiles").selectAll("g");
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
  sorted[0].forEach(function(d, i) {
    d3.select(d).transition().duration(1000)
      .attr("transform", function(e) {
        var posX = -d3.select(d).select("rect").attr("x") + i % 15 * 40;
        var posY = -d3.select(d).select("rect").attr("y") + 40 * (Math.floor(i / 15));
        return "translate(" + posX + ","+ posY +")"; 
      })
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
    d3.select("#tiles").selectAll("g")
      .select("text")
      .transition().duration(500)
      .style("opacity", 0)
      .each("end", function(d) {
        d3.select(this)
          .text(function(d) {
            return servers[d].cpu;
          })
          .transition().duration(500)
          .style("opacity", 1)
      })
  }
  else if(tcombobox.selection.selectedIndex === 1) {
    $(".threshold_slider").slider("option", "max", 500);
    $(".threshold_slider").slider("option", "value", 500);
    d3.select("#tiles").selectAll("g")
      .select("text")
      .transition().duration(500)
      .style("opacity", 0)
      .each("end", function(d) {
        d3.select(this)
          .text(function(d) {
            return servers[d].pnum;
          })
          .transition().duration(500)
          .style("opacity", 1)
      })
  }
  transition = false;
}

function changeProcThreshold() {
  transition = true;
  if(ptcombobox.selection.selectedIndex === 0) {
    $(".proc_threshold_slider").slider("option", "max", 100);
    $(".proc_threshold_slider").slider("option", "value", 100);
    $(".proc_threshold_slider").slider("option", "step", 1);
    $(".proc_threshold_filter").slider("option", "max", 100);
    $(".proc_threshold_filter").slider("option", "step", 1);
	d3.select("#procs").selectAll("g")
      .select("text")
      .transition().duration(500)
      .style("opacity", 0)
      .each("end", function(d) {
        d3.select(this)
          .text(function(d) {
            return d.data[0].cpu;
          })
          .transition().duration(500)
          .style("opacity", 1)
      })
  }
  else if(ptcombobox.selection.selectedIndex === 1) {
    $(".proc_threshold_slider").slider("option", "max", 1048576);
    $(".proc_threshold_slider").slider("option", "value", 1048576);
    $(".proc_threshold_slider").slider("option", "step", 100);
    $(".proc_threshold_filter").slider("option", "max", 1048576);
    $(".proc_threshold_filter").slider("option", "step", 100);
	d3.select("#procs").selectAll("g")
      .select("text")
      .transition().duration(500)
      .style("opacity", 0)
      .each("end", function(d) {
        d3.select(this)
          .text(function(d) {
            return viewDataSize(d.data[0].sread);
          })
          .transition().duration(500)
          .style("opacity", 1)
      })
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
  d3.select("#socket").selectAll("line").transition().duration(300)
    .style("stroke-width", 2).style("stroke", "black");
  d3.select(d).transition().duration(300).style("stroke", "blue").style("stroke-width", 6);
  
}

function mOutSocket() {
  var socketDetails = d3.select("#socket-details");
  socketDetails.select("#socket-status").text("Status: ");
  socketDetails.select("#socket-port").text("Port: ");
  socketDetails.select("#socket-type").text("Type: ");
  socketDetails.select("#socket-sent").text("Data Sent: ");
  socketDetails.select("#socket-received").text("Data Received: ");
}

function mOverServer(d, t) {
  $(".tooltip").html("Name: " + d + 
    "<br>CPU Usage: " + servers[d].cpu + "%" + 
    "<br>Inbound Traffic: " + viewDataSize(Number(servers[d].sread)) + 
    "<br>Outbound Traffic: " + viewDataSize(Number(servers[d].swrite)) + 
    "<br>No. of Processes: " + servers[d].pnum)
  d3.select(".tooltip").transition().duration(200).style("opacity", .9);
  t.select("rect").transition().duration(200).style("stroke-width", 2).style("stroke", "black").style("opacity", .7);
}

function mOutServer(t) {
  d3.select(".tooltip").transition().duration(200).style("opacity", 0);
  if(t.select(".hoverable").attr("selected") == null) {
	t.select("rect").transition().duration(200).style("stroke-width", 1).style("stroke", "gray").style("opacity", 1);
  }
}

function mOverProcess(d, t) {
  t.select("rect").transition().duration(200).style("stroke-width", 2).style("stroke", "black").style("opacity", .7);
  $(".tooltip").html("Name: " + d.name + 
    "<br>CPU Usage: " + d.data[0].cpu + "%" + 
    "<br>Inbound Traffic: " + viewDataSize(Number(d.data[0].sread)) + 
    "<br>Outbound Traffic: " + viewDataSize(Number(d.data[0].swrite)))
  d3.select(".tooltip").transition().duration(200).style("opacity", .9);
}

function mOutProcess(t) {
  d3.select(".tooltip").transition().duration(200).style("opacity", 0);
  if(t.select(".hoverable").attr("selected") == null) {
	t.select("rect").transition().duration(200).style("stroke-width", 1).style("stroke", "gray").style("opacity", 1);
  }
}

function zoomIn(d, i) {
  if(layer == 1) {
    layer = 2;
    if(d[0][0].length == 1) {
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
            if(e.__data__ == d[0][0][0].__data__) {
              thisRect = e;
              oldx = thisRect.x.baseVal.value;
              oldy = thisRect.y.baseVal.value;
              if(callback != undefined) {
                callback();
              }
            }
          })
      }  
      
      var doAction = function(callback) {
        $("#tiles").fadeOut();
        d3.select("body").select("#mainDiv").select("svg")
          .append("g").attr("class", "backbutton")
          .append("rect")
          .attr("width", 0)
          .attr("height", 0)
          .attr("opacity", 0)
          .style("fill", "white")
          .classed("back", true)
          .attr("x", 20)
          .attr("y", 20)
          .attr("width", 50)
          .attr("height", 30)
          .transition().duration(1000)
          .attr("opacity", 1);
          
        d3.select(".backbutton").append("text")
          .text("Back")
          .attr("width", 0)
          .attr("height", 0)
          .attr("font-size", 0)
          .attr("font-size", 12)
          .attr("x", 32)
          .attr("y", 40)
          .attr("opacity", 0)
          .transition().duration(1000)
          .attr("opacity", 1);
          
        d3.select(d[0][0][0]).moveToFront;
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
    else {
      multiServer = true;
      $("#tiles").fadeOut();
      d3.select("body").select("#mainDiv").select("svg")
        .append("g").attr("class", "backbutton")
        .append("rect")
        .style("opacity", 0)
        .style("fill", "white")
        .classed("back", true)
        .attr("width", 50)
        .attr("height", 30)
        .attr("x", 20)
        .attr("y", 20)
        .transition().duration(1000)
        .style("opacity", 1);
        
      d3.select(".backbutton").append("text")
        .text("Back")
        .attr("font-size", 12)
        .attr("x", 32)
        .attr("y", 40)
        .style("opacity", 0)
        .transition().duration(1000)
        .style("opacity", 1);
      $("#bellsnwhistles").fadeOut(500, function() {
        $("#processbells").fadeIn(500);
      });
    }
  }
  else if(layer == 2) {
    layer = 3;
    d3.select("#mainsvg").append("g").attr("id", "socket")
	console.log(i)
    $($("#procs g rect")[i]).clone().appendTo("#socket");
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
  if(ctrlPressed && (!d3.select(d).attr("selected") || !d3.select(d).select("rect").attr("selected"))) {
    d3.select(d).select("rect").attr("selected", true)
      .style("stroke-width", "2px")
      .style("stroke", "black")
      .style("opacity", .7);
    $("#selected-servers").html($("#selected-servers").html() + d.__data__ + "<br>");
  }
  else if(ctrlPressed && d3.select(d).select("rect").attr("selected")) {
    d3.select(d).select("rect").attr("selected", null)
      .style("stroke-width", "1px")
      .style("stroke", "gray")
      .style("opacity", 1);
    $("#selected-servers").html($("#selected-servers").html().replace(d.__data__ + "<br>", ""));
  }
  else {
    d3.select(d).select("rect").attr("selected", true);
    $("#selected-servers").html($("#selected-servers").html() + d.__data__ + "<br>");
    var serverIDs = [];
    d3.select("#tiles").selectAll("g")
      .select("rect")
      .filter( function(d) {
        return d3.select(this).attr("selected");
      })
      .call(function(d) {
        d[0].forEach(function(data, index) {
          d3.select(data)
            .style("stroke-width", "1px")
            .style("stroke", "gray")
            .style("opacity", 1)
			.attr("selected", null);
          serverIDs.push(data.__data__);
        })
        zoomIn(d3.select(d[0]), i);
      })
    processes(serverIDs);
    d3.select("#selected-servers").text("");
    d3.select(d).attr("selected", null);
  }
}

function zoomOut() {
  if(layer == 2) {
    layer = 1;
	if(!multiServer) {
      d3.select("#textBox")[0][0].value = "";
      d3.select("#tiles").selectAll("g")
        .on("mouseover", function(d) {
          mOverServer(d, d3.select(this));
        })
        .on("mouseout", function() {
          mOutServer(d3.select(this));
        })
        .on("mousemove", function() { 
          moveToolTip();
        })
      
      d3.select("#scombobox").select("form").select("select").attr("disabled", null);
      d3.select(".tcombobox").select("form").select("select").attr("disabled", null);
      d3.select("#textBox").attr("disabled", true);
      $(".threshold_slider").slider("option", "disabled", false);
      $("#procs").fadeOut(function() {
        $("#procs").remove();
        $("#tiles").fadeIn(function() {
          d3.select("#tiles").selectAll("g")
            .on("click", function(d, i) {
              click(i, this);
            })
        });
      })
    }
    else {
      $("#procs").fadeOut(function() {
        $("#procs").remove();
        $("#tiles").fadeIn();
      })
      multiServer = false;
    }
    $(".backbutton").fadeOut(500);
    $("#processbells").fadeOut(500, function() {
      $(".backbutton").remove();
      $("#bellsnwhistles").fadeIn(500);
    });
  }
  else if(layer == 3) {
    layer = 2;
    $("#socket *").fadeOut(1000, $("#socket").remove());
    $("#socket").remove();
    $("#procs g:hidden").fadeIn(1000);
    d3.select(".backbutton").on("mousedown", null);
    d3.select("#procs").selectAll(".hoverable").on("click", null)
    $("#socketbells").fadeOut(500, function() {
      $("#processbells").fadeIn(500);
      d3.select("#procs").selectAll("g").select("rect").on("click", function(d, i) {
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
    .selectAll("g")
    .data(keys)
    .enter()
    .append("g")
    .on("mouseover", function(d) {
      mOverServer(d, d3.select(this));
    })
    .on("mousemove", function(d) {
      moveToolTip();
    })
    .on("mouseout", function() {
      mOutServer(d3.select(this));
    })
	.on("click", function(d, i) {
      click(i, this);
    })
    .append("rect")
    .attr("x", function(d, i) {
      return 40 * (i % columns);
    })
    .attr("y", function(d, i) {
      return Math.floor(i / columns) * 40;
    })
    .attr("width", 40)
    .attr("height", 40)
    
  d3.select("#tiles").selectAll("g")
    .append("text").classed("quick-num", true)
    .text(function(d) {
      return servers[d].cpu;
    })
    .attr("x", function(d,i) {
      return 20 + 40 * (i%15);
    })
    .attr("y", function(d,i) {
      return 20 + 40 * Math.floor(i/15);
    });
  createToolTip();
}

function createToolTip() {
  var tooltip = d3.select("#mainDiv")
    .append("div").classed("tooltip", true)
    .style("opacity", 0);
}

function moveToolTip() {
  d3.select(".tooltip")
    .style("left", (d3.event.pageX + 10) + "px")
    .style("top", (d3.event.pageY + 10) + "px");
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
  d3.select("#bellsnwhistles").append("div").text("Servers").classed("bells-label", true);
  d3.select("#bellsnwhistles").append("div").text("Ctrl + click to select multiple servers.")
    .style("font-style", "italic").style("text-align", "center").style("padding-bottom", "5px")
  d3.select("#processbells").append("div").text("Processes").classed("bells-label", true);
  d3.select("#socketbells").append("div").text("Sockets").classed("bells-label", true);
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
    d3.select("#proc_threshold_filter").append("div").text("Heatmap Filter")
	  .style("text-align", "center").style("padding-right", "15px")
	  .style("padding-top", "5px").style("font-weight", "bold");
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
    d3.select("#proc_threshold_slider").append("div").text("Heatmap Threshold")
	  .style("text-align", "center").style("padding-right", "15px")
	  .style("font-weight", "bold");
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
      .append("div").attr("id", "threshold_slider");
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
	d3.select("#threshold_slider").append("div").text("Heatmap Threshold")
	  .style("text-align", "center").style("padding-right", "15px")
	  .style("font-weight", "bold");
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
    .defer(addDirtyNumbers, "socketbells", "socket")
    .awaitAll(function() {
      d3.select("#server-numbers").append("div")
        .style("font-weight", "bold")
        .attr("id", "selected-servers");
      var socketDetails = d3.select("#socket-numbers").append("g").attr("id", "socket-details");
      socketDetails.append("div").attr("id", "socket-status").text("Status: ");
      socketDetails.append("div").attr("id", "socket-type").text("Type: ");
      socketDetails.append("div").attr("id", "socket-port").text("Port: ");
      socketDetails.append("div").attr("id", "socket-sent").text("Data sent: ");
      socketDetails.append("div").attr("id", "socket-received").text("Data received: ");
      socketDetails.append("div").attr("id", "socket-linked").text("Linked to: ");
    });
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
      .defer(d3.json, "http://localhost:9000/api/processes/" + id + "/detail/")
      .awaitAll(function(err, data) {
        draw(data[0]);
      })
}

function processes(server) {

  var flatten = function (array) {

    var returnValue = [];
    var temporaryFlatArray;
    for (var i = 0; i < array.length; i++) {
      if (!Array.isArray(array[i])) {
        returnValue.push(array[i]);
      } else {
        temporaryFlatArray = flatten(array[i]);
        for (var j = 0; j < temporaryFlatArray.length; j++) {
          returnValue.push(temporaryFlatArray[j]);
        }
      }
    }
    return returnValue;
  };

  function parseData(servers, callback) {
  
    var parse = function(id, callback) {
      var url = "http://localhost:9000/api/v1/metrics/?name=sys.server." + id + ".process.\*"
      d3.json(url, function(err, data) {
        parsedData = [];
        data = data["data"][id];
        for(var point in data) {
          for(var d in data[point][0]) {
            parsedData.push({name: data[point][0][d][1], id:d.split(",").join("_"), data:data[point][0][d]});
          }
        }
        callback(null, parsedData);
      })
    }
    
    var q = queue();
    servers.forEach( function(d, i) {
      q.defer(parse, collectorIDs[d]);
    })
    
    q.awaitAll(function(err, data) {
      var merged = data[0].length > 1 ? flatten(data) : data[0];
      callback(null, merged);
    })
  }

  function showProcesses(d) {
    var procs = d3.select("#mainsvg").append("g").attr("id", "procs")
      .selectAll("g").data(d).enter()
	  .append("g")
	  .on("mouseover", function(d) {
        mOverProcess(d, d3.select(this));
      })
      .on("mouseout", function() {
        mOutProcess(d3.select(this));
      })
      .on("click", function(d, i) {
        zoomIn(d3.select(d), i);
      })
	  .on("mousemove", function(d, i) {
		moveToolTip();
	  })
      .append("rect")
      .classed("hoverable", true)
      .attr("display", "none")
      .attr("stroke", "gray")
      .attr("stroke-width", 1)
      .attr("width", 40)
      .attr("height", 40)
      .attr("x", function(x, i) {
        return 40 * (i % 12) + 60;
      })
      .attr("y", function(x, i) {
        return 40 * Math.floor(i / 12) + 60;
      })
	d3.select("#procs").selectAll("g")
      .append("text").classed("quick-num", true)
      .text(function(d) {
        return d.data[0].cpu;
      })
      .attr("x", function(d,i) {
        return 80 + 40 * (i%12);
      })
      .attr("y", function(d,i) {
        return 80 + 40 * Math.floor(i/12);
      })
	  .style("display", "none");
	$("#procs g *").fadeIn();
    d3.select(".backbutton")
      .on("mousedown", function() {
        zoomOut();
      });
    adjustProcessColors(100);
  }
  queue(1)
    .defer(parseData, server)
    .awaitAll(function(err, data){
      showProcesses(data[0]);
      d3.select("#textBox").attr("disabled", null);
    })
}

function sortProcesses() {
  var procs = d3.select("#procs").selectAll("g")
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
  sorted[0].forEach(function(d, i) {
    d3.select(d).transition().duration(1000)
      .attr("transform", function(e) {
        var posX = -d3.select(d).select("rect").attr("x") + 60 + i % 12 * 40;
        var posY = -d3.select(d).select("rect").attr("y") + 60 + 40 * Math.floor(i / 12);
        return "translate(" + posX + ","+ posY +")"; 
      })
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
  var circles = d3.select("#procs").selectAll("g")[0];
  var filterValue = typeof value == "undefined" ? $(".proc_threshold_filter").slider("option", "value") : value;
  d3.select("#procs").selectAll("g")[0]
    .forEach(function(d, i) {
      d3.select(d).attr("display", "inline");
    })
  
  d3.select("#procs").selectAll("rect")[0]
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
        .attr("transform", function(d) {
          var posX = -d3.select(circles[i]).select("rect").attr("x") + 60 + count % 12 * 40;
          var posY = -d3.select(circles[i]).select("rect").attr("y") + 60 + 40 * Math.floor(count / 12);
          return "translate(" + posX + ","+ posY +")"; 
        })
        .attr("opacity", 1)
        .moveToFront;
      count = count + 1;
    }
    else {
      d3.select(circles[i])
        .transition().attr("opacity", 0);
    }
  })
  d3.select("#procs").selectAll("g")[0]
    .forEach(function(d, i) {
      if(!visible[i]) {
        d3.select(d).attr("display", "none");
      }      
    })
}

main();