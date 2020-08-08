function MockDoc(text) {
  this.type = {name: 'text'};
  this.data = text || '';
  this.subscribed = false;
  this.errorOnSubscribe = null;
  this._opListeners = [];
}
module.exports = MockDoc;

MockDoc.prototype.subscribe = function(callback) {
  var doc = this;
  process.nextTick(function() {
    doc.subscribed = true;
    callback(doc.errorOnSubscribe);
  });
};

MockDoc.prototype.create = function(data, type, options, callback) {
  if (typeof type === 'function' || options || callback) {
    throw new Error('MockDoc does not support the "options" and "callback" arguments');
  }
  if (this.type) {
    throw new Error('Document already exists');
  }
  this.data = data;
  this.type = {name: type || 'json0'};
};

MockDoc.prototype.submitOp = function(component, options, callback) {
    if (typeof options === 'function' || callback) {
        throw new Error('MockDoc does not support an op callback');
    }
    if (!this.type) {
        throw new Error("Document hasn't been created yet");
    }

    this._applyOp(component);
    this._opListeners.forEach(function (f) { f(component, options && options.source); });
};

MockDoc.prototype._applyOp = function(op) {
  var doc = this;

  op.forEach(function(opPart) {
    if (!(opPart.p && opPart.p.length === 1 && opPart.t === 'text')) {
      throw new Error("MockDoc only supports ops that are text OT on a path of length one");
    }

    var text = doc.data[opPart.p[0]];
    var index = 0;

    opPart.o.forEach(function(textOpPart) {
      switch (typeof textOpPart) {
        case 'number': // skip n chars
          index += textOpPart;
          break;
        case 'string': // "chars" - insert "chars"
          text = text.slice(0, index) + textOpPart + text.slice(index);
          index += textOpPart.length;
          break;
        case 'object': // {d: num} - delete `num` chars
          text = text.slice(0, index) + text.slice(index + textOpPart.d);
          break;
      }
    });

    doc.data[opPart.p[0]] = text;
  });
};

MockDoc.prototype.on = function(event, listener) {
  if (event !== 'op') {
    throw new Error('MockDoc not prepared for event "' + event + '"');
  }
  this._opListeners.push(listener);
};

MockDoc.prototype.removeListener = function(event, listener) {
  if (event !== 'op') {
    throw new Error('MockDoc not prepared for event "' + event + '"');
  }

  var listenerIndex = this._opListeners.indexOf(listener);

  if (listenerIndex > -1) {
    this._opListeners.splice(listenerIndex, 1);
  }
};
