angular.module('app')
.service('eventService', ['lodash', function(lodash) {
    var eventService = {};

    function scrollIntoView(element, container) {
      var containerTop = $(container).scrollTop();
      var containerBottom = containerTop + $(container).height();
      var elemTop = element.offsetTop;
      var elemBottom = elemTop + $(element).height();

      if (elemTop < containerTop) {
        $(container).scrollTop(elemTop);
      } else if (elemBottom > containerBottom) {
        $(container).scrollTop(elemBottom - $(container).height());
      }
    }

    registerMaps = function(containerElement) {
        var container = d3.select(containerElement),
            allHover = container.selectAll(".hover");

        // get all classes to highlight with
        var highlightClasses = lodash.chain(allHover[0])
            .map(function(el) {
                return el.attributes["data-geography"].value
            })
            .unique()
            .value()


        var selections = lodash.chain(highlightClasses)
            .zipObject(
                lodash.fill(Array(highlightClasses.length), {})
            )
            .mapValues(function(emptySelection, classToHighlight) {
                var selection = {};
                selection.withClass = container.selectAll("g.mapgroup." + classToHighlight + " > path.mappath, g.mapgroup." + classToHighlight + " > text.mapinfo, table.ctdata-table > tbody > tr." + classToHighlight);
                selection.withoutClass = container.selectAll("g.mapgroup:not(." + classToHighlight + ") > path.mappath, g.mapgroup:not(." + classToHighlight + ") > text.mapinfo, table.ctdata-table > tbody > tr:not(." + classToHighlight + ")");

                selection.tableRow = container.select("table.ctdata-table > tbody > tr." + classToHighlight).node();

                return selection;
            })
            .value()

        selections.all = container.selectAll("g.mapgroup > path.mappath, g.mapgroup > text.mapinfo, table.ctdata-table > tbody > tr")

        allHover.selectAll("g.mapgroup > path.mappath, table.ctdata-table > tbody > tr > td")
        .on("mouseover", function() {
            selections[this.parentNode.attributes["data-geography"].value].withClass
                .classed({
                    highlight: true,
                    lowlight: false
                })

            selections[this.parentNode.attributes["data-geography"].value].withoutClass
                .classed({
                    highlight: false,
                    lowlight: true
                })

            // scroll table to related row
            scrollIntoView(
                selections[this.parentNode.attributes["data-geography"].value].tableRow,
                container.select("div.table-container-inner").node()
            )
        })
        .on("mouseout", function() {
            selections.all
                .classed({
                    highlight: false,
                    lowlight: false
                })
        })
        
        return;
    }
    
    registerBars = function(containerElement) {
        var container = d3.select(containerElement),
            allHover = container.selectAll(".hover");

        // get all classes to highlight with
        var highlightClasses = lodash.chain(allHover[0])
            .map(function(el) {
                return el.attributes["data-geography"].value
            })
            .unique()
            .value()


        var selections = lodash.chain(highlightClasses)
            .zipObject(
                lodash.fill(Array(highlightClasses.length), {})
            )
            .mapValues(function(emptySelection, classToHighlight) {
                var selection = {};
                selection.withClass = container.selectAll("g.barchart-bar > rect.barchart-path." + classToHighlight + ", table.ctdata-table > tbody > tr." + classToHighlight);
                selection.withoutClass = container.selectAll("g.barchart-bar > rect.barchart-path:not(." + classToHighlight + "), table.ctdata-table > tbody > tr:not(." + classToHighlight + ")");

                selection.tableRow = container.select("table.ctdata-table > tbody > tr." + classToHighlight).node();
                return selection;
            })
            .value()

        selections.all = container.selectAll("g.barchart-bar > rect.barchart-path, g.barchart-label > text.barchart-label, table.ctdata-table > tbody > tr")

        allHover.on("mouseover", function() {
            selections[this.attributes["data-geography"].value].withClass
                .classed({
                    highlight: true,
                    lowlight: false
                })

            selections[this.attributes["data-geography"].value].withoutClass
                .classed({
                    highlight: false,
                    lowlight: true
                })

            // scroll table to related row
            scrollIntoView(
                selections[this.attributes["data-geography"].value].tableRow,
                container.select("div.table-container-inner").node()
            )
        })
        .on("mouseout", function() {
            selections.all
                .classed({
                    highlight: false,
                    lowlight: false
                })
        })
        
        return;
    }

    eventService.register = {
        "map" : registerMaps,
        "bar" : registerBars
    }

    return eventService;
}])
