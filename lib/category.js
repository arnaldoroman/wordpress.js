function Category(id, name, slug, parent, children) {
    this.id = id;
    this.name = name;
    this.slug = slug;
    this.parent = parent;
    this.children = children;
}

exports.Category = Category;

/**
 * Match a category slug against the current category and
 * any of its parents.
 *
 * @param {String} slug
 * @return {Boolean}
 */

Category.prototype.match = function (slug) {
    var category = this;
    do {
        if (category.slug === slug) {
            return true;
        }
    } while ((category = category.parent));
    return false;
};

