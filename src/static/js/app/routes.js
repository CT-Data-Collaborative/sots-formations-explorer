angular.module("app")
.config(function($routeProvider, $locationProvider) {
    $routeProvider
        .when("/", {
            templateUrl: "pages/landing.html"
        })
        .when("/compare-towns", {
            templateUrl: "pages/compare-towns.html",
            controller: "CompareTownsController",
            controllerAs: "ContentController"
        })
        .when("/formations-over-time", {
            templateUrl: "pages/formations-over-time.html",
            controller: "FormationsOverTimeController",
            controllerAs: "ContentController"
        })
        .otherwise({
            redirectTo: "/"
        })
})