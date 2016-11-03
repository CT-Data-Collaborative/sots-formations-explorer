angular.module('app')
.service('townTableEventService', ['lodash', function(lodash) {
    var townTableEventService = {};

    townTableEventService.register = function(containerElement) {
        var container = d3.select(containerElement)

        var highlightClasses = [
            "all_business_entities",
            "llc__ct_",
            "llc__non_ct_",
            "stock_corporation__ct_",
            "stock_corporation__non_ct_",
            "nonstock_corporation__ct_",
            "nonstock_corporation__non_ct_",
            "lp__ct_",
            "lp__non_ct_",
            "statutory_trust__ct_",
            "statutory_trust__non_ct_",
            "general_partnership",
            "other",
            "benefit_corp_"
        ];

        var selections = lodash.chain(highlightClasses)
            .zipObject(
                lodash.fill(Array(highlightClasses.length), {})
            )
            .mapValues(function(emptySelection, classToHighlight) {
                var selection = {};
                selection.withClass = d3.selectAll("table.ctdata-table > tbody > tr." + classToHighlight + ", g.townline-lines > path." + classToHighlight + ", g.townline-points > path." + classToHighlight + ", g.townline-labels > text." + classToHighlight)
                selection.withoutClass = d3.selectAll("table.ctdata-table > tbody > tr:not(." + classToHighlight + "), g.townline-lines > path:not(." + classToHighlight + "), g.townline-points > path:not(." + classToHighlight + ")")

                /*selection.withClass = d3.selectAll("table.ctdata-table > tbody > tr." + classToHighlight + ", g.townline-lines > path." + classToHighlight + ", g.townline-points > path." + classToHighlight + ", g.legend > g.entry." + classToHighlight)
                selection.withoutClass = d3.selectAll("table.ctdata-table > tbody > tr:not(." + classToHighlight + "), g.townline-lines > path:not(." + classToHighlight + "), g.townline-points > path:not(." + classToHighlight + "), g.legend > g.entry:not(." + classToHighlight + ")")*/
                return selection;
            })
            .value()

        selections.all = container.selectAll("table.ctdata-table > tbody > tr")

        selections.all.on("mouseover", function() {
            selections[this.attributes["data-type"].value].withClass
                .classed({
                    highlight: true,
                    lowlight: false
                })

            selections[this.attributes["data-type"].value].withoutClass
                .classed({
                    highlight: false,
                    lowlight: true
                })
        })
        .on("mouseout", function() {
            d3.selectAll(".highlight, .lowlight")
                .classed({
                    highlight: false,
                    lowlight: false
                })
        })
        
        return;
    }

    return townTableEventService;
}])
