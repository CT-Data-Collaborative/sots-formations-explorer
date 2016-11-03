angular.module('app')
.controller('FormationsOverTimeController', ['$scope', '$anchorScroll', '$loading', 'ngDialog', 'lodash', 'dataProvider', 'dataProcessor',
    function($scope, $anchorScroll, $loading, ngDialog, lodash, dataProvider, dataProcessor) {
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
    $scope.collapsed = {
        "metadata" : true
    };
    $scope.config = {
        "time" : "year", // year, month, quarter ?
        "start" : "2013", // a year between 1980 and 2015 inclusive
        "end" : "2015", // a year between 1980 and 2015 inclusive
        "geography" : "county", // county, town
        "facet" : "structure", // structure, time
        "type" : "map", // map, line

        // This is only for A/B testing interactivity!
        "process" : false, // a flag for interactivity
        "submit" : false // a flag for submit button click
    };

    $scope.structures = [
        {
            "label" : "All Business Entities",
            "value" : "All Business Entities"
        },
        {
            "label" : "LLC (CT)",
            "value" : "LLC (CT)"
        },
        {
            "label" : "LLC (Non-CT)",
            "value" : "LLC (Non-CT)"
        },
        {
            "label" : "Stock Corporation (CT)",
            "value" : "Stock Corporation (CT)"
        },
        {
            "label" : "Stock Corporation (Non-CT)",
            "value" : "Stock Corporation (Non-CT)"
        },
        {
            "label" : "Nonstock Corporation (CT)",
            "value" : "Nonstock Corporation (CT)"
        },
        {
            "label" : "Nonstock Corporation (Non-CT)",
            "value" : "Nonstock Corporation (Non-CT)"
        },
        {
            "label" : "LP (CT)",
            "value" : "LP (CT)"
        },
        {
            "label" : "LP (Non-CT)",
            "value" : "LP (Non-CT)"
        },
        {
            "label" : "Statutory Trust (CT)",
            "value" : "Statutory Trust (CT)"
        },
        {
            "label" : "Statutory Trust (Non-CT)",
            "value" : "Statutory Trust (Non-CT)"
        },
        {
            "label" : "General Partnership",
            "value" : "General Partnership"
        },
        {
            "label" : "Other",
            "value" : "Other"
        },
        {
            "label" : "Benefit Corp.",
            "value" : "Benefit Corp."
        }
    ];

    $scope.configOptions = {
        "Time": {
            "name" : "Time",
            "label" : "Time Scale",
            "options" : ["Year", "Quarter", "Month"]
        },
        "Geography" :{
            "name" : "Geography",
            "label" : "Geography",
            "options" : ["County", "Town", "Council Of Government"]
        },
        "Facet" :{
            "name" : "Facet",
            "label" : "View By",
            "options" : ["Structure", "Time"]
        },
        "Type" :{
            "name" : "Type",
            "label" : "Visualization",
            "options" : ["Map", "Bar"]
        }
    };

    $scope.data = [];
    

    $scope.scrollTo = function(hash) {
        console.log(hash);
        $anchorScroll(hash);
    }

    $scope.canVisualize = function() {
        if (undefined === $scope.config.structures || $scope.config.structures.length < 1) {
            return false;
        }

        return true;
    }

    $scope.getCSVHeader = function() {
        return [
            lodash.startCase($scope.config.geography),
            "Business Entity Type",
            lodash.startCase($scope.config.time),
            "Formations"
        ]
    };

    $scope.printData = function() {
        console.log($scope.getCSVData());
    }
    $scope.getCSVData = function() {
        // get facet labels
        if ($scope.config.facet === "time") {
            firstFacetLabel = lodash.startCase($scope.config.time);
            secondFacetLabel = "Business Entity Type";
            thirdFacetLabel = lodash.startCase($scope.config.geography);
        } else if ($scope.config.facet == "geography") {
            firstFacetLabel = lodash.startCase($scope.config.geography);
            secondFacetLabel = "Business Entity Type";
            thirdFacetLabel = lodash.startCase($scope.config.time);
        } else if ($scope.config.facet == "structure") {
            firstFacetLabel = "Business Entity Type";
            secondFacetLabel = lodash.startCase($scope.config.time);
            thirdFacetLabel = lodash.startCase($scope.config.geography);
        }
        
        var CSVData = [];
        $scope.data.forEach(function(firstFacet) {
            firstFacet.values.forEach(function(secondFacet) {
                secondFacet.values.forEach(function(thirdFacet) {
                    var row = {};
                    row[firstFacetLabel] = firstFacet.key;
                    row[secondFacetLabel] = secondFacet.key;
                    row[thirdFacetLabel] = thirdFacet.key;
                    row["Formations"] = thirdFacet.values
                    CSVData.push(row)
                })
            })
        })

        return CSVData;
    }

    var countData = function(newConfig) {
        if (newConfig.facet == "structure") {
            // count number of time units in span of selected range
            var timeFormats = {
                "year" : "YYYY",
                "quarter" : "[Q]Q YYYY",
                "month" : "MMM YYYY"
            },
                startMoment = moment(newConfig.start, timeFormats[newConfig.time]),
                endMoment = moment(newConfig.end, timeFormats[newConfig.time]).endOf(newConfig.time).add(1, "ms"),
                timeUnitCount = endMoment.diff(startMoment, newConfig.time, true);

            // console.log("Comparing number of units between \"" + startMoment.format("YYYY-MM-DD")+"\" and \"" + endMoment.format("YYYY-MM-DD") + "\", with unit \"" + newConfig.time + "\".")
            return timeUnitCount;
        } else {
            return 12;
        }
    }

    var updateData = function() {
        $loading.start("data");
        var dataPromise = dataProvider.getData($scope.config);
        dataPromise.then(function(result) {
            // process data based on config
            $scope.data = dataProcessor.processIndex(dataProvider.data, $scope.config);
            $loading.finish("data");
        }, function(rejection) {
            alert("promise rejected!");
        })
    }

    $scope.$watchCollection("config", function(newConfig, oldConfig) {
        var timeFormats = {
            "year" : "YYYY",
            "quarter" : "[Q]Q YYYY",
            "month" : "MMM YYYY"
        },
        timeIntervals = {
            "year" : {years : 1},
            "quarter" : {months : 3},
            "month" : {months : 1}
        };
        // console.log("New Config!");
        // console.log(newConfig);

        // if there is no change between last digest and this one.
        if (lodash.isEqual(newConfig, oldConfig)) {
            console.log("No change in config for this digest.")
            return;
        }

        // when we change the unit of time, let's convert the start/end dates gracefully.
        if (newConfig.time != oldConfig.time) {            
            newConfig.start[0].value = moment(oldConfig.start[0].value, timeFormats[oldConfig.time]).startOf(oldConfig.time).format(timeFormats[newConfig.time]);
            newConfig.end[0].value = moment(oldConfig.end[0].value, timeFormats[oldConfig.time]).endOf(oldConfig.time).format(timeFormats[newConfig.time]);
        }

        if (newConfig.type != oldConfig.type) {
            if (newConfig.type == "map") {
                $scope.configOptions["Facet"].options = ["Structure", "Time"];
                $scope.configOptions["Facet"].label = "Data Facet";
            } else {
                $scope.configOptions["Facet"].options = ["Structure", "Geography"];
                $scope.configOptions["Facet"].label = "Bar Facet";
            }

            if ($scope.configOptions["Facet"].options.indexOf(lodash.startCase(newConfig.facet)) === -1) {
                newConfig.facet = $scope.configOptions["Facet"].options[1].toLowerCase();
            }
        }

        // if process flag is false and this isn't triggered by a submit button, ignore
        if (!newConfig.submit) {
            console.log("Not updating: not process, not submit")
            return
        }

        /* Change in config present that will re-render visualizations */
        /* figure out how many charts we will end up with */
        var vizCount = countData(newConfig);
        // console.log("Counting " + vizCount + " small multiples.")
        
        // Too many charts? alert the user. if they don't want to continue, reset newConfig to oldConfig and return;
        if (newConfig.type === "map" && vizCount > 12) {
            ngDialog.openConfirm({
                template: "/static/dist/templates/dataWarning.html",
                overlay: true,
                showClose: false,
                appendTo: "#config > div:last-child",
                data: {
                    vizCount: vizCount
                }
            }).then(
                // resolved
                function() {
                    console.log("Confirmed! Continuing");
                    //digest and update
                    console.log("running data update");
                    updateData();
                },
                // rejected
                function() {
                    console.log("Rejected! Halting processing")
                    return;
                }
            );
            /* END figure out how many charts we will end up with! */
        } else {
            console.log("no need to ask user for data overload");
            console.log("running data update");
            updateData();
            $anchorScroll("output_container");
        }

        // reset submit flag
        newConfig.submit = false;
    });
}])