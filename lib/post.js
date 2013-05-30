var utils = require('./utils')
 , inherits = require('util').inherits;

/**
 * Create a new Post.
 */

function Post(id, title, content, excerpt, date, modified, name, image, metadata) {
    this.id = id;
    this.title = title;
    this._content = new PostContent(content);
    this._excerpt = excerpt;
    this.date = date;
    this.modified = modified;
    this.slug = '/' + date.getFullYear() +
        '/' + utils.pad(date.getMonth() + 1) +
        '/' + (name || utils.slug(title));
    this._image = image;
    if (metadata) {
        for (var key in metadata) {
            this[key] = metadata[key];
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
    if (this._excerpt) {
        return this._excerpt;
    }
    this.fallback_excerpt = true;
    var excerpt = this.excerpt = utils.excerpt(this.content, 80);
    return excerpt;
});

/**
 * Select a featured image for the post. If an image is not provided, use
 * the first image in the post.
 *
 * @return {String} image
 */

var img_tag = /<img[^>]+?src=(["'])([^\1]+?)\1/;

Post.prototype.__defineGetter__('image', function () {
    if (this._image) {
        return this._image;
    }
    this.fallback_image = true;
    var image = this.image = img_tag.test(this.content) ? RegExp.$2 : null;
    return image;
});

/**
 * Store post content in a buffer.
 *
 * @return {String} excerpt
 */

Post.prototype.__defineGetter__('content', function () {
    return this._content.toString();
});

function PostContent() {
    Buffer.apply(this, arguments);
}

inherits(PostContent, Buffer);

exports.PostContent = PostContent;

