require('./mocks/browser-env');
var assert = require('assert');
var CodeMirror = require('codemirror');
var ShareDBCodeMirror = require('..');
var MockDoc = require('./mocks/mock-doc');

function createCodeMirror(shareDoc, callback) {
  document.body.innerHTML = '<textarea id="editor"></textarea>';
  var codeMirror = CodeMirror.fromTextArea(document.getElementById('editor'));
  ShareDBCodeMirror.attachDocToCodeMirror(shareDoc, codeMirror, callback);
  return codeMirror;
}

describe('Creation', function () {
  var doc, codeMirror;

  beforeEach(function (done) {
    doc = new MockDoc('hi');
    codeMirror = createCodeMirror(doc, done);
  });

  it('sets doc text in editor', function () {
    assert.equal('hi', codeMirror.getValue());
  });

  describe('fresh doc', function () {
    beforeEach(function (done) {
      doc = new MockDoc('');
      doc.type = null;
      codeMirror = createCodeMirror(doc, done);
    });

    it('creates the doc as text', function () {
      assert.equal('text', doc.type && doc.type.name);
    });
  });
});

describe('CodeMirror edits', function () {
  var doc, codeMirror;

  beforeEach(function (done) {
    doc = new MockDoc('');
    codeMirror = createCodeMirror(doc, done);
  });

  it('adds text', function () {
    var text = "aaaa\nbbbb\ncccc\ndddd";
    codeMirror.setValue(text);
    assert.equal(text, doc.data);
  });

  it('adds empty text', function () {
    codeMirror.setValue('');
    assert.equal('', doc.data);

    codeMirror.setValue('a');
    assert.equal('a', doc.data);
  });

  describe('with text in doc', function () {
    beforeEach(function (done) {
      doc = new MockDoc('three\nblind\nmice\nsee\nhow\nthey\nrun\n');
      codeMirror = createCodeMirror(doc, done);
    });

    it('replaces a couple of lines', function () {
      codeMirror.replaceRange('evil\nrats\n', {line: 1, ch: 0}, {line: 3, ch: 0});
      assert.equal('three\nevil\nrats\nsee\nhow\nthey\nrun\n', doc.data);
    });
  });
});

describe('ShareJS changes', function () {
  var doc, codeMirror;

  beforeEach(function(done) {
    doc = new MockDoc('');
    codeMirror = createCodeMirror(doc, done);
  });

  it('adds text', function () {
    var text = "aaaa\nbbbb\ncccc\ndddd";
    doc.submitOp([text], false);
    assert.equal(text, codeMirror.getValue());
  });

  it('can edit a doc that has been empty', function () {
    doc.submitOp([''], false);
    assert.equal('', codeMirror.getValue());

    doc.submitOp(['a'], false);
    assert.equal('a', codeMirror.getValue());
  });

  describe('with one line in the doc', function () {
    beforeEach(function (done) {
      doc = new MockDoc('hi');
      codeMirror = createCodeMirror(doc, done);
    });

    it('replaces a line', function () {
      doc.submitOp([{d: 2}, 'hello'], false);
      assert.equal('hello', codeMirror.getValue());
    });
  });

  describe('with multiple lines in the doc', function() {
    beforeEach(function (done) {
      doc = new MockDoc('three\nblind\nmice\nsee\nhow\nthey\nrun\n');
      codeMirror = createCodeMirror(doc, done);
    });

    it('replaces a couple of lines', function () {
      doc.submitOp([6, {d: 11}, 'evil\nrats\n'], false);
      assert.equal('three\nevil\nrats\nsee\nhow\nthey\nrun\n', codeMirror.getValue());
    });
  });
});

describe('ShareDBCodeMirror', function() {
  var doc, codeMirror, shareDBCodeMirror;

  beforeEach(function (done) {
    doc = new MockDoc('stuff');
    document.body.innerHTML = '<textarea id="editor"></textarea>';
    codeMirror = CodeMirror.fromTextArea(document.getElementById('editor'));
    shareDBCodeMirror = ShareDBCodeMirror.attachDocToCodeMirror(doc, codeMirror, done);
  });

  describe('getValue', function () {
    it('gets the value from CodeMirror', function () {
      assert.equal('stuff', shareDBCodeMirror.getValue());
    });
  });

  describe('stop', function () {
    beforeEach(function () {
      shareDBCodeMirror.stop();
    });

    it('stops listening to CodeMirror changes', function () {
      codeMirror.setValue('blah');
      assert.equal('stuff', doc.data);
    });

    it('ignores incoming ops', function () {
      doc.submitOp([doc.data.length, ' more stuff'], false);
      assert.equal('stuff', codeMirror.getValue());
    });
  });
});
