function Metadata(attributes, terms) {
    for (var key in attributes) {
        this[key] = attributes[key];
    }
    Object.defineProperty(this, 'terms', {
        value: terms
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
 * A helper for identifying an array of terms.
 */

Metadata.prototype.hashTermChildren = function (children) {
    return (children || []).map(function (term) {
        return term.id;
    }).join(',');
};

