require('./mocks/browser-env');
var assert = require('assert');
var CodeMirror = require('codemirror');
var ShareDBCodeMirror = require('..');
var MockDoc = require('./mocks/mock-doc');

function createCodeMirror(shareDoc, callback) {
  document.body.innerHTML = '<textarea id="editor"></textarea>';
  var codeMirror = CodeMirror.fromTextArea(document.getElementById('editor'));
  ShareDBCodeMirror.attachDocToCodeMirror(shareDoc, codeMirror, {key: 'content'}, callback);
  return codeMirror;
}

describe('Creation', function () {
  var doc, codeMirror;

  beforeEach(function (done) {
    doc = new MockDoc({content: 'hi'});
    codeMirror = createCodeMirror(doc, done);
  });

  it('sets doc text in editor', function () {
    assert.equal('hi', codeMirror.getValue());
  });

  describe('fresh doc', function () {
    beforeEach(function (done) {
      doc = new MockDoc({});
      doc.type = null;
      codeMirror = createCodeMirror(doc, done);
    });

    it('creates the doc', function () {
      assert.equal('json0', doc.type && doc.type.name);
    });
  });
});

describe('CodeMirror edits', function () {
  var doc, codeMirror;

  beforeEach(function (done) {
    doc = new MockDoc({content: ''});
    codeMirror = createCodeMirror(doc, done);
  });

  it('adds text', function () {
    var text = "aaaa\nbbbb\ncccc\ndddd";
    codeMirror.setValue(text);
    assert.equal(text, doc.data.content);
  });

  it('adds empty text', function () {
    codeMirror.setValue('');
    assert.equal('', doc.data.content);

    codeMirror.setValue('a');
    assert.equal('a', doc.data.content);
  });

  describe('with text in doc', function () {
    beforeEach(function (done) {
      doc = new MockDoc({content: 'three\nblind\nmice\nsee\nhow\nthey\nrun\n'});
      codeMirror = createCodeMirror(doc, done);
    });

    it('replaces a couple of lines', function () {
      codeMirror.replaceRange('evil\nrats\n', {line: 1, ch: 0}, {line: 3, ch: 0});
      assert.equal('three\nevil\nrats\nsee\nhow\nthey\nrun\n', doc.data.content);
    });
  });
});

describe('ShareJS changes', function () {
  var doc, codeMirror;

  beforeEach(function(done) {
    doc = new MockDoc({content: ''});
    codeMirror = createCodeMirror(doc, done);
  });

  it('adds text', function () {
    var text = "aaaa\nbbbb\ncccc\ndddd";
    doc.submitOp([{p: ['content'], t: 'text', o: [text]}]);
    assert.equal(text, codeMirror.getValue());
  });

  it('can edit a doc that has been empty', function () {
    doc.submitOp([{p: ['content'], t: 'text', o: ['']}]);
    assert.equal('', codeMirror.getValue());

    doc.submitOp([{p: ['content'], t: 'text', o: ['a']}]);
    assert.equal('a', codeMirror.getValue());
  });

  it('resets when the CodeMirror value and editor value diverge', function () {
    doc.data = {content: 'foo'};
    doc.submitOp([{p: ['content'], t: 'text', o: ['bar']}]);

    assert.equal('barfoo', codeMirror.getValue());
  });

  describe('with one line in the doc', function () {
    beforeEach(function (done) {
      doc = new MockDoc({content: 'hi'});
      codeMirror = createCodeMirror(doc, done);
    });

    it('replaces a line', function () {
      doc.submitOp([{p: ['content'], t: 'text', o: [{d: 2}, 'hello']}]);
      assert.equal('hello', codeMirror.getValue());
    });
  });

  describe('with multiple lines in the doc', function() {
    beforeEach(function (done) {
      doc = new MockDoc({content: 'three\nblind\nmice\nsee\nhow\nthey\nrun\n'});
      codeMirror = createCodeMirror(doc, done);
    });

    it('replaces a couple of lines', function () {
      doc.submitOp([{p: ['content'], t: 'text', o: [6, {d: 11}, 'evil\nrats\n']}]);
      assert.equal('three\nevil\nrats\nsee\nhow\nthey\nrun\n', codeMirror.getValue());
    });
  });
});

describe('ShareDBCodeMirror', function() {
  var doc, codeMirror, shareDBCodeMirror;

  beforeEach(function (done) {
    doc = new MockDoc({content: 'stuff'});
    document.body.innerHTML = '<textarea id="editor"></textarea>';
    codeMirror = CodeMirror.fromTextArea(document.getElementById('editor'));
    shareDBCodeMirror = ShareDBCodeMirror.attachDocToCodeMirror(doc, codeMirror, {key: 'content'}, done);
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
      assert.equal('stuff', doc.data.content);
    });

    it('ignores incoming ops', function () {
      doc.submitOp([{p: ['content'], t: 'text', o: [doc.data.length, ' more stuff']}]);
      assert.equal('stuff', codeMirror.getValue());
    });
  });
});
