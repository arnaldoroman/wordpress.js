var utils = require('./utils');

/**
 * Create a new Post.
 */

function Post(id, title, content, excerpt, date, modified, name, image, meta) {
    this.id = id;
    this.title = title;
    this.content = content;
    this._excerpt = excerpt;
    this.date = date;
    this.modified = modified;
    this.slug = '/' + date.getFullYear() +
        '/' + utils.pad(date.getMonth() + 1) +
        '/' + (name || utils.slug(title));
    this.image = image;
    if (meta) {
        for (var key in meta) {
            this['meta_' + key] = meta[key];
        }
    }
}

exports.Post = Post;

/**
 * Select an excerpt for the post. If an excerpt isn't specified in the
 * constructor, one is generated from the post content.
 *
 * @return {String} excerpt
 */

Post.prototype.__defineGetter__('excerpt', function () {
    if (!this._excerpt) {
        this._excerpt = utils.excerpt(this.content, 80);
    }
    return this._excerpt;
});

