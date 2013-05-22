var utils = require('./utils');

function Post(id, title, content, excerpt, date, modified, name, image, meta) {
    this.id = id;
    this.title = title;
    this.content = content;
    this.excerpt = excerpt;
    this.date = date;
    this.modified = modified;
    var year = date.getFullYear()
      , month = date.getMonth() + 1;
    if (month <= 9) {
        month = '0' + month;
    }
    this.slug = '/' + year + '/' + month + '/' + (name || utils.slug(title));
    this.image = image;
    if (meta) {
        for (var key in meta) {
            this['meta_' + key] = meta[key];
        }
    }
}

exports.Post = Post;

