function Category(id, name, slug, parent, children) {
    this.id = id;
    this.name = name;
    this.slug = slug;
    this.parent = parent;
    this.children = children;
}

exports.Category = Category;

