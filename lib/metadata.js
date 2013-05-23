function Metadata(attributes) {
    for (var key in attributes) {
        this[key] = attributes[key];
    }
}

exports.Metadata = Metadata;

