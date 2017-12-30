import { Setting } from "./Setting.js"

function SettingsUi() {
    var _this = this;
    var _$container;

    function makeContainer() {
        _$container = $("<div>").addClass("settings-group invisible");
        $("<h1>").text("EyeWire DLC").appendTo(_$container);

        _$container.appendTo("#settingsMenu");
    }

    _this.makeCheckbox = function(setting, desc) {
        if(!setting || !(setting instanceof Setting) || !desc) return;

        if(!_$container) makeContainer();

        let $setting = $("<div>").addClass("setting");
        $("<span>").text(desc).appendTo($setting);

        let $input = $("<input>").attr("type", "checkbox").hide().appendTo($setting);

        $input.prop("checked", setting.getValue() ? true : false);

        $input.checkbox().each(function () {
            var elem = $(this);
            
            if (setting.getValue()) {
                elem.removeClass("off").addClass("on");
            } else {
                elem.removeClass("on").addClass("off");
            }
        });
        $input.change(function (e) {
            e.stopPropagation();
            var elem = $(this);
            setting.setValue(elem.is(":checked"));
        });
        $setting.find(".checkbox").click(function (e) {
            var elem = $input;
            elem.prop("checked", !elem.is(":checked"));
            elem.change();
        });
        $setting.click(function (e) {
            e.stopPropagation();
            var elem = $input;
            elem.prop("checked", !elem.is(":checked"));
            elem.change();
        });

        var $firstButton = _$container.find(".setting > .minimalButton").first();

        if($firstButton.length > 0)
            $setting.insertBefore($firstButton.parent());
        else
            $setting.appendTo(_$container);
    }

    _this.makeButton = function(name) {
        if(!name) return;

        if(!_$container) makeContainer();

        let $setting = $("<div>").addClass("setting");
        let $button = $("<div>").addClass("minimalButton").text(name).appendTo($setting);
        $setting.appendTo(_$container);

        return $button;
    }
}

export { SettingsUi }
