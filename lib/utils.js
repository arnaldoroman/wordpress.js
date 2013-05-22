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
    if (!remaining) {
        return callback();
    }
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

/**
 * Strip HTML tags.
 *
 * @param {String} html
 * @return {String} text
 */

utils.stripTags = function (html) {
    html = html.replace(/<\/?[^>]+>/g, ' ');
    html = html.replace(/\[(caption|url)[^\]]*\].+?\[\/\1\]/g, '');
    return html.replace(/ +/g, ' ').trim();

};

/**
 * Get a truncated excerpt.
 *
 * @param {String} str
 * @param {Number} max_length
 * @return {String} excerpt
 * @api public
 */

utils.excerpt = function (excerpt, max_length) {
    excerpt = utils.stripTags(excerpt || '').replace(/^https?:\/\/[^ ]+/, '');
    if (excerpt.length > max_length) {
        var truncated = '', len = 0;
        excerpt.split(/[ \-]/).forEach(function (word) {
            var word_len = word.length;
            if (len + word_len + 1 < max_length) {
                truncated += ' ' + word;
                len += word_len + 1;
            }
        });
        excerpt = truncated.trim() + '...';
    }
    return excerpt;
};

/**
 * Diff an object and get keys that were changed, added or removed.
 *
 * @param {Object} prev
 * @param {Object} next
 * @param {Function} callback - receives (changed, added, deleted)
 */

utils.diff = function (prev, next, callback) {
    var added = [], changed = [], deleted = [], key;
    for (key in next) {
        if (!(key in prev)) {
            added.push(key);
        } else if (!utils.deepEqual(next[key], prev[key])) {
            changed.push(key);
        }
    }
    for (key in prev) {
        if (!(key in next)) {
            deleted.push(key);
        }
    }
    callback(changed, added, deleted);
};

/**
 * Check if two values are equal.
 *
 * Borrowed from:
 *   https://github.com/joyent/node/blob/master/lib/assert.js
 *
 * @param {Mixed} a
 * @param {Mixed} b
 */

/*jshint -W116 */

utils.deepEqual = function (a, b) {
    if (a === b) {
        return true;
    } else if (Buffer.isBuffer(a) && Buffer.isBuffer(b)) {
        if (a.length !== b.length) {
            return false;
        }
        for (var i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    } else if (a instanceof Date && b instanceof Date) {
        return a.getTime() === b.getTime();
    } else if (typeof a !== 'object' && typeof b !== 'object') {
        return a == b;
    } else {
        return utils.objEqual(a, b);
    }
};

/*jshint +W116 */

/**
 * Check if two objects are equal
 *
 * Borrowed from:
 *   https://github.com/joyent/node/blob/master/lib/assert.js
 *
 * @param {Object} a
 * @param {Object} b
 */

utils.objEqual = function (a, b) {
    if ((a === null && b === null) || (a === undefined && b === undefined)) {
        return true;
    } else if (a.prototype !== b.prototype) {
        return false;
    }
    var ka, kb, key, i;
    try {
        ka = Object.keys(a);
        kb = Object.keys(b);
    } catch (e) {
        return false;
    }
    if (ka.length !== kb.length) {
        return false;
    }
    ka.sort();
    kb.sort();
    for (i = ka.length - 1; i >= 0; i--) {
        if (ka[i] !== kb[i]) return false;
    }
    for (i = ka.length - 1; i >= 0; i--) {
        key = ka[i];
        if (!utils.deepEqual(a[key], b[key])) return false;
    }
    return true;
};

