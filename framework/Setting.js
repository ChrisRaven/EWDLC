// require defs.js

/**
 * Holds information about a setting
 * @constructor
 * @param {string} name The unique identifier of this setting
 * @param {*} [value] The initial value of this setting
 * @param {*} [dflt] The default value of this setting
 */
function Setting(name, value, dflt) {
    var _this = this;
    var _callbacks = new Set();
    var _name = name;
    var _default = dflt;
    var _value = value;

    /**
     * Returns the name of this setting
     * 
     * @return {string}
     */
    _this.getName = function() {
        return _name;
    };

    /**
     * Gets the default value of this function
     * 
     * @return {*}
     */
    _this.getDefault = function() {
        return _default;
    };

    /**
     * Sets the default value of this function
     * 
     * @param {*} def the new default value
     */
    _this.setDefault = function(def) {
        _default = def;
    };

    /**
     * Adds a callback to be invoked when the value of this setting changes
     * 
     * @param {settingChanged} callback The callback to add
     */
    _this.registerCallback = function(callback) {
        if(!callback || typeof(callback) !== typeof(Function)) return;

        _callbacks.add(callback);
    };

    /**
     * Removes a value change callback
     * 
     * @param {settingChanged} callback The callback to remove
     */
    _this.unregisterCallback = function(callback) {
        _callbacks.delete(callback);
    };

    /**
     * Gets the value held by this setting
     * 
     * @return {*}
     */
    _this.getValue = function() {
        return _value;
    };

    /**
     * Sets the value held by this setting and invokes the callbacks if it's changed
     * 
     * @param {*} value The value to set
     */
    _this.setValue = function(value) {
        if(_value === value) return;

        _value = value;
        _callbacks.forEach((callback) => callback(_name, _value));
    };

    /**
     * Resets the setting value to its default
     */
    _this.reset = function() {
        _this.setValue(_default);
    };
}

window.EWDLC.Setting = Setting;

/**
 * The callback structure for when a setting changes
 * 
 * @callback settingChanged
 * @param {string} name The name of the setting which changed
 * @param {*} value The new value of this setting
 */
