var utils = require('./utils')
  , Category = require('./category').Category
  , Tag = require('./tag').Tag;

function Metadata(attributes, terms, options, users) {
    Object.defineProperty(this, 'terms', {
        value: terms || {}
      , enumerable: false
    });
    Object.defineProperty(this, 'options', {
        value: options || {}
      , enumerable: false
    });
    Object.defineProperty(this, 'users', {
        value: users || {}
      , enumerable: false
    });
    this.update(attributes);
    this.addDerivedFields();
}

exports.Metadata = Metadata;

/**
 * Update metadata.
 *
 * @param {Object} attributes
 * @return {Boolean} changed
 */

Metadata.prototype.update = function (attributes) {
    var changed = false;
    attributes = attributes || {};
    for (var key in attributes) {
        if (this[key] !== attributes[key]) {
            this[key] = attributes[key];
            changed = true;
        }
    }
    return changed;
};

/**
 * Add derived metadata fields
 */

Metadata.prototype.addDerivedFields = function () {
    var slugs = {}
      , categories = []
      , tags = []
      , taxonomies = {}
      , term, id;
    for (id in this.terms) {
        term = this.terms[id];
        if (term instanceof Tag) {
            tags.push(term);
        } else if (term instanceof Category) {
            categories.push(term);
            if (term.taxonomy !== 'category') {
                taxonomies[term.taxonomy] = true;
            }
            slugs[term.slug] = term;
        }
    }
    Object.defineProperty(this, 'categories', {
        value: categories
      , writable: true
      , enumerable: false
    });
    Object.defineProperty(this, 'tags', {
        value: tags
      , writable: true
      , enumerable: false
    });
    Object.defineProperty(this, 'taxonomies', {
        value: Object.keys(taxonomies)
      , writable: true
      , enumerable: false
    });
    Object.defineProperty(this, 'category_slugs', {
        value: slugs
      , enumerable: false
    });
    var sort = this.sortByName;
    this.categories.sort(sort);
    this.categories.forEach(function (category) {
        if (category.children) {
            category.children.sort(sort);
        }
    });
};

/**
 * Sync term changes.
 *
 * @param {Object} terms
 */

Metadata.prototype.syncTerms = function (current) {
    var previous = this.terms, removed
      , changed, id, self = this;
    for (id in previous) {
        if (!(id in current)) {
            changed = removed = true;
            delete this.category_slugs[previous[id].slug];
            delete previous[id];
        } else {
            if (current[id].name !== previous[id].name) {
                changed = true;
                previous[id].name = current[id].name;
            }
            if (current[id].slug !== previous[id].slug) {
                changed = true;
                delete this.category_slugs[previous[id].slug];
                previous[id].slug = current[id].slug;
                this.category_slugs[previous[id].slug] = previous[id];
            }
            if (previous[id].parent && !current[id].parent) {
                delete previous[id].parent;
                changed = true;
            } else if (current[id].parent && !previous[id].parent) {
                previous[id].parent = current[id].parent;
                changed = true;
            } else if (current[id].parent &&
                    previous[id].parent.id !== current[id].parent.id) {
                previous[id].parent = current[id].parent;
                changed = true;
            }
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
            if (previous[id].children && previous[id].children.length) {
                changed = true;
            }
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
        if (term instanceof Tag) {
            self.tags.push(term);
        } else if (term instanceof Category) {
            self.categories.push(term);
        }
        if (term.children) {
            term.children = term.children.map(function (child) {
                return previous[child.id];
            });
        }
        self.category_slugs[term.slug] = term;
    });
    for (id in previous) {
        if (previous[id].parent) {
            previous[id].parent = previous[previous[id].parent.id];
        }
    }
    if (removed) {
        this.categories = this.categories.filter(function (category) {
            return category.id in self.terms;
        });
        this.tags = this.tags.filter(function (tag) {
            return tag.id in self.terms;
        });
    }
    var taxonomies = {};
    this.categories.forEach(function (category) {
        if (category.taxonomy !== 'category') {
            taxonomies[category.taxonomy] = true;
        }
    });
    this.taxonomies = Object.keys(taxonomies);
    //Sort categories alphabetically
    this.categories.sort(this.sortByName);
    this.categories.forEach(function (category) {
        if (category.children) {
            category.children.sort(self.sortByName);
        }
    });
    return changed;
};

/**
 * Generate an archive index based on an array of posts.
 *
 * @param {Array} posts
 */

Metadata.prototype.generateArchive = function (posts) {
    var index = {}, archive = [];
    posts.forEach(function (post) {
        var year = post.date.getFullYear();
        if (!year || year <= 1970) {
            return;
        }
        var month = post.date.getMonth() + 1;
        if (!(year in index)) {
            index[year] = {};
        }
        if (!(month in index[year])) {
            index[year][month] = 1;
        } else {
            index[year][month]++;
        }
    });
    var years = Object.keys(index).map(Number).sort(utils.descending);
    years.forEach(function (year) {
        var months = Object.keys(index[year]).map(Number).sort(utils.descending);
        archive.push({
            year: year
          , months: months.map(function (month) {
                return {
                    month: utils.pad(month)
                  , count: index[year][month]
                };
            })
        });
    });
    Object.defineProperty(this, 'archive', {
        value: archive
      , enumerable: false
    });
};

/**
 * Update the archive when a post is removed.
 *
 * @param {Post} post
 * @return {Boolean} changed
 */

Metadata.prototype.removeArchivePost = function (post) {
    var year = post.date.getFullYear();
    if (!year || year <= 1970) {
        return;
    }
    var month = post.date.getMonth() + 1;
    for (var i = 0, archive_year, len = this.archive.length; i < len; i++) {
        archive_year = this.archive[i];
        if (archive_year.year === year) {
            for (var j = 0, archive_month, mlen = this.archive[i].months.length; j < mlen; j++) {
                archive_month = this.archive[i].months[j];
                if (Number(archive_month.month) === month) {
                    if (!--archive_month.count) {
                        this.archive[i].months.splice(j, 1);
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
    if (!year || year <= 1970) {
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
        archive_year = this.archive[i];
        if (archive_year.year === year) {
            for (var j = 0, archive_month, mlen = this.archive[i].months.length; j < mlen; j++) {
                archive_month = this.archive[i].months[j];
                if (Number(archive_month.month) === month) {
                    archive_month.count++;
                    return false;
                } else if (Number(archive_month.month) < month) {
                    this.archive[i].months.splice(j, 0, archive_entry.months[0]);
                    return true;
                }
            }
            this.archive[i].months.push(archive_entry.months[0]);
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
 * A helper for sorting a term array by name.
 */

Metadata.prototype.sortByName = function (a, b) {
    return a.name > b.name ? 1 : -1;
};

/**
 * A helper for identifying an array of terms.
 */

Metadata.prototype.hashTermChildren = function (children) {
    return (children || []).map(function (term) {
        return term.id;
    }).join(',');
};

