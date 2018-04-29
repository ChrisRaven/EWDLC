function Account(username) {
    var _this = this;
    var _username = username;
    var _isReady = false;

    function _readAccountData(data) {
        _username = data.username;
    }

    _this.getUsername = function() {
        return _username;
    };

    _this.isReady = function() {
        return _isReady;
    }

    _this.refreshInfo = function() {
        return new Promise((resolve, reject) => {
            let url = "/1.0/player/";

            if(!_username) {
                url += "describe";
            } else {
                url += _username + "/bio";
            }

            $.getJSON(url)
                .done((data) => {_readAccountData(data); _isReady = true; resolve();})
                .fail(reject);
        });
    };
}

export { Account }
