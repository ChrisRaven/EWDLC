function Tab(options) {
    options = options || {};

    var _name = options.name;
    var _prefix = options.prefix;
    var _scope = options.scope;
    var _unreadMessages = 0;

    var _this = this;
    var _$textElem = $("<span>").text(_name);
    var _$tabElem = $("<div>").addClass("chatTab").append(_$textElem)
    .append($("<span>").css("margin-left", "3px").addClass("sl-badge").text("0").hide())
    .append($("<i>").addClass("fa").addClass("fa-close").css("margin-left", "3px").hide());

    _this.getElement = function() {
        return _$tabElem;
    };

    _this.getPrefix = function () {
        return _prefix;
    };

    _this.getScope = function() {
        return _scope;
    };

    _this.getName = function() {
        return _name;
    };

    _this.getUnread = function() {
        return _unreadMessages;
    };

    _this.isPMTab = function() {
        return _prefix.startsWith("/pm");
    };

    _this.setName = function(nameToSet) {
        _name = nameToSet;
        _$tabElem.text(name);
    };

    _this.setActive = function(active) {
        if(active) {
            _unreadMessages = 0;
            _$tabElem.addClass("active");
        }
        else {
            _$tabElem.removeClass("active");
        }
    };

    _this.setUnread = function(unread) {
        if(!isNaN(unread) && unread >= 0) {
            _unreadMessages = unread;
            let $span = _$tabElem.children("span.sl-badge");
            $span.text(_unreadMessages);

            if(_unreadMessages > 0) {
                $span.show();
            } else {
                $span.hide();
            }
        }
    };

    _this.close = function() {
        _$tabElem.removeClass("active").addClass("disabled");
        _$tabElem.css("margin-left", -_$tabElem.outerWidth() + "px");
    };

    _this.open = function() {
        _$tabElem.removeClass("disabled");
        _$tabElem.css("margin-left", "0px");
    };

    if(_prefix.startsWith("/pm")) {
        _$tabElem.children("i").show();
        $.get("/1.0/player/" + _scope + "/bio").done(function(data) {
            if($(".chatInput").val().startsWith(_prefix)) {
                $(".chatInput").val("/pm " + data.username + " " + $(".chatInput").val().substring(_prefix.length));
            }
            _scope = data.username;
            _prefix = "/pm " + data.username + " ";
            _$textElem.text(_scope);
        });
    }
}