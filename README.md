**Wordpress.js** is an in-memory front-end to wordpress.

## Usage

Create a connection to the database. The library uses the non-blocking [mariasql](https://github.com/mscdex/node-mariasql) driver.

```javascript
var connection = new wordpress.Connection({
    host: 'localhost'
  , user: 'root'
  , password: ''
})
```

Create a blog instance

```javascript
var blog = new wordpress.Blog(connection, options);
```

Multisite installations are also supported

```javascript
var multisite = new wordpress.Multisite(connection, options);
multisite.getBlogs(function (err, blogs) {
    //...
});
```

Load the blog

```javascript
blog.load(function (err, posts, metadata) {
    //
});
```

The `posts` array contains published posts, sorted by date descending. Each post object contains `id`, `title`, `content`, `excerpt`, `date`, `modified`, `slug`, `image`, `tags`, `categories`.

The `metadata` object contains key/value pairs from the options table and `metadata.terms` contains the entire category/tag tree.

## Live updates

The `Watcher` class can be used to detect changes to the blog, such as new posts, updated posts, updated blog metadata, etc.

```javascript
var watcher = new wordpress.Watcher(blog);

watcher.on('load', function (posts, metadata) {
    //...
});

watcher.on('new_post', function (post) {
    //...
});
```

The following events are available to listeners

- **load** - called once when the blog is loaded - receives (posts, metadata)
- **new_post** - when a new post is published - receives (post)
- **updated_post** - when a published post is modified - receives (post)
- **removed_post** - when a published post is removed - receives (post)
- **updated_terms** - when the category/tag tree changes - receives (terms)
- **updated_metadata** - when a metadata key changes - receives (key, previous, current)
- **error** - when any sort of error occurs - receives (err)

## Custom types

The wrapper class for posts, metadata, tags, and categories can be overridden

```javascript
var blog = new wordpress.Blog(connection, {
    Post: MyCustomPostType
  , Tag: MyCustomTagType
  , Category: MyCustomCategoryType
  , Metadata: MyCustomMetadataType
});
```

See the [current types](https://github.com/sydneystockholm/wordpress.js/tree/master/lib) for more information.

## License (MIT)

Copyright (c) 2012 Sydney Stockholm <opensource@sydneystockholm.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

