angular.module('app')
.service('dataProcessor', ['$q', '$http', 'lodash', function($q, $http, lodash) {
    var dataProcessor = {
        data : null
    };

    dataProcessor.processMyTown = function(SOURCE_DATA, SOURCE_CONFIG) {

        console.log("Processor parsing data - MyTown!")
        // console.log(SOURCE_CONFIG);
        // return SOURCE_DATA;

        var config = lodash.merge({}, SOURCE_CONFIG);

        config.towns = lodash.chain(config.towns)
            .values()
            .flatten()
            .map(function(o) {
                return o.name;
            })
            .value();

        config.structures = lodash.chain(config.structures)
            .map(function(o) {
                return o.value;
            })
            .value();

        var timeFormats = {
            "year" : "YYYY",
            "quarter" : "[Q]Q YYYY"
        };
        var timeIntervals = {
            "year" : {years : 1},
            "quarter" : {months : 3}
        };
        const DATA_START = moment("1980-01-01", "YYYY-MM-DD"),
            DATA_END = moment("2015-12-31", "YYYY-MM-DD");
        
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

        // i know i know, there's no better way to do this
        const MONTHS = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec"
        ];

        // augment configs so they can just be fed into the following code as-is
        // time
        if ("time" in config && ["year", "quarter"].indexOf(config.time.toLowerCase() !== -1)) {
            config.time = lodash.startCase(config.time.toLowerCase());
        } else {
            config.time == "Year";
        }

        config.start = config.start[0].value
        // start
        if (
            "start" in config // Parameter exists
            && (moment(config.start, timeFormats[config.time.toLowerCase()]).isAfter(DATA_START) || moment(config.start, timeFormats[config.time.toLowerCase()]).isSame(DATA_START)) // and parameter is after start of data
            && (moment(config.start, timeFormats[config.time.toLowerCase()]).isBefore(DATA_END) || moment(config.start, timeFormats[config.time.toLowerCase()]).isSame(DATA_END)) // and parameter is before end of data
        ) {
            // do nothing, this input is fine
        } else {
            // else default to end of data minus one of whatever time unit is selected
            config.start = DATA_END.subtract(timeIntervals[config.time.toLowerCase()]).format(timeFormats[config.time.toLowerCase()]);
            SOURCE_CONFIG.start = config.start;
        }

        config.end = config.end[0].value
        // end
        if (
            "end" in config  // Parameter exists
            && (moment(config.end, timeFormats[config.time.toLowerCase()]).isAfter(DATA_START) || moment(config.end, timeFormats[config.time.toLowerCase()]).isSame(DATA_START)) // and parameter is after start of data
            && (moment(config.end, timeFormats[config.time.toLowerCase()]).isBefore(DATA_END) || moment(config.end, timeFormats[config.time.toLowerCase()]).isSame(DATA_END)) // and parameter is before end of data
        ) {
            // do nothing, this input is fine
        } else {
            // else default to end of data
            config.end = DATA_END.format(timeFormats[config.time.toLowerCase()]);
            SOURCE_CONFIG.end = config.end;
        }
        
        console.log(config)

        var startMoment = moment(config.start, timeFormats[config.time.toLowerCase()]).startOf(config.time),
            endMoment = moment(config.end, timeFormats[config.time.toLowerCase()]).endOf(config.time);
        // filter by Start/end
        filteredData = SOURCE_DATA.filter(function(d) {
            // filter based on date
            return (d.Moment.isBetween(startMoment, endMoment) || d.Moment.isSame(startMoment) || d.Moment.isSame(endMoment))
        });

        // filter by town
        if ("towns" in config && config.towns.length > 0) {
            var filterTowns = lodash.chain(config.towns)
                .filter(function(o) {
                    return null !== o;
                })
                .value()

            filteredData = lodash.chain(filteredData)
                .filter(function(d) {
                    return filterTowns.indexOf(d.Town) !== -1;
                })
                .value()
        }

        var filterStructures = structureOrder;
        // filter by structure
        if ("structures" in config && {} !== config.structures.length) {
            filterStructures = config.structures;

            if (filterStructures.length > 1) {
                filteredData = lodash.chain(filteredData)
                    .filter(function(d) {
                        return filterStructures.indexOf(d.Type) !== -1;
                    })
                    .value()
            }
        }


        // Generate datetime column for aggregation
        // Also generate key - Town+Type for line data
        filteredData = filteredData.map(function(d, di, da) {
            if (config.time == "Year") {
                d.Date = d.Moment.format(timeFormats[config.time.toLowerCase()]);
            } else if (config.time == "Month") {
                d.Date = d.Moment.format(timeFormats[config.time.toLowerCase()]);
            } else if (config.time == "Quarter") {
                var quarter = Math.floor((d.Month - 1) / 3) + 1,
                    quarterMonth = quarter + ((quarter-1) * 2);
                d.Date = d.Moment.format(timeFormats[config.time.toLowerCase()]);
            }
            d.Key = [d.Town, d.Type].join(" - ")
            return d;
        })

        data = d3.nest()
            .key(function(d) {
                return d.Key;
            })
            .key(function(d) {
                return d.Date;
            })
            .rollup(function(leaves) {
                return leaves.reduce(function(total, current, ind, arr){
                    if (current.Value === null) {
                        return total;
                    } else {
                        return total + parseInt(current.Value)
                    }
                }, null);
            })
            .entries(filteredData);

        // used in the following backfilling
        var sortingFunctions = {
            "Date" : function(a, b) { return moment(a, timeFormats[config.time.toLowerCase()]).diff(moment(b, timeFormats[config.time.toLowerCase()])); },
            "Town" : function(a, b) { return config.towns.indexOf(a) - config.towns.indexOf(b); } // base town sorting off of the order in which towns were passed in - `My Town` should always be first
        };

        // back fill so there are no gaps in data
        // first level agg - `Town` - `Type`
        // second level agg - `Date`
        var allKeys = lodash.chain(config.towns)
            .map(function(t) {
                return lodash.chain(filterStructures)
                    .map(function(s) {
                        return [t, s].join(" - ");
                    })
                    .value()
            })
            .flattenDeep()
            .value();

        var allDates = [],
            current = moment(config.end, timeFormats[config.time.toLowerCase()]);
        while (
            current.isAfter(moment(config.start, timeFormats[config.time.toLowerCase()]))
            || current.isSame(moment(config.start, timeFormats[config.time.toLowerCase()]))
        ) {
            allDates.push(current.format(timeFormats[config.time.toLowerCase()]));
            current.subtract(timeIntervals[config.time.toLowerCase()])
        };

        data = allKeys.map(function(key, keyI, keyA) {
            var keyParts = key.split(" - "),
                town = keyParts[0],
                type = keyParts[1];
            return {
                "key" : key,
                "town" : town,
                "type" : type,
                "config" : config,
                "values" : allDates.map(function(date, dateI, dateA) {
                    var dataFind = lodash.chain(data).find({"key" : key}).value();
                    if (typeof dataFind == "undefined") {
                        return {"key" : date, "values" : 0};
                    }
                    dataFind = lodash.chain(dataFind.values).find({"key" : date}).value();
                    if (typeof dataFind == "undefined") {
                        return {"key" : date, "values" : 0};
                    }
                    return dataFind;
                })
            };
        });

        return data;
        
    }

    dataProcessor.processIndex = function(SOURCE_DATA, SOURCE_CONFIG) {
        console.log("Processor parsing data!")
        // console.log(SOURCE_CONFIG);
        // return SOURCE_DATA;

        config = lodash.merge({}, SOURCE_CONFIG);

        config.structures = lodash.chain(config.structures)
            .map(function(o) {
                return o.value;
            })
            .value();

        var timeFormats = {
            "year" : "YYYY",
            "quarter" : "[Q]Q YYYY",
            "month" : "MMM YYYY"
        };
        var timeIntervals = {
            "year" : {years : 1},
            "quarter" : {months : 3},
            "month" : {months : 1}
        };
        const DATA_START = moment("1980-01-01", "YYYY-MM-DD"),
            DATA_END = moment("2015-12-31", "YYYY-MM-DD");
        
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

        // i know i know, there's no better way to do this
        const MONTHS = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec"
        ];

        // augment configs so they can just be fed into the following code as-is
        // time
        if ("time" in config && ["year", "quarter", "month"].indexOf(config.time.toLowerCase() !== -1)) {
            config.time = lodash.startCase(config.time.toLowerCase());
        } else {
            config.time == "Year";
        }

        config.start = config.start[0].value;
        // start
        if (
            "start" in config // Parameter exists
            && (moment(config.start, timeFormats[config.time.toLowerCase()]).isAfter(DATA_START) || moment(config.start, timeFormats[config.time.toLowerCase()]).isSame(DATA_START)) // and parameter is after start of data
            && (moment(config.start, timeFormats[config.time.toLowerCase()]).isBefore(DATA_END) || moment(config.start, timeFormats[config.time.toLowerCase()]).isSame(DATA_END)) // and parameter is before end of data
        ) {
            // do nothing, this input is fine
        } else {
            // else default to end of data minus one of whatever time unit is selected
            config.start = DATA_END.subtract(timeIntervals[config.time.toLowerCase()]).format(timeFormats[config.time.toLowerCase()]);
            SOURCE_CONFIG.start = config.start;
        }

        config.end = config.end[0].value;
        // end
        if (
            "end" in config  // Parameter exists
            && (moment(config.end, timeFormats[config.time.toLowerCase()]).isAfter(DATA_START) || moment(config.end, timeFormats[config.time.toLowerCase()]).isSame(DATA_START)) // and parameter is after start of data
            && (moment(config.end, timeFormats[config.time.toLowerCase()]).isBefore(DATA_END) || moment(config.end, timeFormats[config.time.toLowerCase()]).isSame(DATA_END)) // and parameter is before end of data
        ) {
            // do nothing, this input is fine
        } else {
            // else default to end of data
            config.end = DATA_END.format(timeFormats[config.time.toLowerCase()]);
            SOURCE_CONFIG.end = config.end;
        }
        
        // chart type
        if ("type" in config && ["map", "line"].indexOf(config.type) !== -1) {
            // do nothing, this is fine
        } else {
            config.type == "map";
        }

        // geography column - also based on chart type
        if ("geography" in config && ["county", "town", "council of government"].indexOf(config.geography) !== -1) {
            config.geography = lodash.startCase(config.geography);
        } else {
            config.geography = "Town"
        }

        // used for backfilling later.
        var allGeos = lodash.chain(SOURCE_DATA)
            .pluck(config.geography)
            .uniq()
            .value()

        // facets - based also on type of chart.
        if ("facet" in config && ["structure", "time", "geography"].indexOf(config.facet.toLowerCase()) !== -1) {
            switch(config.facet) {
                case "time" :
                    config.facet = ["Date", "Type", config.geography];
                    break;
                case "geography" :
                    config.facet = [config.geography, "Type", "Date"];
                    break;
                case "structure" :
                default :
                    config.facet = (
                        ["map", "bar"].indexOf(config.type.toLowerCase()) !== -1 ?
                        ["Type", "Date", config.geography] :
                        ["Type", config.geography, "Date"]
                    );
                    break;
            }
        } else {
            config.facet = (
                ["map", "bar"].indexOf(config.type.toLowerCase()) !== -1 ?
                ["Type", "Date", config.geography] :
                ["Type", config.geography, "Date"]
            );
        }

        console.log(config)

        var startMoment = moment(config.start, timeFormats[config.time.toLowerCase()]).startOf(config.time),
            endMoment = moment(config.end, timeFormats[config.time.toLowerCase()]).endOf(config.time);
        // filter by Start/end
        filteredData = SOURCE_DATA.filter(function(d) {
            // filter based on date
            return (d.Moment.isBetween(startMoment, endMoment) || d.Moment.isSame(startMoment) || d.Moment.isSame(endMoment))
        });

        var filterStructures = structureOrder;
        // filter by structure
        if ("structures" in config && {} !== config.structures) {
            filterStructures = config.structures;

            if (filterStructures.length >= 1) {
                filteredData = lodash.chain(filteredData)
                    .filter(function(d) {
                        return filterStructures.indexOf(d.Type) !== -1;
                    })
                    .value()
            }
        }

        // Generate datetime column for aggregation
        filteredData = filteredData.map(function(d, di, da) {
            if (config.time == "Year") {
                d.Date = d.Moment.format(timeFormats[config.time.toLowerCase()]);
            } else if (config.time == "Month") {
                d.Date = d.Moment.format(timeFormats[config.time.toLowerCase()]);
            } else if (config.time == "Quarter") {
                var quarter = Math.floor((d.Month - 1) / 3) + 1,
                    quarterMonth = quarter + ((quarter-1) * 2);
                d.Date = d.Moment.format(timeFormats[config.time.toLowerCase()]);
            }
            return d;
        })

        // begin nesting data
        data = d3.nest();

        // apply keys for facets
        // either (Type, Time) or (Time, Type) appropriately
        config.facet.forEach(function(facet, fi, fa) {
            data.key(function(d) {
                return d[facet];
            });
            // .sortKeys(sortingFunctions[facet]);
        });

        // apply geography key
        // data.key(function(d) { return d[config.geography]; });

        // apply  rollup
        data.rollup(function(leaves) {
            return leaves.reduce(function(total, current, ind, arr){
                if (current.Value === null) {
                    return total;
                } else {
                    return total + parseInt(current.Value)
                }
            }, null);
        });

        // finally, map data
        data = data.entries(filteredData);

        // used in the following backfilling
        var sortingFunctions = {
            "Type" : function(a, b) { return structureOrder.indexOf(a) - structureOrder.indexOf(b); },
            "Date" : function(a, b) { return moment(a, timeFormats[config.time.toLowerCase()]).diff(moment(b, timeFormats[config.time.toLowerCase()])); },
            "County" : function(a, b) { return a - b; }, // could implement more custom sorting here.
            "Town" : function(a, b) { return a - b; } // could implement more custom sorting here. Perhaps group by county, then alphabetically?
        };

        // back fill so there are no gaps in data
        // make sure there is every first level agg
        // for every first level, make sure there is every second level agg, etc
        var firstFactor =  lodash.chain(filteredData)
            .pluck(config.facet[0])
            .unique()
            .value()
            .sort(sortingFunctions[config.facet[0]]);

        var secondFactor =  lodash.chain(filteredData)
            .pluck(config.facet[1])
            .unique()
            .value()
            .sort(sortingFunctions[config.facet[1]]);

        var thirdFactor =  lodash.chain(filteredData)
            .pluck(config.facet[2])
            .unique()
            .value()
            .sort(sortingFunctions[config.facet[2]]);

        // account for geography as facet - backfill accordingly
        // geo is never 2nd factor
        console.log(config.facet)
        if (config.facet[0] == "County" || config.facet[0] == "Town") {
            console.log("firstFactor is geo!")
            firstFactor = allGeos.sort(sortingFunctions[config.facet[0]]);
        } else if (config.facet[2] == "County" || config.facet[2] == "Town") {
            console.log("thirdFactor is geo!")
            thirdFactor = allGeos.sort(sortingFunctions[config.facet[0]]);
        }

        data = firstFactor.map(function(first, firstI, firstA) {
            return {
                "key" : first,
                "config" : lodash.pick(SOURCE_CONFIG, ["time", "geography", "facet", "start", "end"]),
                "values" : secondFactor.map(function(second, secondI, secondA) {
                    return {
                        "key" : second,
                        "values" : thirdFactor.map(function(third, thirdI, thirdA) {
                            var dataFind = lodash.chain(data).find({"key" : first}).value();
                            if (typeof dataFind == "undefined") {
                                return {"key" : third, "values" : 0};
                            }
                            dataFind = lodash.chain(dataFind.values).find({"key" : second}).value();
                            if (typeof dataFind == "undefined") {
                                return {"key" : third, "values" : 0};
                            }
                            dataFind = lodash.chain(dataFind.values).find({"key" : third}).value();
                            if (typeof dataFind == "undefined") {
                                return {"key" : third, "values" : 0};
                            }
                            return dataFind;
                        })
                    };
                })
            };
        });

        return data;
    };

    return dataProcessor;
}])
