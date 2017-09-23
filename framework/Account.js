function Account(username) {
    var _this = this;
    var _username = username;
    var _roles = {};
    var _isReady = false;

    function _readAccountData(data) {
        _username = data.username;

        let roles = data.roles;

        if(roles.indexOf("admin") >= 0) {
            _roles.isAdmin = true;
        }
        if(_roles.isAdmin || roles.indexOf("scout") >= 0) {
            _roles.isScout = true;
        }
        if(_roles.isAdmin || roles.indexOf("scythe") >= 0) {
            _roles.isScythe = true;
        }
        if(_roles.isAdmin || roles.indexOf("mystic") >= 0) {
            _roles.isMystic = true;
        }
        if(_roles.isAdmin || roles.indexOf("moderator") >= 0) {
            _roles.isModerator = true;
        }
        if(_roles.isAdmin || roles.indexOf("mentor") >= 0) {
            _roles.isMentor = true;
        }
    }

    _this.getUsername = function() {
        return _username;
    };

    _this.isScout = function() {
        return _roles.isScout;
    }

    _this.isScythe = function() {
        return _roles.isScythe;
    }

    _this.isMystic = function() {
        return _roles.isMystic;
    }

    _this.isModerator = function() {
        return _roles.isModerator;
    }

    _this.isMentor = function() {
        return _roles.isMentor;
    }

    _this.isAdmin = function() {
        return _roles.isAdmin;
    }

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

EWDLC.Account = Account;