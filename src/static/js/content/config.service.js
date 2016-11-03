angular.module('app')
    .service('appConfig', ['$q', '$http', 'lodash', function($q, $http, lodash) {
        settings = {
            'startData': '1980-01-01',
            'endData': '2016-09-30',
            'structureOrder': [
                "All Business Entities",
                "LLC (CT)",
                "LLC (Non-CT)",
                "Stock Corporation (CT)",
                "Stock Corporation (Non-CT)",
                "Nonstock Corporation (CT)",
                "Nonstock Corporation (Non-CT)",
                "LP (CT)",
                "LP (Non-CT)",
                "Statutory Trust (CT)",
                "Statutory Trust (Non-CT)",
                "General Partnership",
                "Other",
                "Benefit Corp."
            ],
            'months': [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec"]
        }
        return settings;
    }]);