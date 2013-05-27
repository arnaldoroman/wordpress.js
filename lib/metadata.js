var utils = require('./utils');

function Metadata(attributes, terms, archive) {
    attributes = attributes || {};
    for (var key in attributes) {
        this[key] = attributes[key];
    }
    Object.defineProperty(this, 'terms', {
        value: terms || {}
      , enumerable: false
    });
    Object.defineProperty(this, 'archive', {
        value: archive || []
      , enumerable: false
    });
}

exports.Metadata = Metadata;

/**
 * Sync term changes.
 *
 * @param {Object} terms
 */

Metadata.prototype.syncTerms = function (current) {
    var previous = this.terms
      , changed, id, self = this;
    for (id in previous) {
        if (!(id in current)) {
            changed = true;
            delete previous[id];
        } else if (current[id].name !== previous[id].name) {
            changed = true;
            previous[id].name = current[id].name;
        } else if (current[id].slug !== previous[id].slug) {
            changed = true;
            previous[id].slug = current[id].slug;
        }
    }
    var added = [], existing = [];
    for (id in current) {
        if (!(id in previous)) {
            changed = true;
            previous[id] = current[id];
            added.push(current[id]);
        } else {
            existing.push(id);
        }
    }
    existing.forEach(function (id) {
        if (!current[id].children) {
            delete previous[id].children;
            return;
        }
        var previous_children = previous[id].children;
        previous[id].children = current[id].children.map(function (child) {
            return previous[child.id];
        });
        if (!changed) {
            changed = self.hashTermChildren(previous_children) !==
                self.hashTermChildren(previous[id].children);
        }
    });
    added.forEach(function (term) {
        if (term.children) {
            term.children = term.children.map(function (child) {
                return previous[child.id];
            });
        }
    });
    for (id in previous) {
        if (previous[id].parent) {
            previous[id].parent = previous[previous[id].parent.id];
        }
    }
    return changed;
};

/**
 * Update the archive when a post is removed.
 *
 * @param {Post} post
 * @return {Boolean} changed
 */

Metadata.prototype.removeArchivePost = function (post) {
    var year = post.date.getFullYear();
    if (year <= 1970) {
        return;
    }
    var month = post.date.getMonth() + 1;
    for (var i = 0, archive_year, len = this.archive.length; i < len; i++) {
        archive_year = this.archive[i].year;
        if (archive_year.year === year) {
            for (var j = 0, archive_month, mlen = this.archive[i].months.length; j < mlen; j++) {
                archive_month = this.archive[i].months[j];
                if (Number(archive_month.month) === month) {
                    if (!--archive_month.count) {
                        this.archive_months[i].months.splice(j, 1)
                        return true;
                    }
                    break;
                } else if (Number(archive_month.month) < month) {
                    break;
                }
            }
            break;
        } else if (archive_year.year < year) {
            break;
        }
    }
    return false;
};

/**
 * Update the archive when a post is added.
 *
 * @param {Post} post
 * @return {Boolean} changed
 */

Metadata.prototype.addArchivePost = function (post) {
    var year = post.date.getFullYear();
    if (year <= 1970) {
        return;
    }
    var month = post.date.getMonth() + 1;
    var archive_entry = {
        year: year
      , months: [
            { month: utils.pad(month), count: 1 }
        ]
    };
    for (var i = 0, archive_year, len = this.archive.length; i < len; i++) {
        archive_year = this.archive[i].year;
        if (archive_year.year === year) {
            for (var j = 0, archive_month, mlen = this.archive[i].months.length; j < mlen; j++) {
                archive_month = this.archive[i].months[j];
                if (Number(archive_month.month) === month) {
                    archive_month.count++;
                    return false;
                } else if (Number(archive_month.month) < month) {
                    this.archive_months[i].months.splice(j, 0, archive_entry.months[0]);
                    return true;
                }
            }
            this.archive_months[i].months.push(archive_entry.months[0]);
            return true;
        } else if (archive_year.year < year) {
            this.archive.splice(i, 0, archive_entry);
            return true;
        }
    }
    this.archive.push(archive_entry);
    return true;
};

/**
 * A helper for identifying an array of terms.
 */

Metadata.prototype.hashTermChildren = function (children) {
    return (children || []).map(function (term) {
        return term.id;
    }).join(',');
};

