function Account(username) {
    var _this = this;
    var _username = username;
    var _isReady = false;

    _this.getUsername = function() {
        return _username;
    };

    _this.isReady = function() {
        return _isReady;
    };

    _this.setReady = function (val) {
      _isReady = val;
    };
}

export { Account }
