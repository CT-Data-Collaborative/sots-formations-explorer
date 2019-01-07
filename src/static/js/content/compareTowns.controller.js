angular.module('app')
    .controller('CompareTownsController', ['$scope', '$loading', '$anchorScroll', 'ngDialog', 'lodash', 'dataProvider', 'dataProcessor', 'appConfig',
        function($scope, $loading, $anchorScroll, ngDialog, lodash, dataProvider, dataProcessor, appConfig) {
            $loading.setDefaultOptions(
                {
                    text: 'Loading Data . . .', // Display text
                    className: 'ctdata-loading-overlay', // Custom class, added to directive
                    spinnerOptions: {
                        lines: 10, // The number of lines to draw
                        length: 10, // The length of each line
                        width: 10, // The line thickness
                        radius: 50, // The radius of the inner circle
                        color: '#4670A7', // #rgb or #rrggbb
                        speed: 1.25, // Rounds per second
                        trail: 85, // Afterglow percentage
                        opacity: 0.05, // Opacity of the lines
                        className: 'dw-spinner ctdata-loading-overlay-spinner', // CSS class to assign to the element
                    }
                }
            );

            const DATA_START = moment(appConfig.startData, "YYYY-MM-DD"),
                  DATA_END = moment(appConfig.endData, "YYYY-MM-DD");
            //console.log(DATA_START);
            $scope.collapsed = {
                "metadata" : true
            };

            $scope.data = [];

            $scope.config = {
                "time" : "year", // year, quarter
                "start" : String(moment(appConfig.startData).year()), // a year between 1980 and 2015 inclusive
                "end" : String(moment(appConfig.endData).year()), // a year between 1980 and 2015 inclusive
                "submit" : false, // a flag for submit button click
                "towns" : {
                    "base" : null,
                    "comparators" : []
                },
                "structures" : []
            };
            $scope.activeChoices = appConfig.dateUnitChoices[$scope.config.time];
            $scope.selectStart = function(item) {
                $scope.config.start = item.value;
            }
            $scope.selectEnd = function(item) {
                $scope.config.end = item.value;
            }
            $scope.structures = appConfig.structureOrder.map(function(s) {
                return {"label": s, "value": s}
            });

            $scope.configOptions = [
                {
                    "name" : "Time",
                    "label" : "Time Scale",
                    "options" : ["Year", "Quarter"]
                }
            ];

            $scope.scrollTo = function(hash) {
                console.log(hash);
                $anchorScroll(hash);
            }

            $scope.canVisualize = function() {
                if (
                    null === $scope.config.towns.base
                    || $scope.config.structures.length < 1
                ) {
                    return false;
                }
                return true;
            }

            // // the function used to update list of towns selected with MapSelector
            $scope.checkBase = function(town) {
                var townIndex = lodash.chain($scope.config.towns.comparators)
                    .findIndex(function(t) {
                        return t.FIPS === town.FIPS;
                    })
                    .value()
                if (
                    (null === $scope.config.towns.base && townIndex === -1)
                    || lodash.isEqual($scope.config.towns.base, town)
                ) {
                    return true;
                }

                return false;
            }

            var sluggify = function(text) {
                return text.toLowerCase().replace(/\W/g, "_")
            }

            $scope.toggleMap = function(town) {
                // use D3 to remove selected classes from given town.
                d3.selectAll("g.mapgroup." + sluggify(town.name))
                    .classed({
                        selected : false,
                        mytown : false
                    });
            }

            $scope.toggleTown = function(town, doApply) {
                var returnFlag = true;

                var thisFunction = function() {
                    var townIndex = lodash.chain($scope.config.towns.comparators)
                        .findIndex(function(t) {
                            return t.FIPS === town.FIPS;
                        })
                        .value()

                    // console.log(town);
                    if (null === $scope.config.towns.base && townIndex === -1) {
                        $scope.config.towns.base = town;
                    } else if (lodash.isEqual($scope.config.towns.base, town)) {
                        $scope.config.towns.base = null;
                    } else if (townIndex !== -1) {
                        $scope.config.towns.comparators.splice(townIndex, 1)
                    } else if ($scope.config.towns.comparators.length === 4) {
                        returnFlag = false;
                    } else {
                        $scope.config.towns.comparators.push(town);
                    }
                }

                if (undefined === doApply || doApply) {
                    $scope.$apply(thisFunction);
                } else {
                    thisFunction();
                    $scope.toggleMap(town);
                }

                return returnFlag;
            }

            $scope.getRawHeader = function() {
                return [
                    "Town",
                    "Business Entity Type",
                    lodash.startCase($scope.config.time),
                    "Formations"
                ]
            };

            $scope.getRawData = function() {
                return lodash.chain($scope.data)
                    .map(function(o) {
                        return lodash.chain(o.values)
                            .map(function(value) {
                                var row = {
                                    "Town" : o.town,
                                    "Business Entity Type": o.type,
                                    "Formations" : value.values
                                }

                                if (null === row["Formations"]) {
                                    row["Formations"] = "NA"
                                }

                                row[lodash.startCase($scope.config.time)] = value.key
                                return row;
                            })
                            .value()
                    })
                    .flatten()
                    .value()
            }

            $scope.printData = function() {
                console.log($scope.getSumData());
            }

            $scope.getSumHeader = function() {
                return [
                    "",
                    $scope.config.towns.base.name
                ].concat(
                    lodash.flatten(
                        $scope.config.towns.comparators.map(function(town) {
                            return [
                                town.name,
                                town.name + " vs. " + $scope.config.towns.base.name
                            ];
                        })
                    )
                );
            };

            $scope.getSumData = function() {
                var numberFormat = function(val) {
                    val = parseFloat(val);
                    return val.toFixed(0);
                };
                var diffFormat = function(val) {
                    val = parseFloat(val);
                    val = (val * 100).toFixed(1)
                    if (val > 0) { val = "+" + val; }
                    return val + "%";
                };
                wideData = lodash.chain($scope.data)
                    .map(function(d) {
                        var sum = lodash.chain(d.values)
                            .map(function(val) { return val.values; })
                            .reduce(function(total, val) { return total + val; })
                            .value();
                        var timeUnits = d.values.length;

                        return [
                            {
                                "town" : d.town,
                                "type" : d.type,
                                "indicator" : ["Total", d.type].join(" "),
                                "values" : sum,
                            },{
                                "town" : d.town,
                                "type" : d.type,
                                "indicator" : ["Avg.", $scope.config.time].join("/"),
                                "values" : sum/timeUnits,
                            }
                        ]
                    })
                    .flatten()
                    .value();

                // console.log(wideData);

                return lodash.chain($scope.config.structures)
                    .map(function(structure) {
                        var totalRow = {};
                        var avgRow = {};

                        var totalIndicator = ["Total", structure.label].join(" ");
                        var avgIndicator = ["Avg.", $scope.config.time].join("/");
                        // first col
                        totalRow[""] = totalIndicator;
                        avgRow[""] = avgIndicator;

                        // base values for calculating diffs
                        totalBase = lodash.find(
                            wideData,
                            {
                                "town" : $scope.config.towns.base.name,
                                "indicator" : totalIndicator,
                                "type" : structure.label
                            }
                        );
                        avgBase = lodash.find(
                            wideData,
                            {
                                "town" : $scope.config.towns.base.name,
                                "indicator" : avgIndicator,
                                "type" : structure.label
                            }
                        );
                        lodash.chain($scope.config.towns)
                            .values()
                            .flatten()
                            .value()
                            .map(function(town) {
                                return town.name
                            })
                            .map(function(col) {
                                var totalValue = lodash.find(
                                    wideData,
                                    {"town" : col, "indicator" : totalIndicator, "type" : structure.label}
                                );
                                var avgValue = lodash.find(
                                    wideData,
                                    {"town" : col, "indicator" : avgIndicator, "type" : structure.label}
                                );

                                totalRow[col] = numberFormat(totalValue["values"])
                                avgRow[col] = numberFormat(avgValue["values"])

                                if (col != $scope.config.towns.base.name) {
                                    diffCol = col + " vs. " + $scope.config.towns.base.name;
                                    totalRow[diffCol] = diffFormat((totalValue["values"]/totalBase["values"]) - 1)
                                    avgRow[diffCol] = diffFormat((avgValue["values"]/avgBase["values"]) - 1)
                                }
                            })

                        return [totalRow, avgRow];
                    })
                    .flatten()
                    .value()
            }

            var updateData = function() {
                dataProvider.buildPieces($scope.config)
                $loading.start("data");
                var dataPromise = dataProvider.getData($scope.config);
                dataPromise.then(function(result) {
                    // process data based on config
                    $scope.data = dataProcessor.processMyTown(dataProvider.data, $scope.config)
                    $loading.finish("data");
                }, function(rejection) {
                    alert("promise rejected!");
                })
            }

            $scope.$watchCollection("config", function(newConfig, oldConfig) {
                var timeFormats = appConfig.timeFormats,
                    timeIntervals = appConfig.intervals;

                // when we change the unit of time, let's convert the start/end dates gracefully.
                if (newConfig.time != oldConfig.time) {
                    newConfig.start = moment(oldConfig.start, timeFormats[oldConfig.time]).startOf(oldConfig.time).format(timeFormats[newConfig.time]);
                    newConfig.end = moment(oldConfig.end, timeFormats[oldConfig.time]).endOf(oldConfig.time).format(timeFormats[newConfig.time]);
                    $scope.activeChoices = appConfig.dateUnitChoices[newConfig.time];
                }

                if (newConfig.towns.length < 1) {
                    return;
                }


                // Currently only updating data if we have clicked submit.
                if (newConfig.submit) {
                    updateData();
                    $anchorScroll("visualisation");
                    // reset submit flag
                    newConfig.submit = false;
                }
            });
        }])
