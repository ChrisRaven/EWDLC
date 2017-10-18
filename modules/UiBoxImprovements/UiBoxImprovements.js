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
        top = clamp(top, 0, $(window).height() - $floatingControls.outerHeight());
        left = clamp(left, 0, $(window).width() - $floatingControls.outerWidth());

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

    function parsePx(px) {
        return parseInt(px.replace("px", "").trim(), 10);
    }

    function mutated(mutations) {
        mutations.forEach(function(mutation) {
            if(mutation.type !== "attributes" || mutation.attributeName !== "style") return;

            updateCoords();
        });
    }

    $(window).on("ewdlc-preferences-loading", function() {
        window.ewdlc.preferences.registerSetting(_floatinsp_top);
        window.ewdlc.preferences.registerSetting(_floatinsp_left);
        window.ewdlc.preferences.registerSetting(_floatinsp_cube_tab);
    });

    $(window).on("ewdlc-preferences-loaded", function() {
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
    
        $(window).resize(function() {
            updateCoords();
        });
    });

    $floatingControls.find("div.panel.player.selected").bind("DOMNodeInserted", "li", function() {
        var $li = $(this).children().last();
        var text = $li.text();

        if(text === "No Cube Selected") return;

        $li.on("click.floatinsp", function() {
            Profile.show({username: text});
        });
    });
}

function UiBoxImprovementsInit() {
    window.ewdlc.modules.uiBoxImprovements = window.ewdlc.modules.uiBoxImprovements || new UiBoxImprovements();
}

export {UiBoxImprovements}
export {UiBoxImprovementsInit}
