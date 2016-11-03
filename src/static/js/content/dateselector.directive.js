angular.module('app')
.directive('dateselector', ['appConfig', function(appConfig) {
    return  {
        restrict: 'E',
        scope: {
            ngModel: "=",
            unit: "=unit",
            name: "=name"
        },
        templateUrl: "/templates/dateselector.html",
        link: function(scope, element, attrs) {
            // time formats used in a couple of the following functions
            var timeFormats = {
                "year" : "YYYY",
                "quarter" : "[Q]Q YYYY",
                "month" : "MMM YYYY"
            };

            // generates options based on unit
            scope.renderOptions = function() {
                var intervals = {
                        "year" : {years : 1},
                        "quarter" : {months : 3},
                        "month" : {months : 1}
                    };
                const DATA_START = appConfig.startData,
                    DATA_END = appConfig.endData;

                // generate options
                scope.options = [];
                var current = moment(DATA_END);
                while (current.isAfter(moment(DATA_START))) {
                    var thisOption = current.format(timeFormats[scope.unit.toLowerCase()]);
                    scope.options.push({
                        "value": thisOption,
                        "label": thisOption,
                        "selected": (thisOption == scope.ngModel[0].value || thisOption == scope.ngModel)
                    });
                    current.subtract(intervals[scope.unit.toLowerCase()])
                };
            }

            scope.$watchCollection('unit', function(newUnit, oldUnit) {
                scope.renderOptions();
            });
        }
    };
}])
