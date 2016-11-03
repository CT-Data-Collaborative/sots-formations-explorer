angular.module('app')
.service('towntableService', ['$q', '$http', 'lodash', function($q, $http, lodash) {
    var towntableService = {};

    towntableService.chart = function(container, data, config) {
        // because container is not redrawn with change in data selections.
        d3.select(container).selectAll("*").remove()

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
            "structure" : function(a, b) {
                return structureOrder.indexOf(a) - structureOrder.indexOf(b);
            },
            "geography" : function(a, b) {
                return -1;
            }
        }

        var formatters = {
            "numberFormat": d3.format(",.0f"),
            // "percentFormat": d3.format(",.2%"),
            "diffFormat": d3.format("+,.1%"),
            "noFormat": function(v) { return v; }
        };

        // using provided facet, create name for column used later in table
        // var firstCol = "Indicator" // or some other name?
        var firstCol = ""; // or blank?

        // cols - Town Names
        var tableCols = lodash.chain(data)
            .pluck("town")
            .flatten()
            .uniq()
            .value();

        tableCols.unshift(firstCol);


        // Reprocess data into relevant factoids, sums, annualized data, etc.
        wideData = lodash.chain(data)
            .map(function(d) {
                var sum = lodash.chain(d.values)
                        .map(function(val) { return val.values; })
                        .reduce(function(total, val) { return total + val; })
                        .value(),
                    timeUnits = d.values.length/*,
                    endVal = d.values[timeUnits-1].values,
                    startVal = d.values[0].values,
                    compoundRate = Math.pow((endVal/startVal), (1/(timeUnits-1))) - 1*/;

                return [
                    {
                        "key" : d.key,
                        "town" : d.town,
                        "type" : d.type,
                        "indicator" : ["Total", d.type].join(" "),
                        "values" : sum,
                        "format" : "numberFormat"
                    },{
                        "key" : d.key,
                        "town" : d.town,
                        "type" : d.type,
                        "indicator" : ["Avg.", config.time].join("/"),
                        "values" : sum/timeUnits,
                        "format" : "numberFormat"
                    }/*,{
                        "key" : d.key,
                        "town" : d.town,
                        "type" : d.type,
                        "indicator" : ["Compound Growth Rate by", config.time].join(" "),
                        "values" : ((startVal === 0 || sum === 0) ? "NA" : compoundRate),
                        "format" : ((startVal === 0 || sum === 0) ? "noFormat" : "percentFormat")
                    }*/
                ]
            })
            .flatten()
            .value()

        wideData = d3.nest()
            .key(function(d) {
                return d.type;
            })
            .key(function(d) {
                return d.indicator;
            })
            .entries(wideData)

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

        function makeTable(selection) {
            selection.each(function(data, index) {
                var table = d3.select(this).append("table")
                    .classed({
                        "ctdata-table" : true,
                        "ctdata-table-wide" : true
                    }),
                    thead = table.append("thead"),
                    tbody = table.append("tbody"),
                    tfoot = table.append("tfoot"),

                    // slugging function for data attr
                    sluggify = function(text)  {
                        return text.toLowerCase().replace(/\W/g, "_");
                    };

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
                    // return;

                data.forEach(function(d, di, da) {
                    d.values.forEach(function(v, vi, va) {
                        var rowClasses = [
                            (di%2 != 1 ? "color-1" : "color-2"),
                            sluggify(d.key)
                        ].join(" ");

                        tbody.append("tr")
                            .attr("class", rowClasses)
                            .attr("data-type", sluggify(d.key))
                            .datum(v)
                    })
                })

                tbody.selectAll("tr").each(function(rowData, i) {
                    rowData = [{
                        "values" : rowData.key,
                        "format" : "noFormat"
                    }].concat(rowData.values);
                    
                    // console.log(rowData);
                    var current = null;

                    var rowCells = d3.select(this)
                        .selectAll("td")
                        .data(rowData)
                        .enter()
                            .append("td")
                            .attr("class", function(d, i) {
                                if (i === 0) {
                                    return "name";
                                } else {
                                    return "value";
                                }
                            })
                            .attr("data-town", function(d, i) {
                                if (i > 0) {
                                    return sluggify(d.town);
                                } else {
                                    return null;
                                }
                            })
                            .attr("data-title", function(d, i) {
                                if (i > 0) {
                                    return d.town;
                                } else {
                                    return null;
                                }
                            })
                            .attr("data-type", function(d, i) {
                                if (i > 0) {
                                    return sluggify(d.type);
                                } else {
                                    return null;
                                }
                            })
                            .html(function(d, i) {
                                if (i == 1) { // values for 'my town'
                                    current = d.values;
                                    return formatters[d.format](d.values);
                                } else if (i > 1 && current !== 0 && d.values !== 0 && d.values != "NA" && current != "NA") {
                                    var diff = ((d.values/current) - 1);
                                    if (diff !== -1 && diff !== 0) {
                                        var diffClass = (diff < 0 ? "less" : "more");
                                        diff = "<span class=\"diff " + diffClass + "\">("+formatters["diffFormat"](diff)+")</span>";
                                    } else {
                                        diff = "";
                                    }
                                    return formatters[d.format](d.values) + diff
                                }
                                return formatters[d.format](d.values);
                            })
                })

                return;
            });
        };
    }

    return towntableService;
}])
