angular.module('app')
.service('tableService', ['$q', '$http', 'lodash', function($q, $http, lodash) {
    var tableService = {};

    tableService.chart = function(container, data, config) {

        var timeFormats = {
            "year" : "YYYY",
            "quarter" : "[Q]Q YYYY",
            "month" : "MMM YYYY"
        };

        var structureOrder = [
            "All Business Entities",
            "LLC (CT)",
            "LLC (Non-CT)",
            "Stock Corporation (CT)",
            "Stock Corporation (Non-CT)",
            "Nonstock Corporation (CT)",
            "Nonstock Corporation (Non-CT)",
            "LP (CT)",
            "LP (Non-CT)",
            "Statutory Trust (CT)",
            "Statutory Trust (Non-CT)",
            "General Partnership",
            "Other",
            "Benefit Corp."
        ];

        var sortFunctions = {
            "time" : function(a, b) {
                return moment(a, timeFormats[config.time]).diff(moment(b, timeFormats[config.time]));
            },
            "structure" : function(a, b) {
                return structureOrder.indexOf(a) - structureOrder.indexOf(b);
            },
            "geography" : function(a, b) {
                return (a > b ? 1 : -1);
            },
            "value" : function(a, b) {
                // console.log(a)
                // console.log(b)
                return (a > b ? 1 : -1);
            }
        }

        var numberFormat = d3.format(",d");

        // using provided facet, create name for column used later in table
        // config.facetName = {"structure" : "Structure", "time" : lodash.capitalize(config.time)}[config.facet]

        // config.facet = lodash.difference(["structure", "time"], [config.facet])[0]

        var firstCol = (config.facet == "geography" ? "Time" : "Geography");

        // cols
        var tableCols = lodash.chain(data)
            .pluck("key")
            .value()
            .sort(function(a, b) {
                if (config.facet == "structure") {
                    return sortFunctions["time"](a, b);
                } else  {
                    return sortFunctions["structure"](a, b);
                }
            });
        tableCols.unshift(firstCol)

        var wideData = {};
        lodash.chain(lodash.merge({}, data))
            .map(function(d) {
                d.values = lodash.chain(d.values)
                    .map(function(v) {
                        o = {}

                        o[v.key] = {}
                        o[v.key][d.key] = v.values;

                        return o;
                    })
                    .value()

                return d.values;
            })
            .flatten()
            .value()
            .forEach(function(o, oi, oa) {
                if (lodash.keys(o)[0] in wideData) {
                    lodash.assign(wideData[lodash.keys(o)[0]], o[lodash.keys(o)[0]]);
                } else {
                    wideData[lodash.keys(o)[0]] = o[lodash.keys(o)[0]];
                }
            })

        // d3.select(container).append("pre")
            // .text(JSON.stringify(data, null, 4));
            // .text(JSON.stringify(wideData, null, 4));
            // .text(JSON.stringify(config, null, 4));
            // .text(JSON.stringify(tableCols, null, 4));
        // return;

        // create container for table
        tableContainer = d3.select(container)
            .append("div")
            .classed({
                "table-container" : true,
                "chart-datatable" : true
            })
            .append("div")
                .classed("table-container-inner", true)
                .datum(wideData);

        makeTable(tableContainer);

        /*// // if we are under a certain pixel size, there will be horizontal scrolling
        var internalContainerSize = d3.select(container).select("div.table-container-internal").node().getBoundingClientRect(),
            containerSize = d3.select(container).select("div.table-container").node().getBoundingClientRect();

        // console.log(internalContainerSize.height + " / " + containerSize.height)

        if (internalContainerSize.height > containerSize.height) {
            // create scroll notice
            var scrollNotice = d3.select(container).select("div.table-container")
                .append("div")
                .classed("scroll-notice", true)
                    .append("p");

            scrollNotice.append("i")
                .classed({
                    "fa" : true,
                    "fa-angle-double-down " : true
                });

            scrollNotice.append("span")
                .text("Scroll down for more");

            scrollNotice.append("i")
                .classed({
                    "fa" : true,
                    "fa-angle-double-down " : true
                });
        }*/

        // var tableHeight = tableContainer.select("div.table").node().getBoundingClientRect().height;
        // d3.select(container).selectAll("div.table-container").on("scroll", function() {
        //     // if scroll at bottom, hide scroll notice
        //     // using a different class so as not to interfere with the mouseover effects
        //     if ((d3.select(this).node().scrollTop + d3.select(this).node().offsetHeight) >= (d3.select(this).node().scrollHeight - (tableHeight/2))) {
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

        // add hover effects - use classes "highlight" and "lowlight"
        // d3.select(container).selectAll("table > tbody > tr")
        // .on("mouseover", function() {
        //     var classToHighlight = d3.select(this).attr("data-geography"),

        //         highlightElements = d3.select(container)
        //             .selectAll("g.mapgroup." + classToHighlight + " > path.mappath, g.mapgroup." + classToHighlight + " > text.mapinfo, table.ctdata-table > tbody > tr." + classToHighlight),
        //         lowlightElements = d3.select(container)
        //             .selectAll("g.mapgroup:not(." + classToHighlight + ") > path.mappath, g.mapgroup:not(." + classToHighlight + ") > text.mapinfo, table.ctdata-table > tbody > tr:not(." + classToHighlight + ")");

        //     // lowlight appropriate elements
        //     lowlightElements.classed({
        //         "lowlight" : true,
        //         "highlight" : false
        //     });

        //     // highlight appropriate elements
        //     highlightElements.classed({
        //         "lowlight" : false,
        //         "highlight" : true
        //     });
            
        // })
        // .on("mouseout", function() {
        //     var allElements = d3.select(container)
        //         .selectAll("g.mapgroup > path.mappath, g.mapgroup > text.mapinfo, div.scroll-notice, table.ctdata-table > tbody > tr");

        //     // remove all highlight/lowlight classes
        //     allElements.classed({
        //         "lowlight" : false,
        //         "highlight" : false
        //     });
        // });

        function makeTable(selection) {
            selection.each(function(data, index) {
                console.log("table.service.js being called")
                var table = d3.select(this).append("table")
                    .classed({
                        "ctdata-table" : true
                    }),
                    thead = table.append("thead"),
                    tbody = table.append("tbody"),
                    tfoot = table.append("tfoot"),

                    // slugging function for data attr
                    sluggify = function(text) {
                        text = text.toString();
                        if ("0123456789".indexOf(text.slice(0,1)) !== -1) {
                            text = "_"+text;
                        }
                        return text.toLowerCase().replace(/\W/g, "_");
                    };


                data = lodash.chain(data)
                    .pairs()
                    .map(function(o, i) {
                        o[1] = lodash.chain(o[1])
                            .pairs()
                            .sort(function(a, b) {
                                // sort based on config.facet
                                if (config.facet == "structure") {
                                    return sortFunctions["time"](a[0], b[0]);
                                } else  {
                                    return sortFunctions["structure"](a[0], b[0]);
                                }
                            })
                            .value()

                        // console.log(o[1])
                        return o;
                    })
                    .sort(function(a, b) {
                        // sort based on config.facet
                        if (config.facet == "structure") {
                            return sortFunctions["value"](b[1][b[1].length-1][1], a[1][b[1].length-1][1]);
                        } else  {
                            return sortFunctions["geography"](a[0], b[0]);
                        }
                    })
                    .value()

                // console.log(data)

                // d3.select(this).append("pre")
                //     .text(JSON.stringify(data, null, 4));
                // return;

                // populate thead -> tr -> th
                thead.append("tr")
                    .selectAll("th")
                    .data(tableCols)
                    .enter()
                    .append("th")
                        .text(function(d){ return d; })
                        .classed({"col-name" : true})
                        .append("div")
                        .append("span")
                            .text(function(d){ return d; })

                // populate tbody -> tr -> th
                tbodyRows = tbody.selectAll("tr")
                    .data(data)
                    .enter()
                    .append("tr")
                    .attr("data-geography", function(d) { return sluggify(d[0]); })
                    .attr("class", function(d) {
                            return [
                                sluggify(d[0]),
                                "hover"
                            ].join(" ");
                    })
                    .datum(function(d) {
                        return d;
                    });

                tbodyRows.each(function(rowData) {
                    // rowDataValues = [[firstCol, rowData.shift()]]
                    // rowDataValues = rowDataValues.concat(
                    //     lodash.chain(rowData.shift())
                    //         .pairs()
                    //         .sort(function(a, b) {
                    //             if (config.facet == "structure") {
                    //                 return sortFunctions["time"](a[0], b[0]);
                    //             } else  {
                    //                 return sortFunctions["structure"](a[0], b[0]);
                    //             }
                    //         })
                    //         .value()
                    //     )

                    rowData[1].unshift([firstCol, rowData[0]])

                    d3.select(this).selectAll("td")
                        .data(rowData[1])
                        .enter()
                        .append("td")
                            .attr("data-title", function(d) {
                                return d[0];
                            })
                            .text(function(d, i) {
                                if (i > 0) {
                                    return numberFormat(d[1])
                                } else {
                                    return d[1];
                                }
                            })
                            .attr("class", function(d, i) {
                                if (i === 0) {
                                    return "name"
                                } else {
                                    return "value"
                                }
                            })
                })
            });
        };
    }

    return tableService;
}])
