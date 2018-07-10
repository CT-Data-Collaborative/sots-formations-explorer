angular.module('app')
.controller('WrapperController', ['$location', '$scope', 'appConfig', function($location, $scope, appConfig) {
    const DATA_START = moment(appConfig.startData, "YYYY-MM-DD"),
        DATA_END = moment(appConfig.endData, "YYYY-MM-DD");
    $scope.startYear = DATA_START.year();
    $scope.startMonth = DATA_START.format('MMMM');
    $scope.endYear = DATA_END.year();
    $scope.endMonth = DATA_END.format('MMMM');
    var links = [
        {
            link: "/#/",
            title: "Home",
            icon : "fa fa-home",
            active: true
        },{
            link: "/#/formations-over-time",
            title: "Formations Over Time",
            icon : "fas fa-chart-line",
            active: true
        },{
            link: "/#/compare-towns",
            title: "Compare Towns",
            icon : "fas fa-balance-scale",
            active: true
        },{
            link: "/#/starts-and-stops",
            title: "Starts & Stops",
            icon : "fa fa-hourglass-start",
            active: true
        },{
            link: "http://searchctbusiness.ctdata.org",
            title: "Search the Data",
            icon : "fa fa-search",
            active: true
        },{
            link: "http://ctdata.org/blog/",
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
