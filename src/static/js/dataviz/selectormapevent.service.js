angular.module('app')
.service('selectormapEventService', ['lodash', function(lodash) {
    var selectormapEventService = {};

    selectormapEventService.register = function(containerElement, checkBase, toggleTown) {

        var container = d3.select(containerElement);

        // register events
        container.selectAll("g.mapgroup > path")
        .on("mouseover", function(){
            //highlight
            d3.select(this.parentNode)
            .classed("highlight", true)
        })
        .on("mouseout", function(){
            //remove highlight
            d3.select(this.parentNode)
            .classed("highlight", false)
        })
        .on("click", function(){
            var selectedTown = d3.select(this.parentNode),
                townObject = {
                    name : d3.select(this.parentNode).attr("data-name"),
                    FIPS : d3.select(this.parentNode).attr("data-fips")
                },
                isBase = checkBase(townObject),
                isToggled = toggleTown(townObject);

            if (isToggled) {
                selectedTown.classed("selected", !selectedTown.classed("selected"));

                if (isBase) {
                    selectedTown.classed("mytown", !selectedTown.classed("mytown"));
                }
            }
        });
        
        return;
    }

    return selectormapEventService;
}])
