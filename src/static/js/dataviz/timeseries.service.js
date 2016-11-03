angular.module('app')
.service('timeseriesService', ['$q', '$http', 'lodash', function($q, $http, lodash) {
    var timeseriesService = {};

    timeseriesService.chart = function(container, data, config) {
        var timeFormats = {
            "year" : "YYYY",
            "quarter" : "[Q]Q YYYY",
            "month" : "MMM YYYY"
        };

        config.facet = lodash.difference(["structure", "time"], [config.facet])[0]

        // create container for maps
        chartContainer = d3.select(container)
            .append("div")
                .classed("timeseries-container", true)
            .append("div")
                .classed("timeseries-container-internal", true)
                .datum(data);

        // create container for legends
        legendContainer = d3.select(container)
            .append("div")
            .classed({
                "legend-container" : true,
                "timeseries-legend-container" : true,
            });

        // chartContainer.append("pre")
        //     .text(JSON.stringify(data, null, 4));
            // .text(JSON.stringify(config, null, 4));
        // return;

        makeTimeSeries(chartContainer);

        var legendDiv = legendContainer.selectAll("div.legend")
            .data([data])
            .enter()
            .append("div")
                .classed({
                    "legend": true,
                    "timeseries-legend": true
                })

        makeLegend(legendDiv);

        /** START SCROLL NOTICE **/
        // if we are under a certain pixel size, there will be horizontal scrolling
        var internalContainerSize = d3.select(container).select("div.timeseries-container-internal").node().getBoundingClientRect(),
            containerSize = d3.select(container).select("div.timeseries-container").node().getBoundingClientRect();

        // console.log(internalContainerSize.width + " / " + containerSize.width)
        if (internalContainerSize.width > containerSize.width) {
            // console.log("scroll Notice!")
            // create scroll notice
            var scrollNotice = d3.select(container).select("div.timeseries-container").append("div")
                .classed("scroll-notice", true)
                .append("p");

            scrollNotice.append("i")
                .classed({
                    "fa" : true,
                    "fa-angle-double-down " : true
                });

            scrollNotice.append("span")
                .text("Scroll for more");

            scrollNotice.append("i")
                .classed({
                    "fa" : true,
                    "fa-angle-double-down " : true
                });
        }

        d3.select(container).selectAll("div.timeseries-container").on("scroll", function() {
            // if scroll at bottom, hide scroll notice
            // using a different class so as not to interfere with the mouseover effects
            if ((d3.select(this).node().scrollLeft + d3.select(this).node().offsetWidth) >= (d3.select(this).node().scrollWidth * 0.975)) {
                d3.select(container).selectAll("div.scroll-notice")
                    .classed({
                        "hidden" : true
                    });
            } else {
                d3.select(container).selectAll("div.scroll-notice")
                    .classed({
                        "hidden" : false
                    });
            }
        })
        /** END SCROLL NOTICE **/

        // add hover effects - use classes "highlight" and "lowlight"
        d3.select(container).selectAll("g.entry, g.timeseries-lines > path, g.timeseries-points > path")
        .on("mouseover", function(){
            var classToHighlight = d3.select(this).attr("data-class");

            // lowlight all elements
            d3.select(container).selectAll("g.entry, g.timeseries-lines > path, g.timeseries-points > path, div.scroll-notice")
            .classed({
                "lowlight" : true,
                "highlight" : false
            });
            
            // highlight all elements with matching data-class
            d3.select(container).selectAll("g.entry."+classToHighlight+", g.timeseries-lines > path."+classToHighlight+", g.timeseries-points path."+classToHighlight)
            .classed({
                "lowlight" : false,
                "highlight" : true
            });
        })
        .on("mouseout", function(){
            // remove all highlight/lowlight classes
            d3.select(container).selectAll("g.entry, g.timeseries-lines > path, g.timeseries-points > path, div.scroll-notice")
            .classed({
                "lowlight" : false,
                "highlight" : false
            });
        });

        function makeLegend(selection) {
            selection.each(function(data) {
                // sizing and margin vars
                var BBox = this.getBoundingClientRect(),
                margin = {
                    "top" : d3.max([BBox.height * 0.08, 32]),
                    "right" : BBox.width * 0.01,
                    "bottom" : BBox.height * 0.01,
                    "left" : BBox.width * 0.08
                },
                width = BBox.width - (margin.left + margin.right)
                height = BBox.height - (margin.top + margin.bottom),

                // containers
                svg = d3.select(this).append("svg")
                    .attr("height", height)
                    // .attr("height", BBox.height)
                    .attr("width", width)
                    // .attr("width", BBox.width)
                    // .attr("transform", "translate(0, 0)"),

                legendData = lodash.chain(data)
                        .pluck("key")
                        .flatten()
                        .unique()
                        .value()
                        .sort(),

                svg.attr("height", d3.max([
                    (19 * (legendData.length) + 40), // 19 px times length of data, plus 20 for Title and 20 padding
                    svg.attr("height")
                ])),

                // color scale
                colors = d3.scale.category20()
                    .domain(legendData),

                // point shape "scale"
                symbolScale = d3.scale.ordinal()
                    .range(d3.svg.symbolTypes)
                    .domain(legendData),

                // slug function for classing and highlighting
                sluggify = function(text) {
                    return text.toLowerCase().replace(/\W/g, "_");
                };

                var legendTitle = svg.append("text")
                    .text("Legend")
                    .attr("transform", "translate(12, 20)");

                var legend = svg.append("g")
                    .classed("legend", true)
                    .attr("height", height)
                    .attr("width", width)
                    .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

                var legendGroups = legend.selectAll("g.entry")
                    .data(legendData)
                    .enter()
                        .append("g")
                        .attr("data-class", function(d) {
                            return sluggify(d);
                        })
                        .attr("class", function(d) {
                            var classes = [
                                "entry",
                                sluggify(d)
                            ].join(" ");
                            return classes;
                        })
                        .attr("transform", function(d, i) { return "translate(0, " + (19 * i) + ")";})
                        .datum(function(d) { return d; });

                legendGroups.each(function() {
                    var tspanCount = legendGroups.selectAll("tspan").size();
                    
                    d3.select(this)
                        .attr("transform", function(d, i) { return "translate(0, " + (19 * i) + ((tspanCount - i) * 19) + ")";})

                    d3.select(this).append("path")
                        .attr("fill", function(d, i) {return colors(d); } )
                        .attr("stroke", function(d, i) {return colors(d); } )
                        .attr("stroke-width", 0)
                        .attr("d", d3.svg.symbol().type(function(d) {return symbolScale(d); }).size(25));

                    d3.select(this).append("text")
                        .attr("fill", "#4A4A4A")
                        .attr("y", 6)
                        .attr("dx", 8)
                        .tspans(function(d) {
                            return d3.wordwrap(d, 20);
                        });
                })

                // all spans are by default unstyled, with no way to do it in jetpack,
                // so in order to fight the hanging indent effect, move them over 8 px
                d3.selectAll("tspan").attr("dx", 8)
            });
        }

        function makeTimeSeries(selection) {
            selection.each(function(data) {
                console.log("bounding box")
                console.log(this.getBoundingClientRect())

                // sizing and margin vars
                var BBox = this.getBoundingClientRect(),
                    margin = {
                        "top" : BBox.height * 0.05,
                        "right" : BBox.width * 0.05,
                        "bottom" : BBox.height * 0.05,
                        "left" : d3.max([BBox.width * 0.05, 55])
                    },
                    width = BBox.width - (margin.left + margin.right)
                    height = BBox.height - (margin.top + margin.bottom),

                    // containers
                    svg = d3.select(this).append("svg")
                        .attr("height", BBox.height)
                        .attr("width", BBox.width)
                        // .attr("transform", "translate(0, 0)"),
                    chart = svg.append("g")
                        .attr("height", height)
                        .attr("width", width)
                        .attr("transform", "translate(" + margin.left + ", " + margin.top + ")"),

                        // testing stuff - draws outlines around svg and container
                    // svgOutline = svg.append("rect")
                    //     .attr("height", svg.attr("height"))
                    //     .attr("width", svg.attr("width"))
                    //     .attr("fill", "rgba(0,0,0,0)")
                    //     .attr("stroke", "red"),
                    // chartOutline = chart.append("rect")
                    //     .attr("height", chart.attr("height"))
                    //     .attr("width", chart.attr("width"))
                    //     .attr("fill", "rgba(0,0,0,0)")
                    //     .attr("stroke", "blue"),

                    // moment-based date parsing function
                    parseDate = function(dt) { return moment(dt, timeFormats[config.time]).toDate(); },
                    // calculates number of time units (month, quarter, year) between start and end.
                    dateSpan = function(start, end) {
                        return Math.abs(moment(start, timeFormats[config.time]).diff(moment(end, timeFormats[config.time]), config.time));
                    },
                    // returns a number of ticks based on passed in width
                    getMaxTicks = function(width) {
                        if (width <= 640) {
                            return 6;
                        } else if (width > 640 && width <= 720) {
                            return 8;
                        } else {
                            return 10;
                        }
                    },

                    // keys for color and shape scales
                    facetKeys = lodash.chain(data)
                            .pluck("key")
                            .flatten()
                            .unique()
                            .value()
                            .sort(),

                    // color scale
                    colors = d3.scale.category20()
                        .domain(
                            facetKeys
                        ),

                    // point shape "scale"
                    symbolScale = d3.scale.ordinal()
                        .range(d3.svg.symbolTypes)
                        .domain(
                            facetKeys
                        ),

                    // x and y scales
                    x = d3.time.scale()
                        .range([12, width])
                        .domain([
                            parseDate(config.start),
                            parseDate(config.end),
                        ]),
                    y = d3.scale.linear()
                        .range([height, 0])
                        .domain(
                            d3.extent(
                                lodash.chain(data)
                                .pluck("values")
                                .flatten()
                                .pluck("values")
                                .flatten()
                                .unique()
                                .value()
                            )
                        ),

                    // axis functions
                    xAxisTicks = d3.min([
                        getMaxTicks(BBox.width),
                        dateSpan(config.start, config.end)
                    ]),
                    xAxis = d3.svg.axis()
                        .scale(x)
                        .orient("bottom")
                        .tickFormat(function(dt) {
                            return moment(dt).format(timeFormats[config.time])
                        })
                        .ticks(xAxisTicks),
                    yAxis = d3.svg.axis()
                        .scale(y)
                        .orient("left")
                        .tickFormat(d3.format("d")),

                    // line charting function
                    line = d3.svg.line()
                        .x(function(d) {
                            return x(parseDate(d.key))
                             })
                        .y(function(d) {
                            return y(d.values);
                        }),

                    // slug function for classing and highlighting
                    sluggify = function(text) {
                        return text.toLowerCase().replace(/\W/g, "_");
                    };

                    // // test output for troubleshooting the data join for this chart type
                    // d3.select(this).append("pre")
                    //     .text(JSON.stringify(data, null, 4))
                    // return;

                    chart.append("g")
                        .classed({
                            "x-axis" : true,
                            "axis" : true
                        })
                        .attr("transform", "translate(0, " + height + ")")
                        .call(xAxis);

                    chart.append("g")
                        .classed({
                            "y-axis" : true,
                            "axis" : true
                        })
                        .attr("transform", "translate(-12, 0)")
                        .call(yAxis);

                    chart.append("g")
                        .classed("timeseries-lines", true)
                        .selectAll("path")
                        .data(data)
                        .enter()
                            .append("path")
                            .attr("data-class", function(d) {
                                return sluggify(d.key);
                            })
                            .attr("class", function(d) {
                                var classes = [
                                    "timeseries-path",
                                    sluggify(d.key)
                                ].join(" ");
                                return classes;
                            })
                            .attr("d", function(d) {
                                return line(d.values);
                            })
                            .attr("stroke", function(d, i) {
                                return colors(d.key);
                            });

                    var pointData = data.map(function(d, di, da) {
                        return d.values.map(function(v, vi, va) {
                            v.facet = d.key;
                            return v;
                        });
                    })
                    pointData = lodash.flatten(pointData);

                    chart.append("g")
                        .classed("timeseries-points", true)
                        .selectAll("g")
                        .data(pointData)
                        .enter()
                            .append("path")
                            .attr("data-class", function(d) {
                                return sluggify(d.facet);
                            })
                            .attr("class", function(d) {
                                var classes = [
                                    "point",
                                    sluggify(d.facet)
                                ].join(" ");
                                return classes;
                            })
                            .attr("fill", function(d, i) {return colors(d.facet); } )
                            .attr("stroke", function(d, i) {return colors(d.facet); } )
                            .attr("stroke-width", 0)
                            .attr("d", d3.svg.symbol().type(function(d) {return symbolScale(d.facet); }).size(25))
                            .attr("transform", function(d) { return "translate(" + x(parseDate(d.key)) + ", " + y(d.values) +")";});

                    return;
            });
        }
    }

    return timeseriesService;
}])
