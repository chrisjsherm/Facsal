String.prototype.isNullOrWhiteSpace = function () {
    return this === null || this.match(/^\s*$/) !== null;
}