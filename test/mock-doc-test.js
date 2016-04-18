var assert = require('assert');
var MockDoc = require('./mocks/mock-doc');

describe('MockDoc', function () {
  var doc;

  beforeEach(function () {
    doc = new MockDoc({content: 'abcdefg'});
  });

  it('can be created', function () {
    doc.type = null;
    doc.create({content: ''});
    assert.equal('json0', doc.type && doc.type.name);
    assert.deepEqual({content: ''}, doc.data);
  });

  it('can insert at the beginning', function () {
    doc.submitOp([{p: ['content'], t: 'text', o: ['123']}]);
    assert.equal('123abcdefg', doc.data.content);
  });

  it('can insert in the middle', function () {
    doc.submitOp([{p: ['content'], t: 'text', o: [2, '123']}]);
    assert.equal('ab123cdefg', doc.data.content);
  });

  it('can insert at the end', function () {
    doc.submitOp([{p: ['content'], t: 'text', o: [doc.data.content.length, '123']}]);
    assert.equal('abcdefg123', doc.data.content);
  });

  it('can remove from the beginning', function () {
    doc.submitOp([{p: ['content'], t: 'text', o: [{d: 2}]}]);
    assert.equal('cdefg', doc.data.content);
  });

  it('can remove from the middle', function () {
    doc.submitOp([{p: ['content'], t: 'text', o: [2, {d: 3}]}]);
    assert.equal('abfg', doc.data.content);
  });

  it('can remove from the end', function () {
    doc.submitOp([{p: ['content'], t: 'text', o: [doc.data.content.length - 2, {d: 2}]}]);
    assert.equal('abcde', doc.data.content);
  });

  it('can error out subscribe', function (done) {
    var errorOnSubscribe = doc.errorOnSubscribe = new Error("Bleh");
    doc.subscribe(function(err) {
      assert.equal(errorOnSubscribe, err);
      done();
    });
  });
});
