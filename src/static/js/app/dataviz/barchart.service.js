angular.module('app')
.service('barChartService', ['$q', '$http', 'lodash', function($q, $http, lodash) {
    var barChartService = {};

    var NA_COLOR = "#FAFAFA";
    var HEX_COLORS = [
        "#edf8b1",
        "#A1DAB4",
        "#41B6C4",
        "#2C7FB8",
        "#253494"
    ];

    barChartService.chartQuintiles = function(container, data, config) {
        var timeFormats = {
            "year" : "YYYY",
            "quarter" : "[Q]Q YYYY",
            "month" : "MMM YYYY"
        };

        config.chartFacet = lodash.difference(["structure", "time"], [config.facet])[0]

        var legendData = d3.range(0,5).map(function(b) {
            var brk = [((b * 20)), ((b+1)*20)];

            return brk;
        })
        legendData = [["No Data"]].concat(legendData);

        var yAxisLimit = lodash.chain(data)
            .pluck("values")
            .flatten()
            .pluck("values")
            .max()
            .value();

        // create container for barcharts
        chartContainer = d3.select(container)
            .append("div")
                .classed("barchart-container", true)
            .append("div")
                .classed("barchart-container-internal", true)
                .datum(data);

        // create container for legends
        legendContainer = d3.select(container)
            .append("div")
            .classed({
                "legend-container" : true,
                "barchart-legend-container" : true,
            });

        // chartContainer.append("pre")
            // .text(JSON.stringify([0, yAxisLimit], null, 4));
            // .text(JSON.stringify(data, null, 4));
            // .text(JSON.stringify(config, null, 4));
        // return;

        var barChartDivs = chartContainer.selectAll("div.barchart")
            .data(data)
            .enter()
            .append("div")
                .attr("class", [config.geography, "barchart"].join(" "));

        makebarchart(barChartDivs);

        var legendDiv = legendContainer.selectAll("div.legend")
            .data([legendData])
            .enter()
            .append("div")
                .classed({
                    "legend": true,
                    "barchart-legend": true
                })

        makeLegend(legendDiv);

        /** START SCROLL NOTICE **/
        // if we are under a certain pixel size, there will be horizontal scrolling
        // var internalContainerSize = d3.select(container).select("div.barchart-container-internal").node().getBoundingClientRect(),
        //     containerSize = d3.select(container).select("div.barchart-container").node().getBoundingClientRect();

        // // console.log(internalContainerSize.width + " / " + containerSize.width)
        // if (internalContainerSize.width > containerSize.width) {
        //     // console.log("scroll Notice!")
        //     // create scroll notice
        //     var scrollNotice = d3.select(container).select("div.barchart-container").append("div")
        //         .classed("scroll-notice", true)
        //         .append("p");

        //     scrollNotice.append("i")
        //         .classed({
        //             "fa" : true,
        //             "fa-angle-double-down " : true
        //         });

        //     scrollNotice.append("span")
        //         .text("Scroll for more");

        //     scrollNotice.append("i")
        //         .classed({
        //             "fa" : true,
        //             "fa-angle-double-down " : true
        //         });
        // }

        // d3.select(container).selectAll("div.barchart-container").on("scroll", function() {
        //     // if scroll at bottom, hide scroll notice
        //     // using a different class so as not to interfere with the mouseover effects
        //     if ((d3.select(this).node().scrollLeft + d3.select(this).node().offsetWidth) >= (d3.select(this).node().scrollWidth * 0.975)) {
        //         d3.select(container).selectAll("div.scroll-notice")
        //             .classed({
        //                 "hidden" : true
        //             });
        //     } else {
        //         d3.select(container).selectAll("div.scroll-notice")
        //             .classed({
        //                 "hidden" : false
        //             });
        //     }
        // })
        // /** END SCROLL NOTICE **/

        function makeLegend(selection) {
            selection.each(function(data) {
                // sizing and margin vars
                var BBox = this.getBoundingClientRect(),
                    margin = {
                        "top" : BBox.height * 0.18,
                        "right" : BBox.width * 0.1,
                        "bottom" : BBox.height * 0.05,
                        "left" : BBox.width * 0.1
                    },
                    width = BBox.width - (margin.left + margin.right)
                    height = BBox.height - (margin.top + margin.bottom),

                    // containers
                    svg = d3.select(this).append("svg")
                        .attr("height", BBox.height)
                        .attr("width", BBox.width)
                        .attr("font-weight", 300)
                        .attr("font-size", "1rem")
                        .attr("xmlns", "http://www.w3.org/2000/svg")
                        .attr("transform", "translate(0, 0)"),
                    numberFormat = d3.format(",d"),
                    decimalFormat = d3.format(",.2f"),
                    percentFormat = function(v) {
                        return numberFormat(v) + "%"
                    },
                    breaks = data,
                    colors = d3.scale.ordinal()
                        .domain(d3.range(breaks.length))
                        .range([NA_COLOR].concat(HEX_COLORS)),

                    svg.attr("height", d3.max([
                        (19 * (legendData.length) + 40), // 19 px times length of data, plus 20 for Title and 20 padding
                        svg.attr("height")
                    ]));

                    // slug function for classing and highlighting
                    sluggify = function(text) {
                        text = text.toString();
                        if ("0123456789".indexOf(text.slice(0,1)) !== -1) {
                            text = "_"+text;
                        }
                        return text.toLowerCase().replace(/\W/g, "_");
                    };

                    // console.log("legendData")
                    // console.log(legendData)
                    // console.log("jenks.domain()")
                    // console.log(jenks.domain())
                    // console.log("jenks.range()")
                    // console.log(jenks.range())

                var legendTitle = svg.append("text")
                    .text("Legend")
                    .attr("transform", "translate(12, 20)");

                var legendInfo = legendTitle.append("tspan")
                    .attr("dx", 6)
                    .classed({
                        "fa" : true,
                        "legend-info-icon" : true
                    })
                    .text("\uF05A");

                legendInfo.each(function() {
                    new Tooltip({
                        target: this,
                        content: "<p>Quintiles are subsets of data that represent 20% of the given values. The first quintile represents the lowest fifth of the data (1-20%); the second quintile represents the second fifth (21%-40%), and so on.</p> <p>Values within each graphic are grouped with respect to the other values within that graphic alone. For example, if you've selected 2013 and 2014, the quintiles for each year only include data from that year. This allows you to compare which quintile a geographic unit is in over multiple years.</p>",
                        classes: "sots-tooltip"
                    });
                });

                var legend = svg.append("g")
                    .classed("legend", true)
                    .attr("height", height)
                    .attr("width", width)
                    .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

                var legendBoxes = legend.selectAll("rect")
                    .data(legendData)
                    .enter()
                    .append("rect")
                        .attr("stroke-width", "0.5px")
                        .attr("stroke", "#202020")
                        // if using predefined color pallette
                        .attr("fill", function(d, i) {
                            return colors(i);
                        })
                        .attr("height", "16px")
                        .attr("width", "16px")
                        .attr("x", 0)
                        //                                              16 px box + 3px padding
                        .attr("y", function(d, i) { return ((16*i)+(3 * (i-1)))+"px"});

                var legendText = legend.selectAll("text")
                    .data(legendData)
                    .enter()
                    .append("text")
                        .attr("fill", "#4A4A4A")
                        //                                              16 px box + 3px padding
                        //                                              the extra i+1 is to account for baseline height for text
                        .attr("dy", function(d, i) { return 16 * (i + 1) + (3 * (i - 1))})
                        .attr("dx", "18px")
                        .text(function(d, i) {
                            if (i == 0) {
                                return d;
                            }
                            return d.map(function(v){ return percentFormat(v); }).join(" - ");
                        });
            });
        }

        function makebarchart(selection) {
            selection.each(function(data, chartIndex) {

                data.values = lodash.chain(data.values)
                    .sortBy(function(o){
                        return o.values
                    })
                    .reverse()
                    .value();

                // sizing and margin vars
                var BBox = this.getBoundingClientRect(),
                    margin = {
                        "top" : BBox.height * 0.07,
                        "right" : BBox.width * 0.05,
                        "bottom" : BBox.height * 0.15,
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
                    numberFormat = d3.format(",d"),
                    decimalFormat = d3.format(",.2f"),
                    percentFormat = function(v) {
                        return numberFormat(v) + "%"
                    },
                    scaleData = lodash.chain(data.values)
                        .pluck("values")
                        .uniq()
                        .sortBy()
                        .value(),
                    colors = d3.scale.quantile()
                        .domain(scaleData)
                        .range(HEX_COLORS);

                    // x and y scales
                    x = d3.scale.ordinal()
                        .rangeRoundBands([0, width], 0.05, 0)
                        .domain(
                            lodash.pluck(data.values, "key")
                        ),
                    y = d3.scale.linear()
                        .range([height - 3, 0])
                        .domain([0, yAxisLimit])
                        .nice(),

                    yAxis = d3.svg.axis()
                        .scale(y)
                        .orient("left")
                        .tickFormat(d3.format("d"))
                        .ticks(5),

                    // slug function for classing and highlighting
                    sluggify = function(text) {
                        text = text.toString();
                        if ("0123456789".indexOf(text.slice(0,1)) !== -1) {
                            text = "_"+text;
                        }
                        return text.toLowerCase().replace(/\W/g, "_");
                    };

                    chart.append("g")
                        .classed({
                            "y-axis" : true,
                            "axis" : true
                        })
                        .attr("transform", "translate(-12, 0)")
                        .call(yAxis);

                    chart.append("g")
                        .classed("barchart-bars", true)
                        .selectAll("g")
                        .data(data.values)
                        .enter()
                            .append("g")
                            .classed("barchart-bar", true)
                            .attr("transform", function(d) { return "translate(" + x(d.key) + ",0)"; })
                            .append("rect")
                                .attr("fill", function(d) {
                                    if (d.values == null) {
                                        return NA_COLOR;
                                    }
                                    return colors(d.values);
                                })
                                .attr("y", function(d) { return y(d.values)})
                                .attr("height", function(d) {
                                    return height - y(d.values);
                                })
                                .attr("width", x.rangeBand())
                                .attr("data-geography", function(d) {
                                    return sluggify(d.key);
                                })
                                .attr("class", function(d) {
                                    var classes = [
                                        "barchart-path",
                                        "hover",
                                        sluggify(d.key)
                                    ].join(" ");
                                    return classes;
                                })

                    // chart.append("g")
                    //     .classed("barchart-labels", true)
                    //     .selectAll("g")
                    //     .data(data.values)
                    //     .enter()
                    //         .append("g")
                    //         .classed("barchart-label", true)
                    //         .append("text")
                    //             .attr("data-geography", function(d) {
                    //                 return sluggify(d.key);
                    //             })
                    //             .attr("class", function(d) {
                    //                 var classes = [
                    //                     "barchart-label",
                    //                     sluggify(d.key)
                    //                 ].join(" ");
                    //                 return classes;
                    //             })
                    //             .text(function(d) {
                    //                 return d.key;
                    //             })

                    // Put year under barchart
                    var facetLabel = svg.append("g")
                        .attr("transform", "translate(" + (margin.left + (width / 2)) + ", " + (svg.attr("height")) + ")")
                        .append("text")
                            .attr("text-anchor", "middle")
                            .text(function() {
                                if (config.chartFacet == "time") {
                                    data.key = moment(data.key, timeFormats[config.time]).format(timeFormats[config.time]);
                                }
                                return data.key
                            });

                    return;
            });
        }
    }

    barChartService.chartCKMeans = function(container, data, config) {
        var timeFormats = {
            "year" : "YYYY",
            "quarter" : "[Q]Q YYYY",
            "month" : "MMM YYYY"
        };

        config.chartFacet = lodash.difference(["structure", "time"], [config.facet])[0]

        var scaleData = lodash.chain(data)
            .pluck("values")
            .flatten()
            .pluck("values")
            .uniq()
            .sortBy()
            .value()
            .filter(function(d) { return d > 0; }),
        scaleBreaks = ss.ckmeans(
                scaleData,
                d3.min([5, scaleData.length])
            ).map(function(cluster) { return d3.extent(cluster); });

        data.forEach(function(o, oi, oa) {
            data[oi].breaks = scaleBreaks;
        });

        var yAxisLimit = lodash.chain(data)
            .pluck("values")
            .flatten()
            .pluck("values")
            .max()
            .value();

        // create container for barcharts
        chartContainer = d3.select(container)
            .append("div")
                .classed("barchart-container", true)
            .append("div")
                .classed("barchart-container-internal", true)
                .datum(data);

        // create container for legends
        legendContainer = d3.select(container)
            .append("div")
            .classed({
                "legend-container" : true,
                "barchart-legend-container" : true,
            });

        // chartContainer.append("pre")
            // .text(JSON.stringify([0, yAxisLimit], null, 4));
            // .text(JSON.stringify(data, null, 4));
            // .text(JSON.stringify(config, null, 4));
        // return;

        var barChartDivs = chartContainer.selectAll("div.barchart")
            .data(data)
            .enter()
            .append("div")
                .attr("class", [config.geography, "barchart"].join(" "));

        makebarchart(barChartDivs);

        var legendDiv = legendContainer.selectAll("div.legend")
            .data([scaleBreaks])
            .enter()
            .append("div")
                .classed({
                    "legend": true,
                    "barchart-legend": true
                })

        makeLegend(legendDiv);

        /** START SCROLL NOTICE **/
        // if we are under a certain pixel size, there will be horizontal scrolling
        // var internalContainerSize = d3.select(container).select("div.barchart-container-internal").node().getBoundingClientRect(),
        //     containerSize = d3.select(container).select("div.barchart-container").node().getBoundingClientRect();

        // // console.log(internalContainerSize.width + " / " + containerSize.width)
        // if (internalContainerSize.width > containerSize.width) {
        //     // console.log("scroll Notice!")
        //     // create scroll notice
        //     var scrollNotice = d3.select(container).select("div.barchart-container").append("div")
        //         .classed("scroll-notice", true)
        //         .append("p");

        //     scrollNotice.append("i")
        //         .classed({
        //             "fa" : true,
        //             "fa-angle-double-down " : true
        //         });

        //     scrollNotice.append("span")
        //         .text("Scroll for more");

        //     scrollNotice.append("i")
        //         .classed({
        //             "fa" : true,
        //             "fa-angle-double-down " : true
        //         });
        // }

        // d3.select(container).selectAll("div.barchart-container").on("scroll", function() {
        //     // if scroll at bottom, hide scroll notice
        //     // using a different class so as not to interfere with the mouseover effects
        //     if ((d3.select(this).node().scrollLeft + d3.select(this).node().offsetWidth) >= (d3.select(this).node().scrollWidth * 0.975)) {
        //         d3.select(container).selectAll("div.scroll-notice")
        //             .classed({
        //                 "hidden" : true
        //             });
        //     } else {
        //         d3.select(container).selectAll("div.scroll-notice")
        //             .classed({
        //                 "hidden" : false
        //             });
        //     }
        // })
        // /** END SCROLL NOTICE **/

        function makeLegend(selection) {
            selection.each(function(data) {
                // sizing and margin vars
                var BBox = this.getBoundingClientRect(),
                    margin = {
                        "top" : BBox.height * 0.15,
                        "right" : BBox.width * 0.1,
                        "bottom" : BBox.height * 0.05,
                        "left" : BBox.width * 0.1
                    },
                    width = BBox.width - (margin.left + margin.right)
                    height = BBox.height - (margin.top + margin.bottom),

                    // containers
                    svg = d3.select(this).append("svg")
                        .attr("height", BBox.height)
                        .attr("width", BBox.width)
                        .attr("font-weight", 300)
                        .attr("font-size", "1rem")
                        .attr("xmlns", "http://www.w3.org/2000/svg")
                        .attr("transform", "translate(0, 0)"),
                    numberFormat = d3.format(",d"),
                    decimalFormat = d3.format(",.2f"),
                    percentFormat = function(v) {
                        return numberFormat(v) + "%"
                    },
                    breaks = data,
                    colors = d3.scale.ordinal()
                        // .domain(d3.range(breaks.length))
                        .range(HEX_COLORS),
                    jenks = d3.scale.threshold()
                        .domain(breaks.map(function(cluster) {return cluster[0];}))
                        .range([NA_COLOR].concat(d3.range(breaks.length).map(function(i) { return colors(i); }))),

                    legendData = jenks.range().map(function(color, index) {
                        if (index === 0) {
                            return []
                        } else {
                            return breaks[index-1];
                        }
                    });

                    svg.attr("height", d3.max([
                        (19 * (legendData.length) + 40), // 19 px times length of data, plus 20 for Title and 20 padding
                        svg.attr("height")
                    ]));

                    // slug function for classing and highlighting
                    sluggify = function(text) {
                        text = text.toString();
                        if ("0123456789".indexOf(text.slice(0,1)) !== -1) {
                            text = "_"+text;
                        }
                        return text.toLowerCase().replace(/\W/g, "_");
                    };

                    // console.log("legendData")
                    // console.log(legendData)
                    // console.log("jenks.domain()")
                    // console.log(jenks.domain())
                    // console.log("jenks.range()")
                    // console.log(jenks.range())

                var legendTitle = svg.append("text")
                    .text("Legend")
                    .attr("transform", "translate(12, 20)");

                var legend = svg.append("g")
                    .classed("legend", true)
                    .attr("height", height)
                    .attr("width", width)
                    .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

                var legendBoxes = legend.selectAll("rect")
                    .data(legendData)
                    .enter()
                    .append("rect")
                        .attr("stroke-width", "0.5px")
                        .attr("stroke", "#202020")
                        // if using predefined color pallette
                        .attr("fill", function(d, i) {
                            return d.length > 0 ? jenks(d[0]) : jenks(-1);
                        })
                        .attr("height", "16px")
                        .attr("width", "16px")
                        .attr("x", 0)
                        //                                              16 px box + 3px padding
                        .attr("y", function(d, i) { return ((16*i)+(3 * (i-1)))+"px"});

                var legendText = legend.selectAll("text")
                    .data(legendData)
                    .enter()
                    .append("text")
                        .attr("fill", "#4A4A4A")
                        //                                              16 px box + 3px padding
                        //                                              the extra i+1 is to account for baseline height for text
                        .attr("dy", function(d, i) { return 16 * (i + 1) + (3 * (i - 1))})
                        .attr("dx", "18px")
                        .text(function(d, i) {
                            if (d.length === 0) {
                                return "0"
                            } else if (d[0] === d[1]) {
                                return numberFormat(d[0]);
                            } else {
                                return d.map(function(v) { return numberFormat(v); }).join(" - ");
                            }
                        });
            });
        }

        function makebarchart(selection) {
            selection.each(function(data, chartIndex) {

                data.values = lodash.chain(data.values)
                    .sortBy(function(o){
                        return o.values
                    })
                    .reverse()
                    .value();

                // sizing and margin vars
                var BBox = this.getBoundingClientRect(),
                    margin = {
                        "top" : BBox.height * 0.07,
                        "right" : BBox.width * 0.05,
                        "bottom" : BBox.height * 0.15,
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
                    breaks = data.breaks,
                    colors = d3.scale.ordinal()
                        .range(HEX_COLORS),
                    jenks = d3.scale.threshold()
                        .domain(breaks.map(function(cluster) {return cluster[0];}))
                        .range(["#FAFAFA"].concat(d3.range(breaks.length).map(function(i) { return colors(i); })));

                    // x and y scales
                    x = d3.scale.ordinal()
                        .rangeRoundBands([0, width], 0.05, 0)
                        .domain(
                            lodash.pluck(data.values, "key")
                        ),
                    y = d3.scale.linear()
                        .range([height - 3, 0])
                        .domain([0, yAxisLimit])
                        .nice(),

                    yAxis = d3.svg.axis()
                        .scale(y)
                        .orient("left")
                        .tickFormat(d3.format("d"))
                        .ticks(5),

                    // slug function for classing and highlighting
                    sluggify = function(text) {
                        text = text.toString();
                        if ("0123456789".indexOf(text.slice(0,1)) !== -1) {
                            text = "_"+text;
                        }
                        return text.toLowerCase().replace(/\W/g, "_");
                    };

                    chart.append("g")
                        .classed({
                            "y-axis" : true,
                            "axis" : true
                        })
                        .attr("transform", "translate(-12, 0)")
                        .call(yAxis);

                    chart.append("g")
                        .classed("barchart-bars", true)
                        .selectAll("g")
                        .data(data.values)
                        .enter()
                            .append("g")
                            .classed("barchart-bar", true)
                            .attr("transform", function(d) { return "translate(" + x(d.key) + ",0)"; })
                            .append("rect")
                                .attr("fill", function(d) {
                                    return jenks(d.values || null);
                                })
                                .attr("y", function(d) { return y(d.values)})
                                .attr("height", function(d) {
                                    return height - y(d.values);
                                })
                                .attr("width", x.rangeBand())
                                .attr("data-geography", function(d) {
                                    return sluggify(d.key);
                                })
                                .attr("class", function(d) {
                                    var classes = [
                                        "barchart-path",
                                        "hover",
                                        sluggify(d.key)
                                    ].join(" ");
                                    return classes;
                                })

                    // chart.append("g")
                    //     .classed("barchart-labels", true)
                    //     .selectAll("g")
                    //     .data(data.values)
                    //     .enter()
                    //         .append("g")
                    //         .classed("barchart-label", true)
                    //         .append("text")
                    //             .attr("data-geography", function(d) {
                    //                 return sluggify(d.key);
                    //             })
                    //             .attr("class", function(d) {
                    //                 var classes = [
                    //                     "barchart-label",
                    //                     sluggify(d.key)
                    //                 ].join(" ");
                    //                 return classes;
                    //             })
                    //             .text(function(d) {
                    //                 return d.key;
                    //             })

                    // Put year under barchart
                    var facetLabel = svg.append("g")
                        .attr("transform", "translate(" + (margin.left + (width / 2)) + ", " + (svg.attr("height")) + ")")
                        .append("text")
                            .attr("text-anchor", "middle")
                            .text(function() {
                                if (config.chartFacet == "time") {
                                    data.key = moment(data.key, timeFormats[config.time]).format(timeFormats[config.time]);
                                }
                                return data.key
                            });

                    return;
            });
        }
    }

    return barChartService;
}])
