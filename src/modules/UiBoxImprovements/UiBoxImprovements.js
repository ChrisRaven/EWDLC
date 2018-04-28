import {Setting} from "../../framework/Setting.js"

function UiBoxImprovements() {
    var $floatingControls = $("#cubeInspectorFloatingControls");
    var observer = new MutationObserver(mutated);

    var _floatinsp_top = new Setting("uibox-top", null, null);
    var _floatinsp_left = new Setting("uibox-left", null, null);
    var _floatinsp_cube_tab = new Setting("uibox-cube-tab", false, false);

    function clamp(number, min, max) {
        return Math.max(min, Math.min(number, max));
    }

    function setCoords(top, left) {
        observer.disconnect();
        $floatingControls.css("top", top + "px");
        $floatingControls.css("left", left + "px");
        observer.observe(document.getElementById("cubeInspectorFloatingControls"), {attributes: true});
    }

    function clampAndSetCoords(top, left) {
        top = clamp(top, 0, $(document).height() - $floatingControls.outerHeight());
        left = clamp(left, 0, $(document).width() - $floatingControls.outerWidth());

        setCoords(top, left);

        _floatinsp_top.setValue(top);
        _floatinsp_left.setValue(left);
    }

    function updateCoords() {
        var top = $floatingControls.css("top");
        var left = $floatingControls.css("left");

        if(top === "auto" || left === "auto" || left.includes("%")) return;

        clampAndSetCoords(parsePx(top), parsePx(left));
    }

    function linkifyCubes(elem, observer) {
        var cubesText = elem.text();

        if(cubesText === '-')
            return;

        elem.empty();

        var cubes = cubesText.split(", ");

        for(var i = 0; i < cubes.length; i++) {
            var $span = $("<span>").addClass("link");
            var cubeNum = parseInt(cubes[i], 10);

            $span.text(cubes[i]);
            $span.data("target", cubeNum);

            $span.click(function(e) {
                $(this).addClass("clicked");
                tomni.jumpToTaskID($(this).data("target"));
                e.stopPropagation();
            });

            elem.append($span);
            if(i < cubes.length - 1)
                elem.append(", ");
        }

        observer.takeRecords();
    }

    function bindLinkifier(elem) {
        elem.addClass("tc");

        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if(mutation.addedNodes.length == 0) return;
                
                var $target = $(mutation.target);

                if(elem.children(".link").length > 0) return;

                linkifyCubes($target, observer);
            });
        });

        observer.observe(elem[0], { childList: true, characterData: true });
    }

    function parsePx(px) {
        return parseInt(px.replace("px", "").trim(), 10);
    }

    function mutated(mutations) {
        mutations.forEach(function(mutation) {
            if(mutation.type !== "attributes" || mutation.attributeName !== "style") return;

            updateCoords();
        });
    }

    $(document).on("ewdlc-preferences-loading", function() {
        ewdlc.preferences.registerSetting(_floatinsp_top);
        ewdlc.preferences.registerSetting(_floatinsp_left);
        ewdlc.preferences.registerSetting(_floatinsp_cube_tab);
    });

    $(document).on("ewdlc-preferences-loaded", function() {
        if(_floatinsp_top.getValue() != null && _floatinsp_left.getValue() != null) {
            clampAndSetCoords(_floatinsp_top.getValue(),_floatinsp_left.getValue());
        }
    
        var $cubeButton = $floatingControls.find(".info > .cube.minimalButton");
    
        if(_floatinsp_cube_tab.getValue()) {
            $cubeButton.click();
        } else {
            $floatingControls.find(".info > .player.minimalButton").click();
        }
    
        var tabObserver = new MutationObserver(function(mutations) {mutations.forEach(function(mutation) {
            if(mutation.type !== "attributes" || mutation.attributeName !== "class") return;
    
            _floatinsp_cube_tab.setValue($cubeButton.hasClass("selected"));
        });});
        tabObserver.observe($cubeButton.get(0), {attributes: true});
    
        observer.observe(document.getElementById("cubeInspectorFloatingControls"), {attributes: true});
    
        $(document).resize(function() {
            updateCoords();
        });
    });

    // The selector might be empty at this point, so create an interval to check it every half a second
    var intervalId = setInterval(function () {
        if($floatingControls.length == 0) {
            $floatingControls = $("#cubeInspectorFloatingControls");
            return;
        }
        $floatingControls.find("div.panel.player.selected").bind("DOMNodeInserted", "li", function () {
            let $li = $(this).children().last();
            let text = $li.text();

            let color;

            if($li.hasClass("admin")) {
                color = Cell.ScytheVisionColors.reap;
            } else if($li.hasClass("scythe")) {
                color = Cell.ScytheVisionColors.scythed;
            } else if($li.hasClass("complete")) {
                color = Cell.ScytheVisionColors.complete2;
            } else if($li.hasClass("scout")) {
                color = Cell.ScytheVisionColors.review;
            }

            if(color) {
                $li.css("color", color);
            }

            if (text === "No Cube Selected") return;

            $li.on("click.floatinsp", function () {
                Profile.show({
                    username: text
                });
            });
        });

        bindLinkifier($floatingControls.find(".panel.cube > .parent_task > .value"));
        bindLinkifier($floatingControls.find(".panel.cube > .child_tasks > .value"));

        clearInterval(intervalId);
    }, 500);
}

function UiBoxImprovementsInit() {
    ewdlc.modules.uiBoxImprovements = ewdlc.modules.uiBoxImprovements || new UiBoxImprovements();
}

export {UiBoxImprovements}
export {UiBoxImprovementsInit}
