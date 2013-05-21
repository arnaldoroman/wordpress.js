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

/**
 * Create a slug.
 *
 * @param {String} str
 * @return {String} slug
 * @api public
 */

utils.slug = function slug(str) {
    var slug_str = str.toLowerCase()
                      .replace(/[^a-z0-9]/ig, '-')
                      .replace(/--+/g, '-')
                      .replace(/^-|-$/g, '');
    return slug_str;
};

/**
 * Execute functions in parallel.
 *
 * @param {Array} functions
 * @param {Function} callback
 */

utils.parallel = function (functions, callback) {
    var remaining = functions.length, complete = false
      , results = functions.map(function () {
        return null;
    });
    functions.forEach(function (fn, pos) {
        fn(function (err, result) {
            if (complete) {
                return;
            } else if (err) {
                complete = true;
                callback(err);
            } else {
                results[pos] = result;
                if (!--remaining) {
                    complete = true;
                    results.unshift(null);
                    callback.apply(null, results);
                }
            }
        });
    });
};

