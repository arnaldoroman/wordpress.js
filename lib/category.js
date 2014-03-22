function Category(id, name, slug, parent, children, taxonomy) {
    this.id = id;
    this.name = name;
    this.slug = slug;
    this.parent = parent;
    this.children = children;
    this.taxonomy = taxonomy || 'category';
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

