angular.module('app')
.service('selectormapService', ['$q', '$http', 'lodash', function($q, $http, lodash) {
    var selectormapService = {};

    selectormapService.chart = function(container) {
        var HEX_COLORS = [
            "#ffffcc",
            "#c7e9b4",
            "#7fcdbb",
            "#41b6c4",
            "#2c7fb8",
            "#253494"
        ];

        // create container for maps
        mapContainer = d3.select(container)
            .append("div")
            .classed("selectormap-container", true)
            .append("div")
            .classed("selectormap-container-internal", true);

        makeMap(mapContainer);

        // mapContainer.append("pre")
            // .text(JSON.stringify(data, null, 4));
            // .text(JSON.stringify(config, null, 4));
            // .text(JSON.stringify(GEO_DATA["town"], null, 4));
            // .text(JSON.stringify(scaleData, null, 4));
            // .text(JSON.stringify(scaleBreaks, null, 4));
        // return;

        function makeMap(selection) {
            selection.each(function(data, index) {
                var geoJoinedData = {
                    "type" : "FeatureCollection",
                    "features" : GEO_DATA["town"].features
                };

                // stuff we need to draw maps
                var BBox = this.getBoundingClientRect(),
                    margin = {
                        "top" : BBox.height * 0.05,
                        "right" : BBox.width * 0.1,
                        "bottom" : BBox.height * 0.05,
                        "left" : BBox.width * 0.1
                    },
                    width = BBox.width,
                    // height = BBox.height - (margin.top + margin.bottom),
                    height = width * (1/2),
                    svg = d3.select(this).append("svg")
                        .attr("height", height)
                        .attr("width", width)
                        .attr("transform", "translate(0, 0)"),

                    height = height - (margin.top + margin.bottom),
                    width = width - (margin.left + margin.right)
                    map = svg.append("g")
                        .attr("height", height)
                        .attr("width", width)
                        .attr("transform", "translate(" + margin.left + ", " + margin.top + ")"),
                    sluggify = function(text)  {
                        return text.toLowerCase().replace(/\W/g, "_");
                    }
                    // breaks = data.breaks,
                    // colors = d3.scale.ordinal()
                    //     // .domain(d3.range(breaks.length))
                    //     .range(HEX_COLORS),
                    // jenks = d3.scale.threshold()
                    //     .domain(breaks.map(function(cluster) {return cluster[0];}))
                    //     .range(["#FAFAFA"].concat(d3.range(breaks.length).map(function(i) { return colors(i); }))),
                    projection = d3.geo.equirectangular()
                            .scale(1)
                            .translate([0,0]),
                    path = d3.geo.path().projection(projection),
                    bounds  = path.bounds(geoJoinedData),
                        hscale = (bounds[1][0] - bounds[0][0]) / width,
                        vscale = (bounds[1][1] - bounds[0][1]) / height,
                        scale = 1 / Math.max(hscale, vscale),
                        translate = [(width - scale * (bounds[1][0] + bounds[0][0])) / 2, (height - scale * (bounds[1][1] + bounds[0][1])) / 2];

                projection.scale(scale).translate(translate);
                
                // Possibly make this follow this pattern for hover "popup" info
                /**
                * var places = selectAll("g")
                *   .data(features)
                *   .enter()
                *   .append("g")
                *       .datum(function(d) { return d; });
                *
                *   places.each(function() {
                *       d3.select(this)
                *           .append("path")
                *           // Geo path code here //
                *
                *       d3.select(this)
                *           .append("g")
                *           // hover "popup" code here //
                **/
                var places = map.selectAll("path")
                    .data(geoJoinedData.features)
                    .enter()
                    .append("g")
                        .attr("class", function(d){
                            return [
                                "mapgroup",
                                "hover",
                                sluggify(d.properties.NAME)
                            ].join(" ");
                        })
                        .attr("data-geoclass", function(d) {
                            return sluggify(d.properties.NAME);
                        })
                        .attr("data-name", function(d) {
                            return d.properties.NAME;
                        })
                        .attr("data-fips", function(d) {
                            return sluggify(d.properties.FIPS);
                        })
                        .datum(function(d) { return d; });

                places.each(function(placeData) {
                    // build a tooltip
                    new Tooltip({
                        target: this,
                        content: placeData.properties.NAME,
                        position: "top center",
                        classes: "sots-tooltip"
                    });

                    // the actual map piece
                    d3.select(this)
                        .append("path")
                        .attr("d", path)
                        .classed("mappath", true)
                        .attr("fill", function(d) {
                            // return jenks(d.properties.DATAVALUE || null);
                            return "rgba(0,0,0,0)"
                        });

                    // text to say what geo and its value
                    // d3.select(this)
                    //     .append("text")
                    //         .classed("mapinfo", true)
                    //         .attr("x", width*0.9)
                    //         .attr("y", height*0.9)
                    //         .attr("text-anchor", "end")
                    //         .text(function(d) {
                    //             return d.properties.NAME;
                    //         })
                })
                /*
                var places = map.selectAll("path")
                    .data(geoJoinedData.features)
                    .enter()
                    .append("path")
                        .attr("d", path)
                        .attr("data-geography", function(d) {
                            return sluggify(d.properties.NAME);
                            // could use NAME here, would require sluggify function
                        })
                        .attr("class", function(d) {
                            return [
                                "mappath",
                                sluggify(d.properties.NAME)
                            ].join(" ");
                        })
                        .attr("fill", function(d) {
                            return jenks(d.properties.DATAVALUE || null);
                        });
                */
            });
        }
    }

    return selectormapService;
}])
