angular.module('app')
.directive('towntable', ['$window', 'towntableService', 'townTableEventService', function($window, towntableService, townTableEventService) {
    return  {
        restrict: 'E',
        scope: {
            data: "=",
            config: "="
        },
        link: function(scope, element, attrs) {
            scope.render = function() {
                if (scope.data.length === 0) { return; }
                var towntablePromise = new Promise(function(resolve, reject) {
                        resolve(towntableService.chart(element[0], scope.data, scope.config));
                    })/*,
                    eventPromise = new Promise(function(resolve, reject) {
                        resolve(townTableEventService.register(element[0], scope.toggleFn));
                    });*/

                // towntablePromise.then(eventPromise);
            }

            /**
                This code is intended to get the chart to redraw when the window is resized
                But as it stands, somehow this overrides the data and the chart becomes useless.
                I don't think this feature is worth the debug time now, but it's worth keeping in mind for the future.
            **/
            $window.onresize = function() {
                scope.render()
            };

            scope.$watchCollection('data', function(data) {
                scope.render();
            });
        }
    }
}])
