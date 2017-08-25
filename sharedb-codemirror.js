var CODE_MIRROR_OP_SOURCE = 'CodeMirror';

/**
 * @constructor
 * @param {CodeMirror} codeMirror - a CodeMirror editor instance
 * @param {Object} options - required. Options object with the following keys:
 *    - onOp(op, source): required. a function to call when a text OT op is
 *      produced by the editor. Note the second argument, `source`, which **must**
 *      be passed through to the ShareDB doc.
 *    - onStart(): optional. will be called when ShareDBCodeMirror starts listening
 *      (i.e., when `.start()` or `.setValue()` is called)
 *    - onStop(): optional. will be called when ShareDBCodeMirror stops listening
 *      (i.e., when `.stop()` is called)
 *    - verbose: optional. If provided and true, debug messages will be printed
 *      to the console.
 */
function ShareDBCodeMirror(codeMirror, options) {
  this.codeMirror = codeMirror;
  this.verbose = Boolean(options.verbose);
  this.onOp = options.onOp;
  this.onStart = options.onStart || function() {};
  this.onStop = options.onStop || function() {};

  this._started = false;
  this._suppressChange = false;
  this._changeListener = this._handleChange.bind(this);
}
module.exports = ShareDBCodeMirror;

/**
 * Attaches a ShareDB doc to a CodeMirror instance. You can also construct a
 * ShareDBCodeMirror instance directly if you'd like to wire things up
 * explicitly and have an abstraction layer between the two.
 *
 * @param {sharedb.Doc} shareDoc
 * @param {CodeMirror} codeMirror
 * @param {Object} options - configuration options:
 *    - key: string; required. The key in the ShareDB doc at which to
 *      store the CodeMirror value. Deeply nested paths are currently not
 *      supported.
 *    - verbose: optional. If provided and true, debug messages will be printed
 *      to the console.
 * @param {function(Object)=} callback - optional. will be called when everything
 *    is hooked up. The first argument will be the error that occurred, if any.
 * @return {ShareDBCodeMirror} the created ShareDBCodeMirror object
 */
ShareDBCodeMirror.attachDocToCodeMirror = function(shareDoc, codeMirror, options, callback) {
  var key = options.key;
  var verbose = Boolean(options.verbose);

  var shareDBCodeMirror = new ShareDBCodeMirror(codeMirror, {
    verbose: verbose,
    onStart: function() {
      shareDoc.on('op', shareDBOpListener);
    },
    onStop: function() {
      shareDoc.destroy();
    },
    onOp: function(op, source) {
      var docOp = [{p: [key], t: 'text', o: op}];

      if (verbose) {
        console.log('ShareDBCodeMirror: submitting op to doc:', docOp);
      }

      shareDoc.submitOp(docOp, source);
      shareDBCodeMirror.assertValue(shareDoc.data[key]);
    }
  });

  function shareDBOpListener(op, source) {
    for (var i = 0; i < op.length; i++) {
      var opPart = op[i];

      if (opPart.p && opPart.p.length === 1 && opPart.p[0] === key && opPart.t === 'text') {
        shareDBCodeMirror.applyOp(opPart.o, source);

      } else if (verbose) {
        console.log('ShareDBCodeMirror: ignoring op because of path or type:', opPart);
      }
    }

    shareDBCodeMirror.assertValue(shareDoc.data[key]);
  }

  shareDoc.subscribe(function(err) {
    if (err) {
      if (callback) {
        callback(err);
        return;
      } else {
        throw err;
      }
    }

    if (!shareDoc.type) {
      if (verbose) {
        console.log('ShareDBCodeMirror: creating as text');
      }
      var newDoc = {};
      newDoc[key] = '';
      shareDoc.create(newDoc);
    }

    if (verbose) {
      console.log('ShareDBCodeMirror: Subscribed to doc');
    }

    shareDBCodeMirror.setValue(shareDoc.data[key] || '');

    if (callback) {
      callback(null);
    }
  });

  return shareDBCodeMirror;
};

/**
 * Starts listening for changes from the CodeMirror instance. Calling `setValue`
 * will also call this, if necessary.
 */
ShareDBCodeMirror.prototype.start = function() {
  if (this._started) {
    return;
  }
  this.codeMirror.on('change', this._changeListener);
  this._started = true;
  this.onStart();
};

/**
 * Replaces the contents of the CodeMirror instance with the supplied text and
 * starts listening for changes.
 */
ShareDBCodeMirror.prototype.setValue = function(text) {
  if (!this._started) {
    this.start();
  }
  this._suppressChange = true;
  this.codeMirror.setValue(text);
  this._suppressChange = false;
};

