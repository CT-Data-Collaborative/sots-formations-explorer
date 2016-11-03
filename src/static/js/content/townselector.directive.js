angular.module('app')
.directive('townselector', ['lodash', function(lodash) {
    return  {
        restrict: 'E',
        scope: {
            ngModel: "=",
            name: "=name"
        },
        templateUrl: "/templates/townselector.html",
        link: function(scope, element, attrs) {
            // generates options based on unit
            scope.renderOptions = function() {
                // generate options
                scope.options = lodash.chain(GEO_DATA["town"].features)
                    .map(function(o) {
                        return o.properties.NAME;
                    })
                    .value()
                    .sort()
            }

            scope.renderOptions();
        }
    };
}])
