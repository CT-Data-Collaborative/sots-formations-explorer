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


                // populate thead -> tr -> th
                // the second
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
