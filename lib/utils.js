var utils = exports;

/**
 * Create a multiline string.
 *
 * @param {Function} str
 * @return {String} str
 */

utils.multiline = function (str) {
    var match = str.toString().match(/\{\/\*([^]*)\*\/\}$/);
    if (!match) {
        throw new TypeError('Invalid multiline string');
    }
    return match[1].trim().replace(/\n/g, ' ').replace(/  +/g, ' ');
};

/**
 * Create a copy of an object.
 *
 * @param {Object} obj
 * @return {Object} copy
 */

utils.copy = function () {
    var result = {};
    Array.prototype.slice.call(arguments).forEach(function (obj) {
        for (var key in obj) {
            if (typeof result[key] === 'undefined') {
                result[key] = obj[key];
            }
        }
    });
    return result;
};

