angular.module('app')
    .service('appConfig', ['$q', '$http', 'lodash', function($q, $http, lodash) {
        settings = {
            'startData': '1980-01-01',
            'endData': '2020-07-31',
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
                "Dec"],
            'dateUnitChoices': {},
            'timeFormats': {
                "year" : "YYYY",
                "quarter" : "[Q]Q YYYY",
                "month" : "MMM YYYY"
            },
            'intervals': {
                "year" : {years : 1},
                "quarter" : {months : 3},
                "month" : {months : 1}
            }
        };

        var buildOptions = function(startDate, endDate, dateFormat) {
            var formatStr = settings.timeFormats[dateFormat];
            var start = moment(startDate);
            var current = moment(endDate);
            var options = [];
            while (current.isAfter(start)) {
                var option = current.format(formatStr);
                options.push({
                    "value": option,
                    "label": option,
                    "start": false,
                    "end": false
                });
                current.subtract(settings.intervals[dateFormat])
            };
            return options
        };
        // Set up intervals for date selectors

        for (var f in settings.timeFormats) {
            settings.dateUnitChoices[f] = buildOptions(settings.startData, settings.endData, f)
        }
        return settings;
    }]);
