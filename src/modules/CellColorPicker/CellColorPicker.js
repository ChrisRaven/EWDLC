import { ColorPickerView } from "./ColorPickerView.js"
import { Setting } from "../../framework/Setting.js"

function CellColorPicker() {
    var _view = null;
    var _this = this;
    var _$showButton;

    var _setting = new Setting("prvw-colors", $.extend({}, Cell.ScytheVisionColors));

    var _tasks;
    var _groups;
    var _tasksRequest;
    var _heatmapRequest;
    var _requestsDone;
    var _isOpen;
    var _order = [];
    var _cell;
    var _originalColorFunc;
    var _originalUpdateFunc;

    var _accountReady = $.Deferred();
    var _settingsReady = $.Deferred();
    var _spectrumReady = $.Deferred();

    function start() {
        if(_tasksRequest) _tasksRequest.abort();
        if(_heatmapRequest) _heatmapRequest.abort();

        _tasks = [];
        _groups = {};

        _cell = tomni.getCurrentCell();
        _originalColorFunc = _cell.resetTaskColors;
        _originalUpdateFunc = _cell.updateCompleteColoring;
        _cell.resetTaskColors = function() {};
        _cell.updateCompleteColoring = function() {};

        if(_cell.info.tags.ReapGrow) {
            _order = [
                "scythed",
                "complete1",
                "complete2",
                "complete3",
                "review",
                "reap",
                "duplicate",
                "frozen",
                "scythefrozen"
            ];
        } else {
            _order = [
                "complete1",
                "complete2",
                "complete3",
                "review",
                "scythed",
                "reap",
                "duplicate",
                "frozen",
                "scythefrozen"
            ]
        }

        _isOpen = true;
        _view.show();

        _requestsDone = false;

        _tasksRequest = $.getJSON("/1.0/cell/" + tomni.cell + "/tasks").done(processTasks);
        _heatmapRequest = $.getJSON("/1.0/cell/" + tomni.cell + "/heatmap/scythe").done(processHeatmap);

        $.when(_tasksRequest, _heatmapRequest).done(function() {
            _requestsDone = true;
            applyColors();
        });
    }

    function stop() {
        // Do some cleanup
        _isOpen = false;

        if(_tasksRequest)
            _tasksRequest.abort();
        if(_heatmapRequest)
            _heatmapRequest.abort();

        _tasksRequest = null;
        _heatmapRequest = null;

        if(_cell) {
            _cell.updateCompleteColoring = _originalUpdateFunc;
            _cell.resetTaskColors = _originalColorFunc;
            _cell.resetTaskColors({hard: true});
        }

        _originalColorFunc = null;
        _cell = null;

        _tasks = null;
        _groups = null;
        _order = null;

        _requestsDone = false;
    }

    function save() {
        _setting.setValue($.extend({}, _setting.getValue(), _view.getColors()));
    }

    function applyColors() {
        if(!_isOpen || !_requestsDone) return;

        var colors = _view.getColors();

        _cell.colorCubes({cubeids: _tasks, color: ColorUtils.hexToRGB(colors.base), blending: 1});

        for(var i = 0; i < _order.length; i++) {
            _cell.colorCubes({cubeids: _groups[_order[i]], color: ColorUtils.hexToRGB(colors[_order[i]]), blending: 1});
        }

        _cell.render();
    }

    function processTasks(tasks) {
        _tasks = tasks.tasks.map((task) => task.id);
    }

    function processHeatmap(heatmap) {
        _groups.scythed = heatmap.scythed;
        _groups.reap = heatmap.reaped;

        _groups.complete1 = heatmap.complete.filter((task) => task.votes == 1).map((task) => task.id);
        _groups.complete2 = heatmap.complete.filter((task) => task.votes == 2).map((task) => task.id);
        _groups.complete3 = heatmap.complete.filter((task) => task.votes >= 1000000).map((task) => task.id);

        _groups.review = heatmap.review;
        _groups.frozen = heatmap.frozen;
        _groups.scythefrozen = heatmap.scythe_frozen;
        _groups.duplicate = heatmap.duplicate;
    }

    jQuery.cachedScript = function (url, options) {
        options = $.extend(options || {}, {
            dataType: "script",
            cache: true,
            url: url
        });

        return jQuery.ajax(options);
    };

    $("<link>").attr("rel", "stylesheet").attr("href", "https://cdnjs.cloudflare.com/ajax/libs/spectrum/1.8.0/spectrum.min.css").appendTo($("head"));
    $.cachedScript("https://cdnjs.cloudflare.com/ajax/libs/spectrum/1.8.0/spectrum.min.js").done(_spectrumReady.resolve);

    _this.getView = function() {
        return _view;
    }

    $(document).on("ewdlc-account-ready", _accountReady.resolve);

    $(document).on("ewdlc-preferences-loaded.cellColorPicker", _settingsReady.resolve);

    $.when(_accountReady, _settingsReady, _spectrumReady).then(function() {
        if(!account.can('scout scythe mystic admin')) return;

        _view = new ColorPickerView($.extend({}, Cell.ScytheVisionColors));
        _view.init();
        _view.setColors($.extend({}, _setting.getValue()));

        let $container = _view.getContainer();

        $container.on("prvw-exited.cellColorPicker", stop);
        $container.on("prvw-colors-changed.cellColorPicker", applyColors);
        $container.on("prvw-colors-saved.cellColorPicker", save);

        _$showButton = ewdlc.settingsUi.makeButton("Show Cell Color Picker");
        _$showButton.click(start);
    });

    $(document).on("ewdlc-preferences-loading.cellColorPicker", function() {
        ewdlc.preferences.registerSetting(_setting);
    });

    $(document).on("ewdlc-preferences-loaded.cellColorPicker", function() {
        $.extend(Cell.ScytheVisionColors, _setting.getValue());
    });
}

function CellColorPickerInit() {
    ewdlc.modules.cellColorPicker = ewdlc.modules.cellColorPicker || new CellColorPicker();
}

export {CellColorPickerInit}
export {CellColorPicker}