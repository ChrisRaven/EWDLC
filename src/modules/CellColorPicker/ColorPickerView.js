function ColorPickerView(_defaults) {
    var _this = this;
    var _isInit = false;

    var _isCollapsed = false;
    var _isExit = false;

    var _$mainContainer;
    var _$collapseButton;

    var _$save;
    var _$discard;
    var _$default;
    var _$exit;

    var _colors = {};
    var _initialColors = {};
    var _currentColors = {};

    var _colorLang = [
        {key: "complete1", lang: "1 SC Vote"},
        {key: "complete2", lang: "2 SC Votes"},
        {key: "complete3", lang: "Admin SC"},
        {key: "review", lang: "Review"},
        {key: "scythed", lang: "Scythed"},
        {key: "reap", lang: "Reaped"},
        {key: "frozen", lang: "Frozen"},
        {key: "scythefrozen", lang: "Scythe Frozen"},
        {key: "duplicate", lang: "Duplicate"},
        {key: "base", lang: "Base"}
    ];

    function makeAction($container, name) {
        return $("<div>").addClass("minimalButton").attr("id", "prvw-action").text(name).appendTo($container);
    }

    function makeColors($container) {
        for(var i = 0; i < _colorLang.length; i++) {
            let $color = $("<div>").attr("id", "prvw-color").text(_colorLang[i].lang);
            let key = _colorLang[i].key;

            let $input = $("<input>").attr("type", "text").appendTo($color);

            $input.spectrum({
                showInitial: true,
                showInput: true,
                preferredFormat: "hex",
                replacerClassName: "prvw-spectrum",
                move: function(color) {
                    _currentColors[key] = color.toHexString();
                    _$mainContainer.trigger("prvw-colors-changed");
                }
            })

            $color.appendTo($container);

            _colors[_colorLang[i].key] = $input;
        }
    }

    function fillTopContainer($topContainer) {
        let $colorContainer = $("<div>").attr("id", "prvw-colors").appendTo($topContainer);
        let $actionContainer = $("<div>").attr("id", "prvw-actions").appendTo($topContainer);

        makeColors($colorContainer);

        _$save = makeAction($actionContainer, "Save");
        _$discard = makeAction($actionContainer, "Discard");
        _$default = makeAction($actionContainer, "Default");
        _$exit = makeAction($actionContainer, "Exit Preview");

        $("<div>").css("padding-left", "10px")
                  .css("padding-bottom", "5px")
                  .text("Note: Saved changes will take effect only after refreshing.")
                  .appendTo($topContainer);
    }

    function fillBottomContainer($bottomContainer) {
        _$collapseButton = $("<div>").attr("id", "prvw-collapse").text("Preview Mode!").appendTo($bottomContainer);
    }

    function buildContainers() {
        _$mainContainer = $("<div>").attr("id", "prvw-container");
        
        let $topContainer = $("<div>").attr("id", "prvw-top").appendTo(_$mainContainer);
        let $bottomContainer = $("<div>").appendTo(_$mainContainer);

        fillTopContainer($topContainer);
        fillBottomContainer($bottomContainer);

        _$mainContainer.appendTo($(".gameBoard"));
    }

    function bindEvents() {
        _$collapseButton.click(function (e) {
            e.stopPropagation();

            if(_isExit) return;

            let options = {duration: 600, queue: false};

            if(_isCollapsed) {
                _$mainContainer.animate({top: 0}, options);
                _isCollapsed = false;
            } else {
                let target = _$mainContainer.outerHeight() - _$collapseButton.outerHeight() + 1;

                _$mainContainer.animate({top: -target}, options);
                _isCollapsed = true;
            }
        });

        _$mainContainer.on("keyup keydown keypress", function(e) {
            e.stopPropagation();
        });

        $(".sp-container").on("keyup keydown keypress", function(e) {
            e.stopPropagation();
        })

        _$discard.on("click", function(e) {
            e.stopPropagation();

            _this.setColors(_initialColors);
        })

        _$save.on("click", function(e) {
            e.stopPropagation();

            _initialColors = $.extend({}, _currentColors);
            _$mainContainer.trigger("prvw-colors-saved");
        });

        _$default.on("click", function(e) {
            e.stopPropagation();

            let cache = $.extend({}, _initialColors);
            _this.setColors(_defaults);
            _initialColors = cache;
        });

        _$exit.on("click", function(e) {
            e.stopPropagation();

            if(_isExit) return;

            let options = {duration: 600, queue: false, complete: function() {
                if(_isExit)
                    _$mainContainer.hide();
            }};

            _isExit = true;
            _$mainContainer.animate({top: -_$mainContainer.outerHeight()}, options);

            _$mainContainer.trigger("prvw-exited");
        });
    }

    _this.init = function() {
        if(_isInit) return;

        buildContainers();
        bindEvents();

        _$mainContainer.css("top", (-_$mainContainer.outerHeight()) + "px");
        _$mainContainer.hide();

        _isExit = true;

        _isInit = true;
    }

    _this.getColors = function() {
        return $.extend({}, _currentColors);
    }

    _this.setColors = function(colors) {
        if(!_isInit) return;

        colors = colors || {};

        for(let color in colors) {
            if(_colors[color]) {
                _colors[color].spectrum("set", colors[color]);
                _initialColors[color] = colors[color];
                _currentColors[color] = colors[color];
            }
        }

        _$mainContainer.trigger("prvw-colors-changed");
    }

    _this.getContainer = function() {
        return _$mainContainer;
    }

    _this.show = function() {
        if(!_isExit) return;

        _isExit = false;
        _isCollapsed = false;

        let options = {duration: 600, queue: false};

        _$mainContainer.show();
        _$mainContainer.animate({top: 0}, options);
    }
}

export { ColorPickerView }