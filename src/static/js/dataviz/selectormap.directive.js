angular.module('app')
.directive('selectormap', ['$window', 'selectormapService', 'tableService', 'selectormapEventService', function($window, selectormapService, tableService, selectormapEventService) {
    return  {
        restrict: 'E',
        scope: {
            toggleTown: "=",
            checkBase: "="
        },
        link: function(scope, element, attrs) {
            scope.render = function() {
                var selectormapPromise = new Promise(function(resolve, reject) {
                        resolve(selectormapService.chart(element[0]));
                    }),
                    eventPromise = new Promise(function(resolve, reject) {
                        resolve(selectormapEventService.register(element[0], scope.checkBase, scope.toggleTown));
                    });

                selectormapPromise.then(eventPromise);
            }

            $window.onresize = function() {
                scope.render()
            };

            scope.render();
        }
    }
}])
