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

