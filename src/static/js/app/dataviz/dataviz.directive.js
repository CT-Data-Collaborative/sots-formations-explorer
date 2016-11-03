angular.module('app')
.directive('dataviz', ['$window', '$q', 'mapService', 'timeseriesService', 'barChartService', 'tableService',  'eventService', function($window, $q, mapService, timeseriesService, barChartService, tableService, eventService) {
    // This function should reflect whatever your d3 function is called.
    var charts = {
        // QUINTILE BREAKS
        "map" : mapService.chartQuintiles,
        "bar" : barChartService.chartQuintiles,

        // CKMEANS BREAKS
        // "map" : mapService.chartCKMeans,
        // "bar" : barChartService.chartCKMeans,
        
        "line" : timeseriesService.chart,
        "table" : tableService.chart
    };
    return  {
        restrict: 'E',
        scope: {
            data: "=data",
            config: "=config",
            type: "=type",
            last: "=last"
        },
        link: function(scope, element, attrs) {
            scope.render = function() {
                data = {
                    data : scope.data,
                    config : scope.config
                };

                var chartPromise = $q(function(resolve, reject){
                        resolve(charts[scope.type](element[0], scope.data, scope.config))
                    }),
                    tablePromise = $q(function(resolve, reject) {
                        resolve(charts["table"](element[0], scope.data, scope.config))
                    });

                if (true || scope.last === true) {
                    var eventPromise = $q(function(resolve, reject) {
                        resolve(eventService.register[scope.type](element[0]))
                    });
                    chartPromise.then(tablePromise).then(eventPromise)
                } else {
                    chartPromise.then(tablePromise)
                }
            }

            scope.$watchCollection('data', function(newData) {
                if (newData.length === 0) {
                    // No data somehow? This should never happen!
                    console.log("No data!");
                    return;
                }
                scope.render();
            });

            // This is currently causing all the visuals and tables to duplicate every time the window
            // resizes... removing for now.
            // $window.onresize = function() {
            //     scope.render()
            // };

            // scope.$watchCollection('data', function(data) {
            //     scope.render(data);
            // });

        }
    }
}])
