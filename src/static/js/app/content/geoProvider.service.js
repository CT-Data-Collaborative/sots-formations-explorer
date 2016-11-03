angular.module('app')
.service('geoProvider', ['$q', '$http', function($q, $http) {
    var geoProvider = {
        county : null,
        town : null
    };

    geoProvider.getData = function(geography) {
        console.log("Provider getting GEO data: "+geography)
        if (geoProvider[geography] !== null) {
            // if this object already has data, just use what's currently available
            return $q(function(resolve){resolve(geoProvider)});
        } else {
            // otherwise get data fresh from file
            return $q(function(resolve, reject) {
                $http.get('/geos/'+geography+'.geojson')
                    .success(function(response) {
                        geoProvider[geography] = response

                        resolve(geoProvider);
                    })
                    .error(function() {
                        reject("There was an error getting geography: "+geography);
                    });
            });
        }
    };

    return geoProvider;
}])