/**
 * Convenience - returns the text in the CodeMirror instance.
 */
ShareDBCodeMirror.prototype.getValue = function() {
  return this.codeMirror.getValue();
};

/**
 * Asserts that the value in the CodeMirror instance matches the passed-in value.
 * If it does not, an error is logged and the value in CodeMirror is reset. This
 * should be called periodically with the value from the ShareDB doc to ensure
 * the value in CodeMirror hasn't diverged.
 *
 * @return {boolean} true if the passed-in value matches the value in the
 *    CodeMirror instance, false otherwise.
 */
ShareDBCodeMirror.prototype.assertValue = function(expectedValue) {
  var editorValue = this.codeMirror.getValue();

  if (expectedValue !== editorValue) {
    console.error(
      "Value in CodeMirror doesn't match expected value:\n\n",
      "Expected Value:\n", expectedValue,
      "\n\nEditor Value:\n", editorValue);

    this._suppressChange = true;
    this.codeMirror.setValue(expectedValue);
    this._suppressChange = false;

    return false;
  }

  return true;
};

/**
 * Applies the changes represented by the given text OT op. The op may be
 * ignored if it appears to be an echo of the most recently submitted local op.
 * In order to do this properly, the second argument, `source`, **must** be passed
 * in. This will be the second argument to an "op" listener on a ShareDB doc.
 */
ShareDBCodeMirror.prototype.applyOp = function(op, source) {
  if (source === undefined) {
    throw new Error("The 'source' argument must be provided");
  }

  if (!Array.isArray(op)) {
    throw new Error("Unexpected non-Array op for text document");
  }

  if (!this._started) {
    if (this.verbose) {
      console.log('ShareDBCodeMirror: op received while not running, ignored', op);
    }
    return;
  }

  if (source === true || source === CODE_MIRROR_OP_SOURCE) {
    if (this.verbose) {
      console.log('ShareDBCodeMirror: skipping local op', op);
    }
    return;
  }

  if (this.verbose) {
    console.log('ShareDBCodeMirror: applying op', op);
  }

  this._suppressChange = true;
  this._applyChangesFromOp(op);
  this._suppressChange = false;
};

/**
 * Stops listening for changes from the CodeMirror instance.
 */
ShareDBCodeMirror.prototype.stop = function() {
  if (!this._started) {
    return;
  }
  this.codeMirror.off('change', this._changeListener);
  this._started = false;
  this.onStop();
};

ShareDBCodeMirror.prototype._applyChangesFromOp = function(op) {
  var textIndex = 0;
  var codeMirror = this.codeMirror;

  op.forEach(function(part) {
    switch (typeof part) {
      case 'number': // skip n chars
        textIndex += part;
        break;
      case 'string': // "chars" - insert "chars"
        codeMirror.replaceRange(part, codeMirror.posFromIndex(textIndex));
        textIndex += part.length;
        break;
      case 'object': // {d: num} - delete `num` chars
        var from = codeMirror.posFromIndex(textIndex);
        var to = codeMirror.posFromIndex(textIndex + part.d);
        codeMirror.replaceRange('', from, to);
        break;
    }
  });
};

ShareDBCodeMirror.prototype._handleChange = function(codeMirror, change) {
  if (this._suppressChange) {
    return;
  }

  var op = this._createOpFromChange(change);

  if (this.verbose) {
    console.log('ShareDBCodeMirror: produced op', op);
  }

  this.onOp(op, CODE_MIRROR_OP_SOURCE);
};

ShareDBCodeMirror.prototype._createOpFromChange = function(change) {
  var codeMirror = this.codeMirror;
  var op = [];
  var textIndex = 0;
  var startLine = change.from.line;

  for (var i = 0; i < startLine; i++) {
    textIndex += codeMirror.lineInfo(i).text.length + 1; // + 1 for '\n'
  }

  textIndex += change.from.ch;

  if (textIndex > 0) {
    op.push(textIndex); // skip textIndex chars
  }

  if (change.to.line !== change.from.line || change.to.ch !== change.from.ch) {
    var delLen = 0;
    var numLinesRemoved = change.removed.length;

    for (var i = 0; i < numLinesRemoved; i++) {
      delLen += change.removed[i].length + 1; // +1 for '\n'
    }

    delLen -= 1; // last '\n' shouldn't be included

    op.push({d: delLen}) // delete delLen chars
  }

  if (change.text) {
    var text = change.text.join('\n');
    if (text) {
      op.push(text); // insert text
    }
  }

  return op;
};
