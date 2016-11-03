angular.module('app')
.service('dataProvider', ['$q', '$http', 'lodash', 'appConfig', function($q, $http, lodash, appConfig) {
    $http.defaults.cache = true;

    var dataProvider = {
        data : null,
        pieces : {}
    };

    dataProvider.buildPieces = function(config) {
        var structures = lodash.chain(config.structures)
                .pluck("value")
                .values()
                .value();
        // get list of all years between start and end
        // including the rest of year if we're starting in the middle of one, eg "Q2 2012"
        var timeIntervals = {
                "year" : {years : 1},
                "quarter" : {months : 3},
                "month" : {months : 1}
            };
        var timeFormats = {
                "year" : "YYYY",
                "quarter" : "[Q]Q YYYY",
                "month" : "MMM YYYY"
            };

        var start = moment(config.start[0].value, timeFormats[config.time]).startOf("year")
        var end = moment(config.end[0].value, timeFormats[config.time]).endOf("year")

        // generate time interval list
        timeList = [];
        var current = end;
        while (current.isAfter(moment(start))) {
            timeList.push(current.format(timeFormats["year"]));
            current.subtract(timeIntervals["year"])
        };

        var pieces = [];
        structures.forEach(function(structure) {
            timeList.forEach(function(time) {
                pieces.push([structure, time])
            })
        })

        return pieces;
    }


    dataProvider.getData = function(config) {
        console.log("Provider getting data!")

        var requests = dataProvider.buildPieces(config)
            .map(function(piece) {
                return $http.get("/data/"+piece[0]+"/"+piece[1]+".json")
            });

        return $q.all(requests).then(function(values) {
            dataProvider.data = lodash.chain(values)
                .pluck("data")
                .flatten()
                .map(function(row, rowI, rowA) {
                    row.Moment = moment([row.Year, lodash.padLeft(row.Month, "0"), "01"].join("-"), "YYYY-MM-DD")
                    return row;
                })
                .value();
        });
        
    };

    return dataProvider;
}])

