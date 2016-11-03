angular.module('app')
.controller('WrapperController', ['$location', '$scope', function($location, $scope) {

    var links = [
        {
            link: "/#/",
            title: "Home",
            icon : "fa fa-home",
            active: true
        },{
            link: "/#/formations-over-time",
            title: "Formations Over Time",
            icon : "fa fa-line-chart",
            active: true
        },{
            link: "/#/compare-towns",
            title: "Compare Towns",
            icon : "fa fa-globe",
            active: true
        },{
            link: "/#/",
            title: "Search the Data",
            icon : "fa fa-search",
            active: true
        },{
            link: "http://ctdata.org/tag/sots",
            title: "Data Stories",
            icon : "fa fa-book",
            active: true
        }
    ];

    $scope.navLinks = links.filter(function(l) { return l.link !== "/#"+$location.path(); })

    if ($location.path() === "/") {
        $scope.isRoot = true;
    } else {
        $scope.isRoot = false;
    }

    $scope.$watch(function () {
        return $location.path()
    }, function (value) {
        // update scope's awareness of it's location as root
        if ($location.path() === "/") {
            $scope.isRoot = true;
        } else {
            $scope.isRoot = false;
        }
        // filter links passed to controller
        $scope.navLinks = links.filter(function(l) { return l.link !== "/#"+$location.path(); })
    });
}]);