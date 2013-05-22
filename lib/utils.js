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

